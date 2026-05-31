import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification, UserRole } from '~/types'
import { mockNotifications } from '~/data/notifications'
import { useUserStore } from './user'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([...mockNotifications])
  const showToast = ref(false)
  const toastMessage = ref<{ type: string; message: string } | null>(null)

  const userStore = useUserStore()

  const myNotifications = computed(() => {
    if (!userStore.currentRole) return []
    return notifications.value
      .filter(n => n.recipientRole.includes(userStore.currentRole!))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const unreadCount = computed(() => {
    return myNotifications.value.filter(n => !n.read).length
  })

  function markAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function markAllAsRead() {
    myNotifications.value.forEach(n => {
      n.read = true
    })
  }

  function addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString()
    }
    notifications.value.unshift(newNotification)

    if (notification.recipientRole.includes(userStore.currentRole!)) {
      showToastMessage(notification.type, notification.title)
    }
  }

  function showToastMessage(type: string, message: string) {
    toastMessage.value = { type, message }
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
      toastMessage.value = null
    }, 3000)
  }

  function getNotificationsForRole(role: UserRole): Notification[] {
    return notifications.value
      .filter(n => n.recipientRole.includes(role))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return {
    notifications,
    myNotifications,
    unreadCount,
    showToast,
    toastMessage,
    markAsRead,
    markAllAsRead,
    addNotification,
    showToastMessage,
    getNotificationsForRole
  }
})
