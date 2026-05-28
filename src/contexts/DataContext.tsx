import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface DataContextType {
  refreshVersion: number
  triggerRefresh: () => void
}

const DataContext = createContext<DataContextType>({
  refreshVersion: 0,
  triggerRefresh: () => {}
})

export const useDataRefresh = () => useContext(DataContext)

export function DataProvider({ children }: { children: ReactNode }) {
  const [refreshVersion, setRefreshVersion] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshVersion(v => v + 1)
  }, [])

  useEffect(() => {
    const cleanup = window.electronAPI.onDatabaseRestored(() => {
      triggerRefresh()
    })
    return cleanup
  }, [triggerRefresh])

  return (
    <DataContext.Provider value={{ refreshVersion, triggerRefresh }}>
      {children}
    </DataContext.Provider>
  )
}
