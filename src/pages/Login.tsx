import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Zap, Users, Eye, EyeOff, ShieldCheck, Wrench, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

const roleCards = [
  {
    role: 'admin',
    username: 'admin',
    name: '站长',
    description: '全局视图、超时监控、工单审核',
    icon: ShieldCheck,
    color: 'from-blue-500 to-blue-600',
  },
  {
    role: 'engineer',
    username: 'engineer',
    name: '巡检工程师',
    description: '工单接收、现场处理、备件领用',
    icon: Wrench,
    color: 'from-orange-500 to-orange-600',
  },
  {
    role: 'staff',
    username: 'staff',
    name: '运维内勤',
    description: '工单创建、备件管理、数据统计',
    icon: FileText,
    color: 'from-green-500 to-green-600',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!selectedRole) {
      setError('请选择登录角色');
      return;
    }

    setIsLoading(true);
    setError('');

    await new Promise((resolve) => setTimeout(resolve, 800));

    const roleConfig = roleCards.find((r) => r.role === selectedRole);
    if (roleConfig && login(roleConfig.username, password)) {
      navigate('/dashboard');
    } else {
      setError('密码错误，请重试');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10 p-12 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">光伏运维系统</h1>
              <p className="text-slate-400 text-sm">PV Operation & Management</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            智能巡检
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              全流程闭环管理
            </span>
          </h2>
          
          <p className="text-slate-400 text-lg mb-12 max-w-md">
            整合发电预警、巡检工单、备件领用，告别Excel和微信群的低效协作模式。
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium">实时预警</p>
                <p className="text-sm text-slate-500">发电异常自动检测，即时推送告警</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium">工单追踪</p>
                <p className="text-sm text-slate-500">全流程可视化，超时自动提醒</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium">角色协作</p>
                <p className="text-sm text-slate-500">站长、工程师、内勤无缝衔接</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Sun className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">光伏运维系统</h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center lg:text-left">
            登录系统
          </h2>
          <p className="text-slate-400 mb-8 text-center lg:text-left">
            选择您的角色开始工作
          </p>

          <div className="space-y-3 mb-6">
            {roleCards.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.role;
              return (
                <button
                  key={role.role}
                  onClick={() => {
                    setSelectedRole(role.role);
                    setError('');
                  }}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center transition-transform',
                        role.color,
                        isSelected && 'scale-110'
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{role.name}</p>
                      <p className="text-sm text-slate-400">{role.description}</p>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                      )}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="输入密码"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={cn(
              'w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200',
              isLoading
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:-translate-y-0.5'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                登录中...
              </span>
            ) : (
              '登 录'
            )}
          </button>

          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-sm text-slate-400 mb-2">演示账号密码：</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-slate-300">
                <span className="text-blue-400">站长:</span> admin123
              </div>
              <div className="text-slate-300">
                <span className="text-orange-400">工程师:</span> engineer123
              </div>
              <div className="text-slate-300">
                <span className="text-green-400">内勤:</span> staff123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
