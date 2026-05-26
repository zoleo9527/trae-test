import { defineStore } from 'pinia'
import { ref } from 'vue'

export type UserRole = 'sales' | 'coordinator' | 'manager' | 'installer'

export interface UserInfo {
  name: string
  role: UserRole
  roleName: string
}

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<UserInfo>({
    name: '展厅经理-王姐',
    role: 'manager',
    roleName: '展厅经理'
  })

  const roleList: UserInfo[] = [
    { name: '展厅经理-王姐', role: 'manager', roleName: '展厅经理' },
    { name: '展厅经理-赵总', role: 'manager', roleName: '展厅经理' },
    { name: '销售顾问-小林', role: 'sales', roleName: '销售顾问' },
    { name: '销售顾问-小周', role: 'sales', roleName: '销售顾问' },
    { name: '销售顾问-小吴', role: 'sales', roleName: '销售顾问' },
    { name: '安装协调-张工', role: 'coordinator', roleName: '安装协调' },
    { name: '安装协调-李工', role: 'coordinator', roleName: '安装协调' },
    { name: '安装协调-王工', role: 'coordinator', roleName: '安装协调' },
    { name: '安装师傅-李安装', role: 'installer', roleName: '安装师傅' },
  ]

  function switchUser(user: UserInfo) {
    currentUser.value = user
    localStorage.setItem('currentUser', user.name)
  }

  return {
    currentUser,
    roleList,
    switchUser
  }
})
