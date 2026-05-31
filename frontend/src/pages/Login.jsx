import { useState } from 'react'
import { Form, Input, Button, Card, message, Select } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authAPI } from '../services/api'
import useAuthStore from '../stores/useAuthStore'
import { useNavigate } from 'react-router-dom'

const roleLabels = {
  admin: '系统管理员',
  manager: '项目主管',
  scheduler: '排班专员',
  inspector: '质检员',
  cleaner: '清洁员'
}

function Login() {
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('manager')
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const demoUsers = {
    admin: { username: 'admin', password: '123456' },
    manager: { username: 'manager1', password: '123456' },
    scheduler: { username: 'scheduler1', password: '123456' },
    inspector: { username: 'inspector1', password: '123456' },
    cleaner: { username: 'cleaner1', password: '123456' }
  }

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const userCreds = demoUsers[selectedRole]
      const res = await authAPI.login(userCreds.username, userCreds.password)
      login(res.data.user, res.data.token)
      message.success('登录成功')
      navigate('/dashboard')
    } catch (err) {
      message.error(err.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        title="商用清洁管理系统" 
        style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <Form
          name="login"
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item label="选择角色">
            <Select value={selectedRole} onChange={setSelectedRole}>
              {Object.entries(roleLabels).map(([key, label]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12 }}>
              演示账号：{demoUsers[selectedRole].username} / {demoUsers[selectedRole].password}
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录系统
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
