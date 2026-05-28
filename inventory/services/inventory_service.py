from django.db import transaction
from django.db.models import F
from django.utils import timezone
from ..models import Inventory, Product, Store, ProductStatus
from ..exceptions import (
    InventoryShortageException, ValidationFailedException,
    CollaborationSyncException
)
import logging

logger = logging.getLogger(__name__)


class InventoryService:
    """库存服务 - 库存操作、联名商品同步、数据偏差检测"""

    @staticmethod
    def get_inventory(store, product):
        """获取或创建库存记录"""
        inv, created = Inventory.objects.get_or_create(
            store=store,
            product=product,
            defaults={
                'quantity': 0,
                'reserved_quantity': 0,
            }
        )
        return inv

    @staticmethod
    @transaction.atomic
    def add_stock(store, product, quantity, reason='', check_safe_stock=True):
        """增加库存"""
        if quantity <= 0:
            raise ValidationFailedException(detail='入库数量必须大于0')

        inv = InventoryService.get_inventory(store, product)
        old_qty = inv.quantity
        inv.quantity = F('quantity') + quantity
        inv.save()
        inv.refresh_from_db()

        if check_safe_stock and inv.quantity <= product.safe_stock:
            logger.warning(
                f'Store {store.code} product {product.sku} stock {inv.quantity} '
                f'is below safe stock {product.safe_stock}'
            )

        logger.info(
            f'Stock added: store={store.code}, product={product.sku}, '
            f'quantity={quantity}, old={old_qty}, new={inv.quantity}, reason={reason}'
        )
        return inv

    @staticmethod
    @transaction.atomic
    def reduce_stock(store, product, quantity, reason=''):
        """扣减库存"""
        if quantity <= 0:
            raise ValidationFailedException(detail='出库数量必须大于0')

        inv = InventoryService.get_inventory(store, product)
        if inv.available_quantity < quantity:
            raise InventoryShortageException(
                detail=f'商品【{product.name}】库存不足，当前可用: {inv.available_quantity}, 需要: {quantity}'
            )

        old_qty = inv.quantity
        inv.quantity = F('quantity') - quantity
        inv.save()
        inv.refresh_from_db()

        if inv.quantity <= product.safe_stock:
            logger.warning(
                f'Store {store.code} product {product.sku} stock {inv.quantity} '
                f'is below safe stock {product.safe_stock}'
            )

        logger.info(
            f'Stock reduced: store={store.code}, product={product.sku}, '
            f'quantity={quantity}, old={old_qty}, new={inv.quantity}, reason={reason}'
        )
        return inv

    @staticmethod
    @transaction.atomic
    def reserve_stock(store, product, quantity, reason=''):
        """预留库存"""
        if quantity <= 0:
            raise ValidationFailedException(detail='预留数量必须大于0')

        inv = InventoryService.get_inventory(store, product)
        if inv.available_quantity < quantity:
            raise InventoryShortageException(
                detail=f'商品【{product.name}】可用库存不足，无法预留。'
                       f'当前可用: {inv.available_quantity}, 需要: {quantity}'
            )

        old_reserved = inv.reserved_quantity
        inv.reserved_quantity = F('reserved_quantity') + quantity
        inv.save()
        inv.refresh_from_db()

        logger.info(
            f'Stock reserved: store={store.code if store else "HQ"}, product={product.sku}, '
            f'quantity={quantity}, old_reserved={old_reserved}, new_reserved={inv.reserved_quantity}, reason={reason}'
        )
        return inv

    @staticmethod
    @transaction.atomic
    def release_reservation(store, product, quantity, reason=''):
        """释放预留库存"""
        if quantity <= 0:
            raise ValidationFailedException(detail='释放数量必须大于0')

        inv = InventoryService.get_inventory(store, product)
        if inv.reserved_quantity < quantity:
            raise ValidationFailedException(
                detail=f'商品【{product.name}】预留库存不足，无法释放。'
                       f'当前预留: {inv.reserved_quantity}, 释放: {quantity}'
            )

        old_reserved = inv.reserved_quantity
        inv.reserved_quantity = F('reserved_quantity') - quantity
        inv.save()
        inv.refresh_from_db()

        logger.info(
            f'Reservation released: store={store.code if store else "HQ"}, product={product.sku}, '
            f'quantity={quantity}, old_reserved={old_reserved}, new_reserved={inv.reserved_quantity}, reason={reason}'
        )
        return inv

    @staticmethod
    @transaction.atomic
    def release_reserved_and_add(store, product, reserved_quantity, add_quantity, reason=''):
        """释放预留并入库（收货场景）"""
        inv = InventoryService.get_inventory(store, product)

        if reserved_quantity > 0:
            if inv.reserved_quantity < reserved_quantity:
                raise ValidationFailedException(
                    detail=f'商品【{product.name}】预留库存不足'
                )
            inv.reserved_quantity = F('reserved_quantity') - reserved_quantity

        if add_quantity > 0:
            inv.quantity = F('quantity') + add_quantity

        inv.save()
        inv.refresh_from_db()

        logger.info(
            f'Receive stock: store={store.code}, product={product.sku}, '
            f'release_reserved={reserved_quantity}, add={add_quantity}, '
            f'new_qty={inv.quantity}, new_reserved={inv.reserved_quantity}, reason={reason}'
        )
        return inv

    @staticmethod
    @transaction.atomic
    def cancel_reservation(store, product, quantity, reason=''):
        """取消预留（退回预留到可用库存）"""
        return InventoryService.release_reservation(store, product, quantity, reason)

    @staticmethod
    @transaction.atomic
    def transfer(from_store, to_store, product, quantity, reserved_quantity=0, reason=''):
        """跨店调拨"""
        if from_store == to_store:
            raise ValidationFailedException(detail='转出门店和转入门店不能相同')

        from_inv = InventoryService.get_inventory(from_store, product)
        to_inv = InventoryService.get_inventory(to_store, product)

        if reserved_quantity > 0:
            if from_inv.reserved_quantity < reserved_quantity:
                raise ValidationFailedException(detail='预留库存不足')
            from_inv.reserved_quantity = F('reserved_quantity') - reserved_quantity

        transfer_qty = min(quantity, reserved_quantity) if reserved_quantity > 0 else quantity
        if from_inv.quantity < transfer_qty:
            raise InventoryShortageException(
                detail=f'门店【{from_store.name}】商品【{product.name}】库存不足'
            )

        from_inv.quantity = F('quantity') - transfer_qty
        to_inv.quantity = F('quantity') + transfer_qty

        from_inv.save()
        to_inv.save()

        logger.info(
            f'Transfer: from={from_store.code}, to={to_store.code}, '
            f'product={product.sku}, quantity={transfer_qty}, reason={reason}'
        )
        return from_inv, to_inv

    @staticmethod
    def check_deviation(product):
        """检查库存数据偏差"""
        inventories = Inventory.objects.filter(product=product).select_related('store')
        deviations = []
        for inv in inventories:
            if inv.last_counted_at:
                days_since_count = (timezone.now() - inv.last_counted_at).days
                if days_since_count > 30 and inv.quantity > 0:
                    deviations.append({
                        'store': inv.store.code,
                        'store_name': inv.store.name,
                        'quantity': inv.quantity,
                        'reserved_quantity': inv.reserved_quantity,
                        'days_since_count': days_since_count,
                        'risk': '高',
                    })

            if inv.quantity > 0 and inv.quantity < inv.reserved_quantity:
                deviations.append({
                    'store': inv.store.code,
                    'store_name': inv.store.name,
                    'quantity': inv.quantity,
                    'reserved_quantity': inv.reserved_quantity,
                    'risk': '极高',
                    'issue': '预留库存超过实际库存'
                })

        return deviations

    @staticmethod
    @transaction.atomic
    def sync_collaboration_product(product, target_status, user):
        """同步联名商品上下架状态到所有门店"""
        if not product.is_collaboration:
            raise CollaborationSyncException(detail='只有联名商品需要同步')

        if target_status == ProductStatus.DELISTED:
            pending_orders = product.replenishmentitem_set.filter(
                order__status__in=['draft', 'submitted', 'reviewing']
            ).count()
            if pending_orders > 0:
                raise CollaborationSyncException(
                    detail=f'该联名商品存在{pending_orders}条待处理补货单，无法下架'
                )

        old_status = product.status
        product.status = target_status
        product.save()

        store_count = Store.objects.filter(is_active=True).count()
        inv_count = Inventory.objects.filter(product=product).count()

        logger.info(
            f'Collaboration product {product.sku} synced: {old_status} -> {target_status}, '
            f'affected stores: {store_count}, inventory records: {inv_count}, by {user.username}'
        )

        return {
            'product': product,
            'old_status': old_status,
            'new_status': target_status,
            'affected_stores': store_count,
            'inventory_records': inv_count,
        }

    @staticmethod
    @transaction.atomic
    def update_product_status(product, target_status, user):
        """统一的商品状态更新入口，带待处理补货单校验"""
        if target_status == ProductStatus.DELISTED:
            pending_orders = product.replenishmentitem_set.filter(
                order__status__in=['draft', 'submitted', 'reviewing']
            ).count()
            if pending_orders > 0:
                raise ValidationFailedException(
                    detail=f'该商品存在{pending_orders}条待处理补货单，无法下架'
                )

        old_status = product.status
        product.status = target_status
        product.save()

        logger.info(
            f'Product {product.sku} status updated: {old_status} -> {target_status}, by {user.username}'
        )

        return {
            'product': product,
            'old_status': old_status,
            'new_status': target_status,
        }

    @staticmethod
    def get_low_stock_alerts(store=None, threshold_days=7):
        """获取低库存预警"""
        from django.db.models import F, Q

        queryset = Inventory.objects.select_related('store', 'product').filter(
            quantity__lte=F('product__safe_stock')
        )

        if store:
            queryset = queryset.filter(store=store)

        alerts = []
        for inv in queryset:
            avg_consumption = 5
            estimated_days = inv.quantity // avg_consumption if avg_consumption > 0 else 0
            urgency = '正常'
            if estimated_days <= 1:
                urgency = '特急'
            elif estimated_days <= 3:
                urgency = '紧急'
            elif estimated_days <= threshold_days:
                urgency = '预警'

            alerts.append({
                'store': inv.store.code,
                'store_name': inv.store.name,
                'product': inv.product.sku,
                'product_name': inv.product.name,
                'quantity': inv.quantity,
                'safe_stock': inv.product.safe_stock,
                'estimated_days': estimated_days,
                'urgency': urgency,
            })

        return sorted(alerts, key=lambda x: x['estimated_days'])
