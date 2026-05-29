import { useState } from 'react'
import { Form, Input, Button, Select, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import type { User } from '../types'

interface LoginProps {
  onLogin: (user: User) => void
}

export default function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const user = await window.electronAPI.login(values.username, values.password)
      if (user) {
        message.success('登录成功')
        onLogin(user)
      } else {
        message.error('用户名或密码错误')
      }
    } catch (e) {
      message.error('登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">洗涤工厂管理系统</h1>
        <Form
          form={form}
          onFinish={handleLogin}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ marginTop: 20, color: '#666', fontSize: 12, textAlign: 'center' }}>
          <p>测试账号：</p>
          <p>厂长: factory / 123456</p>
          <p>质检员: inspector / 123456</p>
          <p>门店: store / 123456</p>
        </div>
      </div>
    </div>
  )
}
