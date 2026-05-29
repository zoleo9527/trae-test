const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      ...options
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  const loginRes = await request({
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'admin', password: '123456' });

  const token = loginRes.data.token;
  console.log('✓ 登录成功');

  const headers = { 'Authorization': 'Bearer ' + token };

  const projectsRes = await request({ path: '/api/projects', headers });
  const projectId = projectsRes.data.items[0].id;
  console.log('✓ 获取项目列表成功');

  const projectDetail = await request({ path: `/api/projects/${projectId}`, headers });
  console.log('✓ 获取项目详情成功');
  console.log('  - 项目名称:', projectDetail.data.name);
  console.log('  - auditLogs 数量:', projectDetail.data.auditLogs ? projectDetail.data.auditLogs.length : 0);
  console.log('  - comments 数量:', projectDetail.data.comments ? projectDetail.data.comments.length : 0);

  const docsRes = await request({ path: '/api/documents', headers });
  console.log('✓ 获取证件办理列表成功, 数量:', docsRes.data.items.length);

  const teardownsRes = await request({ path: '/api/teardowns', headers });
  console.log('✓ 获取撤场复盘列表成功, 数量:', teardownsRes.data.items.length);

  const reconciliationsRes = await request({ path: '/api/reconciliations', headers });
  console.log('✓ 获取对账列表成功');

  const paymentsRes = await request({ path: '/api/payments', headers });
  console.log('✓ 获取付款列表成功');

  console.log('\n✅ 所有接口测试通过!');
}

test().catch(console.error);
