import React, { useState } from 'react';
import { Form, Input, Button, Card, Select, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../utils/request';
import useAuthStore from '../store/authStore';

const DEMO_ACCOUNTS = [
  { username: 'bj_manager', password: '123456', role: 'store_manager', name: '张店长', store: '北京王府井店' },
  { username: 'bj_sales1', password: '123456', role: 'sales_associate', name: '李导购', store: '北京王府井店' },
  { username: 'bj_aftersale', password: '123456', role: 'after_sales', name: '赵售后', store: '北京王府井店' }
];

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = await request.post('/auth/login', values);
      login(data.token, data.user);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (account) => {
    setSelectedAccount(account.username);
    setLoading(true);
    try {
      const data = await request.post('/auth/login', { username: account.username, password: account.password });
      login(data.token, data.user);
      message.success(`已以 ${account.name} (${account.store}) 身份登录`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ maxWidth: 500, width: '100%', padding: 24 }}>
        <Card title="珠宝门店管理系统" bordered={false} style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12 }}>快速登录（演示账号）</h4>
            <Select
              style={{ width: '100%', marginBottom: 16 }}
              placeholder="选择演示账号"
              value={selectedAccount}
              onChange={(value) => {
                const account = DEMO_ACCOUNTS.find(a => a.username === value);
                handleQuickLogin(account);
              }}
              loading={loading}
            >
              {DEMO_ACCOUNTS.map(account => (
                <Select.Option key={account.username} value={account.username}>
                  {account.name} - {account.role === 'store_manager' ? '店长' : account.role === 'sales_associate' ? '导购' : '售后专员'} ({account.store})
                </Select.Option>
              ))}
            </Select>
          </div>

          <div style={{ textAlign: 'center', color: '#999', margin: '16px 0' }}>或手动登录</div>

          <Form onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="用户名" 
                size="large"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="密码" 
                size="large"
                autoComplete="current-password"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
