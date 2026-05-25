import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { username: 'manager', password: 'manager123', name: '剧院经理', desc: '排期审批、全局管理' },
    { username: 'ticket', password: 'ticket123', name: '票务主管', desc: '团单处理、退票审批、费用结算' },
    { username: 'backend', password: 'backend123', name: '后台统筹', desc: '联排安排、问题处理、场地协调' }
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🎭 剧院管理系统</h1>
        <p>演出排期 · 票务团单 · 后台联排</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>

          {error && <p style={{ color: '#ef4444', marginBottom: 16, fontSize: 14 }}>{error}</p>}
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: '#64748b' }}>测试账号</h4>
          {testAccounts.map((acc, i) => (
            <div
              key={i}
              onClick={() => { setUsername(acc.username); setPassword(acc.password); }}
              style={{
                padding: 12,
                background: '#f8fafc',
                borderRadius: 8,
                marginBottom: 8,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{acc.name}</div>
              <div style={{ color: '#64748b' }}>{acc.username} / {acc.password}</div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{acc.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
