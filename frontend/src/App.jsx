import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import QuoteDetail from './pages/QuoteDetail';

function App() {
  return (
    <div className="layout">
      <header className="header">
        <h1>🎁 礼品定制 - 客户报价与审批留痕系统</h1>
        <div style={{ fontSize: '14px', opacity: 0.85 }}>
          当前用户：张三（商务部）
        </div>
      </header>
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quote/:id" element={<QuoteDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
