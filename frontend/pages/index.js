import Link from 'next/link'
import { useEffect, useState } from 'react'
import withAuth from '../components/hoc/withAuth'
import { fetcher } from '../lib/auth'

function money(n) {
  return '¥' + Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function HomePage() {
  const [overview, setOverview] = useState(null)
  const [activities, setActivities] = useState([])
  const [distributions, setDistributions] = useState([])

  useEffect(() => {
    Promise.all([
      fetcher('/api/distributions/summary/overview'),
      fetcher('/api/activities?status=进行中'),
      fetcher('/api/distributions?status=待对账')
    ]).then(([o, a, d]) => {
      setOverview(o)
      setActivities(a.list || [])
      setDistributions(d.list || [])
    })
  }, [])

  return (
    <div>
      <div className="page-title">
        <h1>概览</h1>
        <div className="desc">围绕作者活动与渠道对接的进度快照</div>
      </div>

      <div className="card">
        <h3>核心指标</h3>
        <div className="stat-grid">
          <div className="stat">
            <div className="label">铺货批次</div>
            <div className="value">{overview?.total ?? '-'}</div>
          </div>
          <div className="stat">
            <div className="label">样书待回执</div>
            <div className="value warn">{overview?.pendingSample ?? '-'}</div>
          </div>
          <div className="stat">
            <div className="label">待对账</div>
            <div className="value warn">{overview?.pendingSettle ?? '-'}</div>
          </div>
          <div className="stat">
            <div className="label">累计退货</div>
            <div className="value">{overview?.returnedQty ?? '-'}</div>
          </div>
          <div className="stat">
            <div className="label">已回款</div>
            <div className="value money">{overview?.settled ?? '-'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>
          进行中的作者活动
          <Link href="/activities" style={{ float: 'right', fontSize: 13, color: '#4338ca' }}>
            查看全部 →
          </Link>
        </h3>
        {activities.length === 0 ? (
          <div className="empty">暂无进行中的活动</div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>活动</th>
                <th>作者</th>
                <th>渠道</th>
                <th>计划日期</th>
                <th>状态</th>
                <th>责任人</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => (
                <tr key={a.id}>
                  <td>{a.title}</td>
                  <td>{a.authorName}</td>
                  <td>{a.channelName}</td>
                  <td>{a.planDate}</td>
                  <td><span className="tag warn">{a.status}</span></td>
                  <td>{a.ownerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>
          待对账的铺货单
          <Link href="/distributions" style={{ float: 'right', fontSize: 13, color: '#4338ca' }}>
            查看全部 →
          </Link>
        </h3>
        {distributions.length === 0 ? (
          <div className="empty">暂无待对账铺货单</div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>批次</th>
                <th>图书</th>
                <th>渠道</th>
                <th>发货</th>
                <th>退货</th>
                <th>退货口径</th>
                <th>责任人</th>
              </tr>
            </thead>
            <tbody>
              {distributions.map((d) => (
                <tr key={d.id}>
                  <td>{d.batch}</td>
                  <td>{d.bookTitle}</td>
                  <td>{d.channelName}</td>
                  <td>{d.shippedAt} · {d.qty}册</td>
                  <td>{d.returnedQty} 册</td>
                  <td style={{ color: '#b45309' }}>{d.returnNote || '-'}</td>
                  <td>{d.ownerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default withAuth(HomePage)
