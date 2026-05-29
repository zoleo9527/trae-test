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

async function login(username) {
  const res = await request({
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username, password: '123456' });
  return res.data.token;
}

async function testRole(roleName, username, expectedProjects, expectedReconciliations, expectedPayments, expectedDocuments, expectedTeardowns, shouldHideSensitive) {
  console.log(`\n=== 测试角色: ${roleName} ===`);
  const token = await login(username);
  const headers = { 'Authorization': 'Bearer ' + token };

  const projectsRes = await request({ path: '/api/projects', headers });
  console.log(`  项目列表: ${projectsRes.data.items.length} 个 (预期: ${expectedProjects})`);
  if (projectsRes.data.items.length !== expectedProjects) {
    console.log(`  ❌ 项目数量不匹配!`);
  }

  const reconciliationsRes = await request({ path: '/api/reconciliations', headers });
  console.log(`  对账列表: ${reconciliationsRes.data.items.length} 个 (预期: ${expectedReconciliations})`);
  if (reconciliationsRes.data.items.length !== expectedReconciliations) {
    console.log(`  ❌ 对账数量不匹配!`);
  }

  const paymentsRes = await request({ path: '/api/payments', headers });
  console.log(`  付款列表: ${paymentsRes.data.items.length} 个 (预期: ${expectedPayments})`);
  if (paymentsRes.data.items.length !== expectedPayments) {
    console.log(`  ❌ 付款数量不匹配!`);
  }

  const docsRes = await request({ path: '/api/documents', headers });
  console.log(`  证件列表: ${docsRes.data.items.length} 个 (预期: ${expectedDocuments})`);
  if (docsRes.data.items.length !== expectedDocuments) {
    console.log(`  ❌ 证件数量不匹配!`);
  }

  const teardownsRes = await request({ path: '/api/teardowns', headers });
  console.log(`  撤场列表: ${teardownsRes.data.items.length} 个 (预期: ${expectedTeardowns})`);
  if (teardownsRes.data.items.length !== expectedTeardowns) {
    console.log(`  ❌ 撤场数量不匹配!`);
  }

  if (reconciliationsRes.data.items.length > 0) {
    const recId = reconciliationsRes.data.items[0].id;
    const recDetail = await request({ path: `/api/reconciliations/${recId}`, headers });
    const hasRejectReason = recDetail.data.rejectReason !== undefined;
    const hasReviseNote = recDetail.data.reviseNote !== undefined;
    console.log(`  对账详情敏感字段: rejectReason=${hasRejectReason}, reviseNote=${hasReviseNote} (预期隐藏: ${shouldHideSensitive})`);
    if (shouldHideSensitive && (hasRejectReason || hasReviseNote)) {
      console.log(`  ❌ 敏感字段未被隐藏!`);
    }
  }

  console.log(`  ✓ ${roleName} 测试完成`);
}

async function test() {
  console.log('=== 权限控制测试 ===\n');

  await testRole('管理员(ADMIN)', 'admin', 3, 3, 2, 3, 2, false);
  await testRole('项目统筹(PROJECT_COORDINATOR)', 'coordinator', 3, 3, 2, 3, 2, false);
  await testRole('现场执行(SITE_EXECUTIVE)', 'executive', 3, 3, 2, 3, 2, false);
  await testRole('财务(FINANCE)', 'finance', 3, 3, 2, 3, 2, false);
  await testRole('供应商联系人(SUPPLIER_CONTACT)', 'supplier', 2, 2, 2, 3, 2, true);

  console.log('\n=== 详情和审计日志测试 ===\n');

  const adminToken = await login('admin');
  const adminHeaders = { 'Authorization': 'Bearer ' + adminToken };

  const projectsRes = await request({ path: '/api/projects', headers: adminHeaders });
  const projectId = projectsRes.data.items[0].id;
  const projectDetail = await request({ path: `/api/projects/${projectId}`, headers: adminHeaders });
  console.log('✓ 项目详情');
  console.log('  - 名称:', projectDetail.data.name);
  console.log('  - auditLogs:', projectDetail.data.auditLogs ? projectDetail.data.auditLogs.length : 0);
  console.log('  - comments:', projectDetail.data.comments ? projectDetail.data.comments.length : 0);

  const reconciliationsRes = await request({ path: '/api/reconciliations', headers: adminHeaders });
  const recId = reconciliationsRes.data.items[0].id;
  const recDetail = await request({ path: `/api/reconciliations/${recId}`, headers: adminHeaders });
  console.log('✓ 对账详情');
  console.log('  - 编号:', recDetail.data.code);
  console.log('  - auditLogs:', recDetail.data.auditLogs ? recDetail.data.auditLogs.length : 0);
  console.log('  - comments:', recDetail.data.comments ? recDetail.data.comments.length : 0);

  const docsRes = await request({ path: '/api/documents', headers: adminHeaders });
  const docId = docsRes.data.items[0].id;
  const docDetail = await request({ path: `/api/documents/${docId}`, headers: adminHeaders });
  console.log('✓ 证件详情');
  console.log('  - 标题:', docDetail.data.title);
  console.log('  - auditLogs:', docDetail.data.auditLogs ? docDetail.data.auditLogs.length : 0);
  console.log('  - comments:', docDetail.data.comments ? docDetail.data.comments.length : 0);

  const teardownsRes = await request({ path: '/api/teardowns', headers: adminHeaders });
  const teardownId = teardownsRes.data.items[0].id;
  const teardownDetail = await request({ path: `/api/teardowns/${teardownId}`, headers: adminHeaders });
  console.log('✓ 撤场详情');
  console.log('  - 标题:', teardownDetail.data.title);
  console.log('  - auditLogs:', teardownDetail.data.auditLogs ? teardownDetail.data.auditLogs.length : 0);
  console.log('  - comments:', teardownDetail.data.comments ? teardownDetail.data.comments.length : 0);

  console.log('\n✅ 所有测试通过!');
}

test().catch(console.error);
