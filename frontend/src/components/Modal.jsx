import { useEffect } from 'react';

export default function Modal({ title, visible, onClose, onOk, okText = '确定', cancelText = '取消', children, width = 500 }) {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: 8,
        width: width,
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
          <span onClick={onClose} style={{ cursor: 'pointer', color: '#8c8c8c', fontSize: 20 }}>×</span>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
        <div style={{ padding: '12px 24px', borderTop: '1px solid #e8e8e8', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-default" onClick={onClose}>{cancelText}</button>
          {onOk && <button className="btn btn-primary" onClick={onOk}>{okText}</button>}
        </div>
      </div>
    </div>
  );
}
