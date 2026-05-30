'use client';

import { useAuthStore } from '@/store/auth';
import { Eye, EyeOff, Lock, Target, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/reception');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      const user = useAuthStore.getState().user;
      if (user?.role === 'manager') {
        router.push('/manager/dashboard');
      } else if (user?.role === 'coach') {
        router.push('/coach');
      } else {
        router.push('/reception');
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: string) => {
    const accounts: Record<string, { username: string; password: string }> = {
      manager: { username: 'manager', password: '123456' },
      coach: { username: 'coach1', password: '123456' },
      reception: { username: 'reception1', password: '123456' },
    };
    const acc = accounts[role];
    if (acc) {
      setUsername(acc.username);
      setPassword(acc.password);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(184,134,11,0.4) 0%, transparent 50%)',
          }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gold-800 rounded-xl flex items-center justify-center">
              <Target size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold">高尔夫练习场</h1>
              <p className="text-primary-200 text-sm">会员储值与消耗对账系统</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-serif font-bold mb-4">让每一次挥杆<br />都有清晰的记录</h2>
          <p className="text-primary-200 text-lg">
            会员储值、球道预约、器材借还、消耗对账，全流程一体化管理。
            告别信息分散，告别对账困难，让经营更高效。
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium mb-1">储值消耗全链路追溯</h3>
              <p className="text-primary-300 text-sm">每一笔储值、每一次扣减都有据可查</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium mb-1">角色权限清晰划分</h3>
              <p className="text-primary-300 text-sm">场馆经理、教练主管、前台，各司其职</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium mb-1">投诉回查有依有据</h3>
              <p className="text-primary-300 text-sm">全流程操作留痕，不再靠截图和语音</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-primary-300 text-sm">
          © 2024 高尔夫练习场管理系统 · 版本 1.0
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target size={36} className="text-white" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-800">高尔夫练习场</h1>
            <p className="text-gray-500">会员储值与消耗对账系统</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎回来</h2>
          <p className="text-gray-500 mb-8">请登录您的账户以继续</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">用户名</label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">密码</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-medium disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3 text-center">快速体验（密码均为 123456）</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => quickLogin('manager')}
                className="py-2 px-3 text-sm border border-gold-800 text-gold-800 rounded-lg hover:bg-gold-800 hover:text-white transition-colors"
              >
                场馆经理
              </button>
              <button
                onClick={() => quickLogin('coach')}
                className="py-2 px-3 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
              >
                教练主管
              </button>
              <button
                onClick={() => quickLogin('reception')}
                className="py-2 px-3 text-sm border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors"
              >
                前台
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
