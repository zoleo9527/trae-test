import django_filters
from django.db.models import Q, Count, Sum, F
from .models import (
    Store, StoreGroup, Product, Inventory,
    ReplenishmentPlan, ReplenishmentOrder, ReplenishmentItem,
    TransferOrder, TransferItem, DisplayRecord, MemberRedemption, AuditLog
)


class StoreFilter(django_filters.FilterSet):
    group = django_filters.NumberFilter(field_name='group_id')
    is_active = django_filters.BooleanFilter()
    keyword = django_filters.CharFilter(method='filter_keyword')

    class Meta:
        model = Store
        fields = ['code', 'name', 'group', 'is_active']

    def filter_keyword(self, queryset, name, value):
        return queryset.filter(Q(code__icontains=value) | Q(name__icontains=value))


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(lookup_expr='icontains')
    status = django_filters.CharFilter()
    is_collaboration = django_filters.BooleanFilter()
    collaboration_brand = django_filters.CharFilter(lookup_expr='icontains')
    low_stock = django_filters.BooleanFilter(method='filter_low_stock')
    keyword = django_filters.CharFilter(method='filter_keyword')

    class Meta:
        model = Product
        fields = ['sku', 'name', 'category', 'status', 'is_collaboration']

    def filter_keyword(self, queryset, name, value):
        return queryset.filter(
            Q(sku__icontains=value) | Q(name__icontains=value) |
            Q(collaboration_brand__icontains=value)
        )

    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(
                inventories__quantity__lte=F('safe_stock')
            ).distinct()
        return queryset


class InventoryFilter(django_filters.FilterSet):
    store = django_filters.NumberFilter(field_name='store_id')
    product = django_filters.NumberFilter(field_name='product_id')
    store_group = django_filters.NumberFilter(field_name='store__group_id')
    category = django_filters.CharFilter(field_name='product__category', lookup_expr='icontains')
    low_stock = django_filters.BooleanFilter(method='filter_low_stock')
    shortage = django_filters.BooleanFilter(method='filter_shortage')
    keyword = django_filters.CharFilter(method='filter_keyword')

    class Meta:
        model = Inventory
        fields = ['store', 'product']

    def filter_keyword(self, queryset, name, value):
        return queryset.filter(
            Q(product__sku__icontains=value) | Q(product__name__icontains=value) |
            Q(store__code__icontains=value) | Q(store__name__icontains=value)
        )

    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(quantity__lte=F('product__safe_stock'))
        return queryset

    def filter_shortage(self, queryset, name, value):
        if value:
            return queryset.filter(quantity=0)
        return queryset


class ReplenishmentOrderFilter(django_filters.FilterSet):
    store = django_filters.NumberFilter(field_name='store_id')
    store_group = django_filters.NumberFilter(field_name='store__group_id')
    plan = django_filters.NumberFilter(field_name='plan_id')
    status = django_filters.CharFilter()
    priority = django_filters.NumberFilter()
    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    date_to = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    submitted_date_from = django_filters.DateFilter(field_name='submitted_at', lookup_expr='date__gte')
    submitted_date_to = django_filters.DateFilter(field_name='submitted_at', lookup_expr='date__lte')
    has_deviation = django_filters.BooleanFilter(method='filter_deviation')
    keyword = django_filters.CharFilter(method='filter_keyword')

    class Meta:
        model = ReplenishmentOrder
        fields = ['code', 'status', 'priority', 'store', 'plan']

    def filter_keyword(self, queryset, name, value):
        return queryset.filter(
            Q(code__icontains=value) | Q(remark__icontains=value) |
            Q(store__name__icontains=value) | Q(store__code__icontains=value)
        )

    def filter_deviation(self, queryset, name, value):
        if value:
            return queryset.filter(
                items__shipped_quantity__isnull=False,
                items__received_quantity__isnull=False
            ).annotate(
                deviation_count=Count(
                    'items',
                    filter=~Q(items__shipped_quantity=F('items__received_quantity'))
                )
            ).filter(deviation_count__gt=0)
        return queryset


