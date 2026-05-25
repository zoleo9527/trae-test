export default function NoAccess() {
  return (
    <div style={{ padding: 80, textAlign: 'center' }}>
      <h2>无访问权限</h2>
      <p style={{ color: '#666' }}>请切换到具备相应权限的角色后再访问。</p>
      <a href="/" style={{ color: '#4338ca' }}>返回首页</a>
    </div>
  )
}
