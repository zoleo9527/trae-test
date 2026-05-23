import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { username: 'zhangwei', name: '张伟', role: '站长', desc: '全功能权限' },
    { username: 'liming', name: '李明', role: '巡检工程师', desc: '工单/备件/发电数据' },
    { username: 'zhaohui', name: '赵慧', role: '运维内勤', desc: '并网资料/回款/工单查看' },
  ];

  const handleDemoLogin = async (demoUsername) => {
    setUsername(demoUsername);
    setPassword('123456');
    setError('');
    setLoading(true);

    try {
      await login(demoUsername, '123456');
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 px-8 py-6 text-center">
            <div className="text-4xl mb-2">☀️</div>
            <h1 className="text-2xl font-bold text-white">光伏运维管理系统</h1>
            <p className="text-blue-100 text-sm mt-1">并网资料 · 回款节点 · 工单管理</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入密码"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '登录中...' : '登 录'}
              </button>
            </form>

            <div className="mt-6">
              <p className="text-sm text-gray-500 text-center mb-3">演示账号（密码均为 123456）</p>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.username}
                    onClick={() => handleDemoLogin(account.username)}
                    disabled={loading}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <span className="font-medium text-gray-700">{account.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">{account.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          默认密码：123456
        </p>
      </div>
    </div>
  );
}
