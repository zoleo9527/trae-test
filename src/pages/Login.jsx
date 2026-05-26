import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const testAccounts = [
    { username: 'manager', name: '张明远', role: '经销负责人', desc: '全盘管理' },
    { username: 'sales1', name: '李雪琴', role: '业务员', desc: '销售/客户' },
    { username: 'warehouse1', name: '赵大宝', role: '仓管', desc: '仓储/盘点' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.auth.login(username, password);
      onLogin(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (account) => {
    setUsername(account.username);
    setPassword('123456');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tea-50 to-tea-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-tea-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
            茶
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">茶叶经销库存管理</h1>
          <p className="text-gray-500">库存盘点与损耗上报系统</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                className="input"
                placeholder="请输入用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="label">密码</label>
              <input
                type="password"
                className="input"
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3 text-center">测试账号（密码均为 123456）</p>
            <div className="grid grid-cols-3 gap-2">
              {testAccounts.map(account => (
                <button
                  key={account.username}
                  onClick={() => handleQuickLogin(account)}
                  className="p-3 bg-gray-50 hover:bg-tea-50 rounded-xl text-center transition-colors border border-transparent hover:border-tea-200"
                >
                  <p className="font-medium text-gray-800 text-sm">{account.name}</p>
                  <p className="text-xs text-gray-500">{account.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          © 2024 茶叶经销库存管理系统
        </p>
      </div>
    </div>
  );
}
