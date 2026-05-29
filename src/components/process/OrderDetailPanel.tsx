import { MapPin, Clock, Phone, ShoppingBag, User } from 'lucide-react';
import { useProcessStore } from '@/store/process.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';

export function OrderDetailPanel() {
  const { order, selectedResponsibility } = useProcessStore();

  if (!order) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-500 text-center py-8">请先选择订单</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'exception': return 'danger';
      case 'cancelled': return 'warning';
      case 'picked_up': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待取餐';
      case 'picked_up': return '配送中';
      case 'delivered': return '已送达';
      case 'cancelled': return '已取消';
      case 'exception': return '异常';
      default: return status;
    }
  };

  const merchantDelay = Math.max(0, Math.round(
    (new Date(order.merchantReadyTime).getTime() - new Date(order.createdAt).getTime()) / 60000
  ));
  const pickupDelay = Math.max(0, Math.round(
    (new Date(order.pickedUpTime).getTime() - new Date(order.merchantReadyTime).getTime()) / 60000
  ));
  const deliveryDelay = Math.max(0, Math.round(
    (new Date(order.deliveredTime).getTime() - new Date(order.pickedUpTime).getTime()) / 60000
  ));
  const totalDelay = merchantDelay + pickupDelay + deliveryDelay;
  const promisedDelay = Math.max(0, Math.round(
    (new Date(order.deliveredTime).getTime() - new Date(order.promisedTime).getTime()) / 60000
  ));

  const isTimeout = new Date(order.deliveredTime) > new Date(order.promisedTime);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                订单信息
                <span className="font-mono text-sm text-gray-500 font-normal">{order.id}</span>
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {formatDateTime(order.createdAt)} 创建
              </p>
            </div>
            <StatusBadge
              status={order.status}
              label={getStatusLabel(order.status)}
              variant={getStatusVariant(order.status)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <ShoppingBag className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.merchantName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.userName}</p>
                  <p className="text-xs text-gray-500">{order.userPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">骑手：{order.riderName}</p>
                  <p className="text-xs text-gray-500">{order.region}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    承诺送达：{formatTime(order.promisedTime)}
                  </p>
                  <p className={cn(
                    'text-sm',
                    isTimeout ? 'text-accent-red font-medium' : 'text-gray-600'
                  )}>
                    实际送达：{formatTime(order.deliveredTime)}
                    {isTimeout && <span className="ml-2">（超时 {promisedDelay} 分钟）</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">配送时间分析</h4>
            <div className="flex items-stretch h-8 rounded-md overflow-hidden bg-gray-100">
              {merchantDelay > 0 && (
                <div
                  className="bg-amber-400 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(merchantDelay / totalDelay) * 100}%` }}
                  title={`商家出餐：${merchantDelay}分钟 (${Math.round(merchantDelay / totalDelay * 100)}%)`}
                >
                  出餐 {merchantDelay}m
                </div>
              )}
              {pickupDelay > 0 && (
                <div
                  className="bg-blue-400 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(pickupDelay / totalDelay) * 100}%` }}
                  title={`取餐耗时：${pickupDelay}分钟 (${Math.round(pickupDelay / totalDelay * 100)}%)`}
                >
                  取餐 {pickupDelay}m
                </div>
              )}
              {deliveryDelay > 0 && (
                <div
                  className="bg-green-400 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(deliveryDelay / totalDelay) * 100}%` }}
                  title={`配送耗时：${deliveryDelay}分钟 (${Math.round(deliveryDelay / totalDelay * 100)}%)`}
                >
                  配送 {deliveryDelay}m
                </div>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>商家出餐 {merchantDelay} 分钟 ({Math.round(merchantDelay / totalDelay * 100)}%)</span>
              <span>取餐 {pickupDelay} 分钟 ({Math.round(pickupDelay / totalDelay * 100)}%)</span>
              <span>配送 {deliveryDelay} 分钟 ({Math.round(deliveryDelay / totalDelay * 100)}%)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">订单商品</h4>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">¥{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">订单金额</span>
              <span className="text-lg font-bold text-primary-700">¥{order.amount}</span>
            </div>
          </div>

          {selectedResponsibility && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">系统建议责任方：</span>
                <Tag variant={selectedResponsibility === 'rider' ? 'danger' : selectedResponsibility === 'merchant' ? 'warning' : 'info'}>
                  {getPartyLabel(selectedResponsibility)}
                </Tag>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">关联记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {order.hasAppeal && <Tag variant="warning">有申诉</Tag>}
            {order.hasSubsidy && <Tag variant="success">有补贴</Tag>}
            {order.hasAssessment && <Tag variant="danger">有考核</Tag>}
            {order.hasTraining && <Tag variant="info">有培训</Tag>}
            {!order.hasAppeal && !order.hasSubsidy && !order.hasAssessment && !order.hasTraining && (
              <span className="text-sm text-gray-400">暂无关联记录</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPartyLabel(party: string): string {
  const labels: Record<string, string> = {
    rider: '骑手',
    merchant: '商家',
    platform: '平台',
    user: '用户',
    unclear: '待判定',
  };
  return labels[party] || party;
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
