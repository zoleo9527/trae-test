import { Tag } from 'antd';

const orderColorMap = {
  '待确认': 'blue',
  '已确认': 'cyan',
  '起苗中': 'orange',
  '已完成': 'green',
  '异常': 'red',
};

const loadingColorMap = {
  '待装车': 'default',
  '装车中': 'orange',
  '已复核': 'green',
  '异常': 'red',
};

const exceptionColorMap = {
  '待处理': 'red',
  '处理中': 'orange',
  '已关闭': 'green',
};

const severityColorMap = {
  '一般': 'blue',
  '严重': 'orange',
  '紧急': 'red',
};

const colorMaps = {
  order: orderColorMap,
  loading: loadingColorMap,
  exception: exceptionColorMap,
  severity: severityColorMap,
};

export default function StatusTag({ status, type }) {
  const colorMap = colorMaps[type] || {};
  const color = colorMap[status] || 'default';
  return <Tag color={color}>{status}</Tag>;
}
