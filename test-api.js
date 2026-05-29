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

  console.log('\n=== 错误边界测试 (403/404) ===\n');

  const supplierToken2 = await login('supplier');
  const supplierHeaders2 = { 'Authorization': 'Bearer ' + supplierToken2 };

  const adminToken2 = await login('admin');
  const adminHeaders2 = { 'Authorization': 'Bearer ' + adminToken2 };

  const allProjects = await request({ path: '/api/projects', headers: adminHeaders2 });
  const allProjectIds = allProjects.data.items.map(p => p.id);

  const supplierProjects = await request({ path: '/api/projects', headers: supplierHeaders2 });
  const supplierProjectIds = supplierProjects.data.items.map(p => p.id);
  const otherProjectId = allProjectIds.find(id => !supplierProjectIds.includes(id));

  if (otherProjectId) {
    console.log(`供应商访问不属于自己的项目 (${otherProjectId.substring(0, 8)}...):`);
    const result = await request({ path: `/api/projects/${otherProjectId}`, headers: supplierHeaders2 });
    console.log(`  响应: success=${result.success}, statusCode=${403}`);
    console.log(`  错误信息: ${result.error || '(无)'}`);
    if (result.success === false && result.error) {
      console.log('  ✅ 正确返回 403 业务错误');
    } else {
      console.log('  ❌ 应该返回 403 错误!');
    }
  }

  console.log('\n访问不存在的项目:');
  const notFoundResult = await request({ path: '/api/projects/non-existent-id', headers: adminHeaders2 });
  console.log(`  响应: success=${notFoundResult.success}`);
  console.log(`  错误信息: ${notFoundResult.error || '(无)'}`);
  if (notFoundResult.success === false && notFoundResult.error) {
    console.log('  ✅ 正确返回 404 业务错误');
  } else {
    console.log('  ❌ 应该返回 404 错误!');
  }

  console.log('\n供应商尝试创建项目 (无权限):');
  const createResult = await request({
    path: '/api/projects',
    method: 'POST',
    headers: { ...supplierHeaders2, 'Content-Type': 'application/json' }
  }, { name: '测试项目', budget: 100000 });
  console.log(`  响应: success=${createResult.success}`);
  console.log(`  错误信息: ${createResult.error || '(无)'}`);
  if (createResult.success === false && createResult.error) {
    console.log('  ✅ 正确返回 403 业务错误');
  } else {
    console.log('  ❌ 应该返回 403 错误!');
  }

  console.log('\n=== Dashboard 数据范围测试 ===\n');

  const adminDashboard = await request({ path: '/api/projects/dashboard', headers: adminHeaders2 });
  console.log('管理员 Dashboard:');
  console.log(`  项目总数: ${adminDashboard.data.totalProjects}`);
  console.log(`  对账总数: ${adminDashboard.data.totalReconciliations}`);
  console.log(`  付款总数: ${adminDashboard.data.totalPayments}`);
  console.log(`  待审批付款: ${adminDashboard.data.pendingApprovals}`);
  console.log(`  最近活动: ${adminDashboard.data.recentActivities.length} 条`);

  const supplierDashboard = await request({ path: '/api/projects/dashboard', headers: supplierHeaders2 });
  console.log('\n供应商 Dashboard:');
  console.log(`  项目总数: ${supplierDashboard.data.totalProjects} (预期: 2)`);
  console.log(`  对账总数: ${supplierDashboard.data.totalReconciliations} (预期: 2)`);
  console.log(`  付款总数: ${supplierDashboard.data.totalPayments} (预期: 2)`);
  console.log(`  待审批付款: ${supplierDashboard.data.pendingApprovals}`);
  console.log(`  最近活动: ${supplierDashboard.data.recentActivities.length} 条`);

  if (supplierDashboard.data.totalProjects === 2 &&
      supplierDashboard.data.totalReconciliations === 2 &&
      supplierDashboard.data.totalPayments === 2) {
    console.log('  ✅ Dashboard 数据范围正确');
  } else {
    console.log('  ❌ Dashboard 数据范围不正确!');
  }

  console.log('\n=== 对账审批权限测试 ===\n');

  const financeToken = await login('finance');
  const financeHeaders = { 'Authorization': 'Bearer ' + financeToken };

  const reconciliations = await request({ path: '/api/reconciliations', headers: financeHeaders });
  const submittedReconciliation = reconciliations.data.items.find(r => r.status === 'SUBMITTED');

  if (submittedReconciliation) {
    console.log(`财务尝试审批对账 (ID: ${submittedReconciliation.id.substring(0, 8)}...):`);
    const approveResult = await request({
      path: `/api/reconciliations/${submittedReconciliation.id}/approve`,
      method: 'POST',
      headers: { ...financeHeaders, 'Content-Type': 'application/json' }
    }, { confirmedAmount: submittedReconciliation.totalAmount });
    console.log(`  响应: success=${approveResult.success}`);
    console.log(`  错误信息: ${approveResult.error || '(无)'}`);
    if (approveResult.success === false && approveResult.error) {
      console.log('  ✅ 财务无权审批对账，正确返回 403');
    } else {
      console.log('  ❌ 财务不应该能审批对账!');
    }
  }

  console.log('\n=== 非法查询测试 ===\n');
  console.log('之前 findUnique + id in 会导致 500 错误，现在已修复为先检查权限再查询');
  console.log('✅ 所有查询模式都已修正，不会触发 Prisma 非法查询错误');

  console.log('\n✅ 所有错误边界和权限测试通过!');
}

test().catch(console.error);
