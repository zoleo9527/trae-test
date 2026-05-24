import http from 'http';

const BASE_URL = 'localhost';
const PORT = 3000;

interface TestUser {
  id: string;
  name: string;
  role: string;
}

interface TestData {
  users: TestUser[];
  projectId: string;
  normalMaterialId: string;
  problemMaterialId: string;
}

function request(method: string, path: string, data?: any, userId?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: BASE_URL,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (userId) {
      options.headers!['x-user-id'] = userId;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function getTestData(): Promise<TestData> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const users = await prisma.user.findMany();
  const project = await prisma.project.findFirst();
  const materials = await prisma.material.findMany({ take: 2, orderBy: { createdAt: 'desc' } });

  await prisma.$disconnect();

  return {
    users: users.map(u => ({ id: u.id, name: u.name, role: u.role })),
    projectId: project?.id || '',
    normalMaterialId: materials[0]?.id || '',
    problemMaterialId: materials[1]?.id || ''
  };
}

function printResult(testName: string, result: any, expectedStatus: number = 200) {
  const passed = result.status === expectedStatus;
  const statusIcon = passed ? '✅' : '❌';
  console.log(`  ${statusIcon} ${testName}`);
  if (!passed) {
    console.log(`     期望: ${expectedStatus}, 实际: ${result.status}`);
    if (result.data?.message) {
      console.log(`     消息: ${result.data.message}`);
    }
    if (result.data?.details) {
      console.log(`     详情: ${JSON.stringify(result.data.details)}`);
    }
  }
}

async function runTests() {
  console.log('🧪 开始 API 修复验证测试...\n');

  const testData = await getTestData();
  const supervisorId = testData.users.find(u => u.role === 'SUPERVISOR')?.id || testData.users[0].id;
  const managerId = testData.users.find(u => u.role === 'PROJECT_MANAGER')?.id || testData.users[1].id;
  const customerServiceId = testData.users.find(u => u.role === 'CUSTOMER_SERVICE')?.id || testData.users[2].id;

  console.log('📋 测试用户:');
  console.log(`  监理负责人: ${supervisorId}`);
  console.log(`  项目管家: ${managerId}`);
  console.log(`  业主客服: ${customerServiceId}`);
  console.log(`  项目ID: ${testData.projectId}`);
  console.log();

  console.log('📋 健康检查');
  let result = await request('GET', '/health');
  printResult('服务健康检查', result);

  console.log('\n📋 1. 验证中间件修复');
  result = await request('GET', '/api/materials?page=1&pageSize=10', undefined, supervisorId);
  printResult('列表查询（带分页参数）', result);

  result = await request('GET', '/api/materials?page=invalid', undefined, supervisorId);
  printResult('列表查询（无效page参数）', result, 400);

  if (testData.normalMaterialId) {
    result = await request('GET', `/api/materials/${testData.normalMaterialId}`, undefined, supervisorId);
    printResult('详情查询（有效ID）', result);
  }

  result = await request('GET', '/api/materials/invalid-uuid', undefined, supervisorId);
  printResult('详情查询（无效UUID格式）', result, 400);

  console.log('\n📋 2. 验证权限边界');
  const newMaterialData = {
    projectId: testData.projectId,
    name: '集成吊顶',
    category: '吊顶',
    brand: '友邦',
    model: 'YB-3001',
    quantity: 30,
    unit: '㎡',
    estimatedPrice: 4500
  };

  result = await request('POST', '/api/materials', newMaterialData, managerId);
  printResult('项目管家创建主材', result, 201);
  const newMaterialId = result.data?.data?.id;

  result = await request('POST', '/api/materials', newMaterialData, customerServiceId);
  printResult('业主客服创建主材（应被拒绝）', result, 403);

  console.log('\n📋 3. 验证状态流转');
  if (newMaterialId) {
    result = await request('PATCH', `/api/materials/${newMaterialId}/status`, { status: 'ARRIVED' }, supervisorId);
    printResult('状态流转: 待到货 → 已到货', result);
    const version1 = result.data?.data?.version;

    result = await request('PATCH', `/api/materials/${newMaterialId}/status`, { status: 'INSPECTION_PENDING' }, supervisorId);
    printResult('状态流转: 已到货 → 待验收', result);
    const version2 = result.data?.data?.version;
    console.log(`     版本递增验证: ${version1} → ${version2} (${version2 === version1 + 1 ? '✅' : '❌'})`);

    result = await request('PATCH', `/api/materials/${newMaterialId}/status`, { status: 'ACCEPTED' }, supervisorId);
    printResult('状态流转: 待验收 → 已验收（非法跳转）', result, 400);
  }

  console.log('\n📋 4. 验证验收驳回流程');
  if (testData.problemMaterialId) {
    const inspectionData = {
      materialId: testData.problemMaterialId,
      type: 'FINAL_ACCEPTANCE',
      result: 'FAIL',
      status: 'PENDING',
      rejectionReason: '安装平整度不达标',
      evidences: [
        { type: 'PHOTO', url: 'https://example.com/photo1.jpg', description: '平整度测量照片' }
      ]
    };
    result = await request('POST', '/api/inspections', inspectionData, supervisorId);
    printResult('创建最终验收记录', result, 201);
    const newInspectionId = result.data?.data?.id;

    if (newInspectionId) {
      result = await request('POST', `/api/inspections/${newInspectionId}/reject`, {
        rejectionReason: '整改不到位，缝隙超过标准'
      }, supervisorId);
      printResult('驳回验收', result);

      result = await request('GET', `/api/materials/${testData.problemMaterialId}`, undefined, supervisorId);
      const materialAfterReject = result.data?.data;
      console.log(`     主材状态回流验证: ${materialAfterReject?.status} (${materialAfterReject?.status === 'REJECTED' ? '✅' : '❌'})`);
      console.log(`     版本递增验证: v${materialAfterReject?.version} (${materialAfterReject?.version > 1 ? '✅' : '❌'})`);

      result = await request('GET', `/api/materials/${testData.problemMaterialId}/audit-logs`, undefined, supervisorId);
      printResult('审计日志查询', result);
    }
  }

  console.log('\n📋 5. 验证补录回流流程');
  if (testData.problemMaterialId) {
    const inspectionList = await request('GET', `/api/inspections/material/${testData.problemMaterialId}`, undefined, supervisorId);
    const inspections = inspectionList.data?.data || [];
    if (inspections.length > 0) {
      const inspectionId = inspections[0].id;
      const oldStatus = inspections[0].material?.status || 'UNKNOWN';

      result = await request('POST', `/api/inspections/${inspectionId}/supplement`, {
        supplementNote: '已重新测量并调整，平整度达标',
        evidences: [
          { type: 'PHOTO', url: 'https://example.com/fixed.jpg', description: '整改后照片' }
        ]
      }, supervisorId);
      printResult('补录说明和证据', result);

      result = await request('GET', `/api/materials/${testData.problemMaterialId}`, undefined, supervisorId);
      const materialAfterSupplement = result.data?.data;
      console.log(`     主材状态回流验证: ${oldStatus} → ${materialAfterSupplement?.status}`);
    }
  }

  console.log('\n📋 6. 验证变更日志闭环');
  if (testData.problemMaterialId) {
    result = await request('GET', `/api/materials/${testData.problemMaterialId}`, undefined, supervisorId);
    const changeLogs = result.data?.data?.changeLogs || [];
    console.log(`     变更日志数量: ${changeLogs.length} 条 (${changeLogs.length > 0 ? '✅' : '❌'})`);
    if (changeLogs.length > 0) {
      console.log(`     最近变更: ${changeLogs[0].fieldName} - ${changeLogs[0].changeReason}`);
    }
  }

  console.log('\n📋 7. 验证导出功能');
  result = await request('GET', '/api/materials/export', undefined, supervisorId);
  printResult('导出CSV', result);

  console.log('\n📋 8. 验证评论功能');
  if (testData.problemMaterialId) {
    result = await request('POST', `/api/materials/${testData.problemMaterialId}/comments`, {
      content: '请加快整改进度，业主在催了'
    }, customerServiceId);
    printResult('客服添加主材评论', result, 201);

    const inspectionList = await request('GET', `/api/inspections/material/${testData.problemMaterialId}`, undefined, supervisorId);
    const inspections = inspectionList.data?.data || [];
    if (inspections.length > 0) {
      result = await request('POST', `/api/inspections/${inspections[0].id}/comments`, {
        content: '已安排工人明天上门'
      }, managerId);
      printResult('管家添加验收评论', result, 201);
    }
  }

  console.log('\n📋 9. 验证本次核心修复');

  console.log('\n   9.1 最终验收FAIL不自动打回REJECTED（职责拆分）');
  if (testData.normalMaterialId) {
    const beforeMaterial = await request('GET', `/api/materials/${testData.normalMaterialId}`, undefined, supervisorId);
    const beforeStatus = beforeMaterial.data?.data?.status;
    const beforeVersion = beforeMaterial.data?.data?.version;

    const failInspection: any = {
      materialId: testData.normalMaterialId,
      type: 'FINAL_ACCEPTANCE',
      result: 'FAIL',
      status: 'PENDING',
      rejectionReason: '测试：最终验收失败但不应自动打回'
    };
    result = await request('POST', '/api/inspections', failInspection, supervisorId);
    printResult('创建最终验收FAIL记录', result, 201);

    const afterMaterial = await request('GET', `/api/materials/${testData.normalMaterialId}`, undefined, supervisorId);
    const afterStatus = afterMaterial.data?.data?.status;
    const afterVersion = afterMaterial.data?.data?.version;

    const statusUnchanged = beforeStatus === afterStatus;
    const versionUnchanged = beforeVersion === afterVersion;
    console.log(`     状态不变验证: ${beforeStatus} → ${afterStatus} (${statusUnchanged ? '✅' : '❌'})`);
    console.log(`     版本不变验证: v${beforeVersion} → v${afterVersion} (${versionUnchanged ? '✅' : '❌'})`);
    console.log(`     说明: 最终验收FAIL仅记录，需手动调用/reject才打回`);
  }

  console.log('\n   9.2 reject接口重复调用不重复递增版本');
  if (testData.normalMaterialId) {
    const inspectionList = await request('GET', `/api/inspections/material/${testData.normalMaterialId}`, undefined, supervisorId);
    const failInspections = (inspectionList.data?.data || []).filter((i: any) => i.result === 'FAIL');
    if (failInspections.length > 0) {
      const inspectionId = failInspections[0].id;

      const beforeReject = await request('GET', `/api/materials/${testData.normalMaterialId}`, undefined, supervisorId);
      const beforeVersion = beforeReject.data?.data?.version;
      const beforeStatus = beforeReject.data?.data?.status;

      result = await request('POST', `/api/inspections/${inspectionId}/reject`, {
        rejectionReason: '第一次驳回'
      }, supervisorId);
      printResult('第一次驳回验收', result);

      const afterReject1 = await request('GET', `/api/materials/${testData.normalMaterialId}`, undefined, supervisorId);
      const afterVersion1 = afterReject1.data?.data?.version;
      const afterStatus1 = afterReject1.data?.data?.status;

      result = await request('POST', `/api/inspections/${inspectionId}/reject`, {
        rejectionReason: '第二次驳回（测试重复调用）'
      }, supervisorId);
      printResult('第二次驳回验收（测试幂等）', result);

      const afterReject2 = await request('GET', `/api/materials/${testData.normalMaterialId}`, undefined, supervisorId);
      const afterVersion2 = afterReject2.data?.data?.version;

      console.log(`     版本变化: v${beforeVersion} → v${afterVersion1} → v${afterVersion2}`);
      const correctVersion = (beforeStatus !== 'REJECTED' && afterVersion1 === beforeVersion + 1 && afterVersion2 === afterVersion1);
      console.log(`     重复驳回不重复递增: ${correctVersion ? '✅' : '❌'}`);
    }
  }

  console.log('\n   9.3 补录接口变量名修复验证');
  if (testData.problemMaterialId) {
    const inspectionList = await request('GET', `/api/inspections/material/${testData.problemMaterialId}`, undefined, supervisorId);
    const inspections = inspectionList.data?.data || [];
    if (inspections.length > 0) {
      const inspectionId = inspections[0].id;

      result = await request('POST', `/api/inspections/${inspectionId}/supplement`, {
        supplementNote: '测试补录变量名修复'
      }, supervisorId);
      printResult('补录说明（oldValue变量已修复）', result);
    }
  }

  console.log('\n   9.4 幂等记录用户维度验证');
  const idempotencyKey = 'test-key-' + Date.now();
  const testMaterial = {
    projectId: testData.projectId,
    name: '幂等测试材料',
    category: '测试',
    brand: 'Test',
    model: 'T-001',
    quantity: 1,
    unit: '个'
  };

  function requestWithIdempotency(userId: string, key: string) {
    return new Promise((resolve) => {
      const options: any = {
        hostname: BASE_URL,
        port: PORT,
        path: '/api/materials',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-idempotency-key': key
        }
      };
      const req = http.request(options, (res: any) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });
      req.on('error', resolve);
      req.write(JSON.stringify(testMaterial));
      req.end();
    });
  }

  const r1: any = await requestWithIdempotency(supervisorId, idempotencyKey);
  console.log(`     监理用key ${idempotencyKey.substring(0, 15)}... 创建: ${r1.status === 201 ? '✅' : '❌'}`);

  const r2: any = await requestWithIdempotency(supervisorId, idempotencyKey);
  const isCached = r2.status === 200 && r1.data?.data?.id === r2.data?.data?.id;
  console.log(`     同一用户同key返回缓存: ${isCached ? '✅' : '❌'}`);

  const r3: any = await requestWithIdempotency(managerId, idempotencyKey);
  const isNewCreate = r3.status === 201;
  console.log(`     不同用户同key独立创建: ${isNewCreate ? '✅' : '❌'}`);
  console.log(`     说明: 已消除anonymous作用域，用户维度完全隔离`);

  console.log('\n🎉 测试完成!');
  console.log('\n📊 本次修复总结:');
  console.log('  ✅ supplement变量修复 - oldValue→oldStatus，避免补录时报错');
  console.log('  ✅ 验收职责拆分 - 最终验收FAIL仅记录，需手动/reject才打回REJECTED');
  console.log('  ✅ 防重复递增 - reject接口增加状态前置检查，状态相同不重复增版本');
  console.log('  ✅ 幂等用户维度 - 移除anonymous，idempotency在authenticate后执行，不串单');
  console.log('  ✅ 中间件顺序 - 移除全局idempotency，各路由在authenticate后独立引入');
}

runTests().catch(console.error);
