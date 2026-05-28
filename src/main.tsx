import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
      },
      components: {
        Layout: {
          headerBg: '#001529',
          siderBg: '#001529',
        },
        Menu: {
          darkItemBg: '#001529',
          darkSubMenuItemBg: '#000c17',
        }
      }
    }}>
      <AntApp>
        <HashRouter>
          <App />
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
)
