import { useNavigate } from 'react-router-dom'
import { Camera, UserCircle, Users, Settings } from 'lucide-react'
import { useAuthStore, type UserRole } from '@/stores/authStore'

const roles: { role: UserRole; title: string; desc: string; icon: React.ReactNode }[] = [
  {
    role: 'owner',
    title: '店主',
    desc: '全局管理、返工决策、赔付审批',
    icon: <Settings className="w-8 h-8" />,
  },
  {
    role: 'developer',
    title: '冲印师',
    desc: '冲扫执行、质检标记、返工处理',
    icon: <Camera className="w-8 h-8" />,
  },
  {
    role: 'cs',
    title: '客服',
    desc: '客户确认、沟通记录、交付跟踪',
    icon: <Users className="w-8 h-8" />,
  },
]

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleLogin = (role: UserRole) => {
    login(role)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C4813D] text-white mb-4 shadow-lg">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">胶片冲印协作系统</h1>
          <p className="text-gray-500">选择您的身份进入工作台</p>
        </div>

        <div className="space-y-4">
          {roles.map((item) => (
            <button
              key={item.role}
              onClick={() => handleLogin(item.role)}
              className="w-full p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 text-left group hover:-translate-y-0.5"
            >
              <div className="w-14 h-14 rounded-xl bg-[#F5F0EB] flex items-center justify-center text-[#C4813D] group-hover:bg-[#C4813D] group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <UserCircle className="w-6 h-6 text-gray-300 ml-auto group-hover:text-[#C4813D] transition-colors" />
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          演示系统 · 无需账号密码
        </p>
      </div>
    </div>
  )
}
