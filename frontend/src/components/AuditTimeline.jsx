import { Timeline } from 'antd';
import dayjs from 'dayjs';

const actionColorMap = {
  '创建排单': 'blue',
  '确认排单': 'cyan',
  '完成起苗': 'green',
  '创建装车记录': 'blue',
  '装车复核通过': 'green',
  '装车复核异常': 'red',
  '处理异常': 'orange',
  '关闭异常': 'green',
  '登录': 'gray',
};

function getActionColor(action) {
  for (const [key, color] of Object.entries(actionColorMap)) {
    if (action.includes(key)) return color;
  }
  return 'gray';
}

export default function AuditTimeline({ records }) {
  if (!records || records.length === 0) {
    return <div style={{ color: '#999', textAlign: 'center', padding: 16 }}>暂无操作记录</div>;
  }

  return (
    <Timeline
      items={records.map((r) => ({
        color: getActionColor(r.action),
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>
              {dayjs(r.created_at).format('YYYY-MM-DD HH:mm')} {r.user?.display_name || '系统'} - {r.action}
            </div>
            {r.detail && <div style={{ color: '#666', marginTop: 4 }}>{r.detail}</div>}
          </div>
        ),
      }))}
    />
  );
}
