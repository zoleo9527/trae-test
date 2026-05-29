const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 3000, ...options }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }});
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function debug() {
  const loginRes = await request({
    path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'supplier', password: '123456' });
  const token = loginRes.data.token;
  const headers = { 'Authorization': 'Bearer ' + token };

  const projects = await request({ path: '/api/projects', headers });
  console.log('供应商看到的项目 IDs:', projects.data.items.map(p => p.id));
  console.log('供应商看到的项目 names:', projects.data.items.map(p => p.name));

  const recs = await request({ path: '/api/reconciliations', headers });
  console.log('\n供应商看到的对账 IDs:', recs.data.items.map(r => r.id));
  console.log('供应商看到的对账 titles:', recs.data.items.map(r => r.title));
  console.log('供应商看到的对账 projectIds:', recs.data.items.map(r => r.projectId));

  const dash = await request({ path: '/api/projects/dashboard', headers });
  console.log('\nDashboard 对账总数:', dash.data.totalReconciliations);
  console.log('Dashboard 项目总数:', dash.data.totalProjects);
}

debug().catch(console.error);
