import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Headphones, Shield, ArrowRight } from 'lucide-react';
import { useAppStore, getRoleName } from '@/store/app.store';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

const roles: Array<{
  role: UserRole;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
  color: string;
}> = [
  {
    role: 'manager',
    icon: Shield,
    description: '全局数据监控与规则配置',
    features: ['全局看板', '考核规则配置', '培训计划管理', '跨角色协调'],
    color: 'from-blue-600 to-blue-800',
  },
  {
    role: 'dispatcher',
    icon: Users,
    description: '订单异常处理与骑手调度',
    features: ['超时判定', '补贴审核', '考核发起', '骑手信息查询'],
    color: 'from-amber-500 to-orange-600',
  },
  {
    role: 'customer_service',
    icon: Headphones,
    description: '用户申诉与退款处理',
    features: ['申诉处理', '退款审核', '问题转派', '订单查询'],
    color: 'from-green-500 to-emerald-600',
  },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">骑手考核与培训记录系统</h1>
          <p className="text-primary-300">整合订单、申诉、补贴、考核、培训全链路数据</p>
          <p className="text-primary-400 text-sm mt-1">实现从问题发现到培训跟进的完整业务闭环</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map(role => {
            const RoleIcon = role.icon;
            return (
              <Card
                key={role.role}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => handleLogin(role.role)}
                padding="none"
              >
                <div className={cn('h-2 bg-gradient-to-r', role.color)} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white',
                      role.color
                    )}>
                      <RoleIcon className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {getRoleName(role.role)}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{role.description}</p>

                  <div className="space-y-2">
                    {role.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Button
                      className={cn('w-full bg-gradient-to-r', role.color)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogin(role.role);
                      }}
                    >
                      进入系统
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-primary-400 text-sm">
            演示系统：点击上方角色卡片即可进入对应角色的工作界面
          </p>
          <p className="text-primary-500 text-xs mt-2">
            可在系统内通过顶部角色切换功能体验不同角色视角
          </p>
        </div>
      </div>
    </div>
  );
}
