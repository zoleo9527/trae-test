import React, { useEffect, useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Batches from './pages/Batches.jsx'
import Movements from './pages/Movements.jsx'
import Grading from './pages/Grading.jsx'
import Picking from './pages/Picking.jsx'
import Credits from './pages/Credits.jsx'
import Claims from './pages/Claims.jsx'
import Losses from './pages/Losses.jsx'
import Examples from './pages/Examples.jsx'

export default function App() {
  const [ops, setOps] = useState([])
  useEffect(() => {
    fetch('/api/operators').then(r => r.json()).then(setOps)
  }, [])
  return (
    <div className="layout">
      <aside className="side">
        <div className="brand">水果批发 · 冷库出入<br />与损耗复核</div>
        <nav>
          <NavLink to="/" end>工作台</NavLink>
          <NavLink to="/batches">批次 · 冷库</NavLink>
          <NavLink to="/movements">出入库流水</NavLink>
          <NavLink to="/grading">分级</NavLink>
          <NavLink to="/picking">配货</NavLink>
          <NavLink to="/credits">赊销结算</NavLink>
          <NavLink to="/claims">客诉赔付</NavLink>
          <NavLink to="/losses">损耗复核</NavLink>
          <NavLink to="/examples">样例回放</NavLink>
        </nav>
        <div className="meta">
          角色：<br />
          {ops.map(o => <div key={o.id}>· {o.name} / {o.role}</div>)}
          <br />
          数据留痕：每笔动作带角色、时间、备注。
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/grading" element={<Grading />} />
          <Route path="/picking" element={<Picking />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/losses" element={<Losses />} />
          <Route path="/examples" element={<Examples />} />
        </Routes>
      </main>
    </div>
  )
}
