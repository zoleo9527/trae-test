import React from 'react'
import { Link } from 'react-router-dom'

const Case = ({ title, subtitle, flow, callout }) => (
  <div className="card">
    <div className="row gap">
      <div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div className="small muted" style={{ marginTop: 4 }}>{subtitle}</div>
      </div>
    </div>
    <div className="sep" />
    <div className="flow">
      {flow.map((s, i) => (
        <div key={i} className={`step ${s.state || ''}`}>
          <div className="role">{s.role}</div>
          <div className="t">{s.title}</div>
          <div className="v">{s.value}</div>
          <div className="small muted" style={{ marginTop: 6 }}>{s.desc}</div>
        </div>
      ))}
    </div>
    {callout && <div className="callout">{callout}</div>}
  </div>
)

export default function Examples() {
  return (
    <div>
      <div className="head">
        <h1>样例回放</h1>
        <div className="sub">两组可试的真实样例：正常流和问题流。数据已写入本地库，可直接操作验证。</div>
        <div className="actions">
          <Link className="btn" to="/">回工作台</Link>
          <Link className="btn" to="/batches">看批次</Link>
        </div>
      </div>

      <Case
        title="样例 1 · 正常流：红富士 B-20260501-A"
        subtitle="5/1 到仓 → 分级 → 两次配货 → 赊销 → 到期回款，全程留痕。"
        callout="点击左侧「批次·冷库」选中 B-20260501-A 即可看到完整时间线。"
        flow={[
          { title: '到仓过磅', value: '净 4500 kg', role: '冷库管理', desc: '山东烟台 红富士80#，单价¥7.6/kg，仓库A-03', state: 'done' },
          { title: '分级', value: 'A 3200 / B 1100 / C 150', role: '档口负责人', desc: '按果径+着色分级，合计与入库对账一致', state: 'done' },
          { title: '配货东兴', value: 'A 1200 kg', role: '配货员', desc: '5/2 李师傅配送，订单 D-0502-01', state: 'done' },
          { title: '配货阳光', value: 'A 800 kg', role: '配货员', desc: '5/4 李师傅配送，订单 D-0504-01', state: 'done' },
          { title: '赊销东兴', value: '¥10920', role: '财务', desc: '5/2 开单，7天账期 5/9 到期', state: 'done' },
          { title: '回款东兴', value: '¥10920 · 全额', role: '财务', desc: '5/9 银行转账到账，状态 settled', state: 'done' },
        ]}
      />

      <Case
        title="样例 2 · 问题流：脐橙 B-20260505-C 与麒麟瓜 B-20260508-D"
        subtitle="客诉争议 + 损耗说不清 + 回款逾期：三件事以前互相割裂，现在在同一批时间线上能串起来，损耗与客诉通过 claim_id 真实关联。"
        callout="在「损耗复核」里可以看到麒麟瓜 120kg 已关联「关联客诉 #1 家乐购」；在「客诉赔付」里可以看到「关联损耗 #2 120kg」；在批次时间线里可以看到从客诉发生到处理的完整链路。"
        flow={[
          { title: '脐橙到仓', value: '净 4860 kg', role: '冷库管理', desc: '5/5 入库 B-01，赣南脐橙75#', state: 'done' },
          { title: '脐橙分级', value: 'A 3600 / B 1100 / C 160', role: '档口负责人', desc: '三级分，与入库对账一致', state: 'done' },
          { title: '脐橙配货家乐购', value: 'A 1500 kg', role: '配货员', desc: '5/7 赵师傅配送，订单 D-0507-01', state: 'done' },
          { title: '赊销家乐购', value: '¥15750 · 逾期', role: '财务', desc: '5/7 开单，账期7天，5/14 到期，5/25 仍未到账，状态 overdue', state: 'current' },
          { title: '客诉 · 家乐购', value: '表皮花皮 60kg', role: '客户电话', desc: '5/8 到货 24h 内投诉，有照片，争议 ¥630，状态 reviewing，客诉 #1', state: 'current' },
          { title: '麒麟瓜到仓', value: '净 6200 kg', role: '冷库管理', desc: '5/8 入库 B-02，海南麒麟瓜', state: 'done' },
          { title: '脐橙自然损耗', value: '40 kg 已确认', role: '档口负责人', desc: '5/10 周盘点，已 confirmed，金额 ¥356', state: 'done' },
          { title: '麒麟瓜损耗 · 关联客诉', value: '120 kg 待复核', role: '冷库管理', desc: '5/11 客户争议关联损耗，claim_id=1 关联家乐购客诉 #1，状态 pending', state: 'current' },
        ]}
      />

      <div className="card">
        <h2>修复后的完整追溯链路</h2>
        <div className="callout">
          以前的问题：损耗说不清、客诉赔付没证据、回款拖久了才被看到 —— 现在一条线串起来：
          <br />
          <strong>客诉 #1（家乐购 60kg 花皮）</strong> → <strong>关联损耗 #2（麒麟瓜 120kg，claim_id=1）</strong> → <strong>赊销 #4（¥15750 逾期）</strong>
          <br />
          每一步都在批次时间线和日历视图上可回看。
        </div>
        <div className="flow" style={{ marginTop: 10 }}>
          <div className="step done"><div className="role">5/7</div><div className="t">配货</div><div className="v">家乐购 脐橙 1500kg</div><div className="small muted">配货员赵师傅</div></div>
          <div className="step done"><div className="role">5/7</div><div className="t">赊销开单</div><div className="v">¥15750 · 7天</div><div className="small muted">财务记账</div></div>
          <div className="step current"><div className="role">5/8</div><div className="t">客诉发生</div><div className="v">60kg 花皮</div><div className="small muted">客户电话，附照片，客诉#1</div></div>
          <div className="step current"><div className="role">5/10</div><div className="t">盘点发现损耗</div><div className="v">脐橙 40kg 确认</div><div className="small muted">档口负责人确认</div></div>
          <div className="step current"><div className="role">5/11</div><div className="t">损耗登记</div><div className="v">麒麟瓜 120kg</div><div className="small muted">关联客诉#1，状态 pending</div></div>
          <div className="step current"><div className="role">5/14</div><div className="t">赊销到期</div><div className="v">¥15750</div><div className="small muted">未回款 → 自动标红 overdue</div></div>
          <div className="step"><div className="role">待处理</div><div className="t">待确认/赔付/回款</div><div className="v">闭环</div><div className="small muted">在对应页操作</div></div>
        </div>
      </div>

      <div className="card">
        <h2>可以立即尝试的操作</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>打开 <Link to="/">工作台</Link>，点击日历 <strong>5/8</strong>，右侧会显示当天所有动作（不仅仅是出入库）：脐橙入库、麒麟瓜入库、家乐购客诉登记。</li>
          <li>打开 <Link to="/">工作台</Link>，点击日历 <strong>5/7</strong>，右侧会显示：脐橙配货家乐购、赊销开单 ¥15750。</li>
          <li>打开 <Link to="/batches">批次·冷库</Link>，选中 <strong>B-20260505-C</strong>（脐橙），查看从入库到赊销到客诉的完整时间线。</li>
          <li>打开 <Link to="/batches">批次·冷库</Link>，选中 <strong>B-20260508-D</strong>（麒麟瓜），时间线里会显示「损耗 · 关联客诉#1」。</li>
          <li>打开 <Link to="/losses">损耗复核</Link>，可以看到「关联客诉」列显示 #1 家乐购；把「麒麟瓜 120kg pending」状态点成「确认」。</li>
          <li>打开 <Link to="/claims">客诉赔付</Link>，可以看到「关联损耗」列显示损耗#2 120kg；把「家乐购 60kg 花皮」处理成「已解决」。</li>
          <li>打开 <Link to="/credits">赊销结算</Link>，给家乐购那笔 ¥15750 登记一笔回款，看状态自动从 overdue 变成 partial/settled。</li>
        </ol>
      </div>

      <div className="card">
        <h2>当前实现的取舍点</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li><strong>数据库：</strong>使用 SQLite（better-sqlite3）。单机轻量、无需部署服务，适合初期把流程做实；后续可平滑切换 PostgreSQL。</li>
          <li><strong>角色权限：</strong>当前以记录留痕为主（操作人字段），未做登录鉴权。后续加鉴权只需在请求头加 JWT，在服务端校验。</li>
          <li><strong>损耗复核与客诉关联：</strong>当前通过字段/人工备注关联，未建独立的关联表；后续可加 loss_claims 中间表做多对多。</li>
          <li><strong>提醒机制：</strong>当前只有日历联动 + 状态标红（逾期/待复核）。后续可加定时任务（逾期前 3 天/当天/逾期后）推送到微信/企业微信。</li>
          <li><strong>前端技术：</strong>原生 React + Vite，未引入状态库或 UI 库，保持轻量；后续若复杂度上升可加 Zustand + AntD。</li>
          <li><strong>报表：</strong>暂只有 KPI + 明细。后续可加批次利润表（入库成本 − 配货收入 − 损耗 − 赔付）与月度盘点表。</li>
        </ul>
        <h2>后续可扩的位置</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>批次与冷库位的更细粒度（每托/每箱标签），扫描枪入库出库。</li>
          <li>磅单 / 冷库表 / 客户电话录音或照片的附件上传（对象存储）。</li>
          <li>客诉自动生成「损耗复核待办」，回款逾期自动发提醒与催收记录。</li>
          <li>与供应商/客户的对账导出（Excel/PDF）。</li>
          <li>多门店 / 多冷库的跨库调货与调拨。</li>
        </ul>
      </div>
    </div>
  )
}
