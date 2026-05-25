import React from 'react';
import { ROLE_NAMES } from '../App';

const ACTION_LABELS = {
  create: '创建',
  ship: '发货',
  deliver: '签收',
  confirm: '确认回执',
  mark_lost: '标记丢失',
  submit: '提交',
  review: '审核',
  escalate: '升级',
  approve: '批准',
  reject: '拒绝',
  receive: '收货',
  reconcile: '对账',
  generate: '生成',
  finalize: '最终确认'
};

const Timeline = ({ data }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!data || data.length === 0) {
    return <div className="empty-state">暂无操作记录</div>;
  }

  return (
    <div className="timeline">
      {data.map((item, index) => (
        <div key={index} className="timeline-item">
          <div className="time">{formatTime(item.timestamp)}</div>
          <div className="action">
            {ACTION_LABELS[item.action] || item.action} — {item.description}
          </div>
          <div className="operator">
            {item.operator?.name} 
            ({ROLE_NAMES[item.operator?.role] || item.operator?.role})
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
