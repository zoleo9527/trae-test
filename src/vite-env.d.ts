/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  db: {
    query: (sql: string, params?: any[]) => Promise<any[]>
    run: (sql: string, params?: any[]) => Promise<{ changes: number; lastInsertRowid: number }>
    transaction: (statements: { sql: string; params?: any[] }[]) => Promise<void>
  }
  app: {
    getAppDataPath: () => Promise<string>
    getCurrentUser: () => Promise<User | null>
    setCurrentUser: (user: User | null) => Promise<void>
  }
}
