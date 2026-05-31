import { Eye, EyeOff, Sprout } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { testAccounts } from '../utils/mockData';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      setError('用户名或密码错误');
    }
  };

  const handleQuickLogin = (role: 'manager' | 'chef' | 'customer_service') => {
    const account = testAccounts[role];
    setUsername(account.username);
    setPassword(account.password);
  };

  const roleNames: Record<string, string> = {
    manager: '门店主理人',
    chef: '后厨负责人',
    customer_service: '客服'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bakery-brown-50 via-bakery-cream to-matcha-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-bakery-brown-500 to-bakery-brown-600 rounded-2xl mb-4 shadow-lg">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-bakery-brown-800 mb-2">手作烘焙坊</h1>
            <p className="text-gray-500 text-sm">预订接单与产能排期系统</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none"
                placeholder="请输入用户名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none pr-12"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-alert-50 text-alert-600 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-bakery-brown-600 to-bakery-brown-700 text-white py-3 rounded-xl font-medium hover:from-bakery-brown-700 hover:to-bakery-brown-800 transition-all shadow-lg shadow-bakery-brown-500/30"
            >
              登录
            </button>
          </form>

          <div className="mt-8">
            <p className="text-sm text-gray-500 text-center mb-4">快速登录演示账号</p>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(testAccounts) as Array<keyof typeof testAccounts>).map((role) => (
                <button
                  key={role}
                  onClick={() => handleQuickLogin(role)}
                  className="flex flex-col items-center p-3 border border-gray-100 rounded-xl hover:border-bakery-brown-300 hover:bg-bakery-brown-50 transition-all"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    role === 'manager' ? 'bg-bakery-brown-100 text-bakery-brown-600' :
                    role === 'chef' ? 'bg-matcha-100 text-matcha-600' :
                    'bg-sky-100 text-sky-600'
                  }`}>
                    {role === 'manager' ? '管' : role === 'chef' ? '厨' : '客'}
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{roleNames[role]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          点击角色卡片可自动填充账号信息
        </p>
      </div>
    </div>
  );
};