class TransferOrderFilter(django_filters.FilterSet):
    from_store = django_filters.NumberFilter(field_name='from_store_id')
    to_store = django_filters.NumberFilter(field_name='to_store_id')
    store = django_filters.NumberFilter(method='filter_store')
    store_group = django_filters.NumberFilter(method='filter_store_group')
    status = django_filters.CharFilter()
    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    date_to = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    keyword = django_filters.CharFilter(method='filter_keyword')

    class Meta:
        model = TransferOrder
        fields = ['code', 'status', 'from_store', 'to_store']

    def filter_keyword(self, queryset, name, value):
        return queryset.filter(
            Q(code__icontains=value) | Q(reason__icontains=value) |
            Q(from_store__name__icontains=value) | Q(to_store__name__icontains=value)
        )

    def filter_store(self, queryset, name, value):
        return queryset.filter(Q(from_store_id=value) | Q(to_store_id=value))

    def filter_store_group(self, queryset, name, value):
        return queryset.filter(
            Q(from_store__group_id=value) | Q(to_store__group_id=value)
        )


class DisplayRecordFilter(django_filters.FilterSet):
    store = django_filters.NumberFilter(field_name='store_id')
    store_group = django_filters.NumberFilter(field_name='store__group_id')
    product = django_filters.NumberFilter(field_name='product_id')
    status = django_filters.CharFilter()
    issue_type = django_filters.CharFilter()
    check_date_from = django_filters.DateFilter(field_name='check_date', lookup_expr='gte')
    check_date_to = django_filters.DateFilter(field_name='check_date', lookup_expr='lte')
    overdue = django_filters.BooleanFilter(method='filter_overdue')
    has_overdue = django_filters.BooleanFilter(method='filter_overdue')
    keyword = django_filters.CharFilter(method='filter_keyword')

    class Meta:
        model = DisplayRecord
        fields = ['status', 'issue_type', 'store', 'product']

    def filter_keyword(self, queryset, name, value):
        return queryset.filter(
            Q(description__icontains=value) | Q(fix_note__icontains=value) |
            Q(store__name__icontains=value) | Q(product__name__icontains=value)
        )

    def filter_overdue(self, queryset, name, value):
        from django.utils import timezone
        from .models import DisplayRecordStatus
        if value:
            seven_days_ago = timezone.localdate() - timezone.timedelta(days=7)
            return queryset.filter(
                status=DisplayRecordStatus.PENDING,
                check_date__lte=seven_days_ago
            )
        return queryset


class MemberRedemptionFilter(django_filters.FilterSet):
    store = django_filters.NumberFilter(field_name='store_id')
    product = django_filters.NumberFilter(field_name='product_id')
    status = django_filters.CharFilter()
    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    date_to = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    keyword = django_filters.CharFilter(method='filter_keyword')

    class Meta:
        model = MemberRedemption
        fields = ['code', 'status', 'store', 'product']

    def filter_keyword(self, queryset, name, value):
        return queryset.filter(
            Q(code__icontains=value) | Q(member_name__icontains=value) |
            Q(member_phone__icontains=value) | Q(product__name__icontains=value)
        )


class AuditLogFilter(django_filters.FilterSet):
    user = django_filters.NumberFilter(field_name='user_id')
    action = django_filters.CharFilter()
    model_name = django_filters.CharFilter()
    object_id = django_filters.CharFilter()
    date_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    keyword = django_filters.CharFilter(method='filter_keyword')

    class Meta:
        model = AuditLog
        fields = ['user', 'action', 'model_name', 'object_id']

    def filter_keyword(self, queryset, name, value):
        return queryset.filter(
            Q(object_repr__icontains=value) | Q(change_message__icontains=value) |
            Q(field_name__icontains=value) | Q(user__username__icontains=value)
        )
