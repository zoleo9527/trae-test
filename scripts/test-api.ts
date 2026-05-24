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
  }
}

async function runTests() {
  console.log('🧪 开始 API 测试...\n');

  const testData = await getTestData();
  const supervisorId = testData.users.find(u => u.role === 'SUPERVISOR')?.id || testData.users[0].id;
  const managerId = testData.users.find(u => u.role === 'PROJECT_MANAGER')?.id || testData.users[1].id;

  console.log('📋 健康检查');
  let result = await request('GET', '/health');
  printResult('服务健康检查', result);

  console.log('\n📋 公共接口测试');
  result = await request('GET', '/api/users', undefined, supervisorId);
  printResult('获取用户列表', result);

  result = await request('GET', '/api/projects', undefined, supervisorId);
  printResult('获取项目列表', result);

  console.log('\n📋 主材管理接口测试 - 正常流程');

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
  printResult('创建主材', result, 201);
  const newMaterialId = result.data?.data?.id;

  result = await request('GET', '/api/materials?page=1&pageSize=10', undefined, supervisorId);
  printResult('获取主材列表', result);

  if (testData.normalMaterialId) {
    result = await request('GET', `/api/materials/${testData.normalMaterialId}`, undefined, supervisorId);
    printResult('获取主材详情', result);
  }

  console.log('\n📋 主材管理接口测试 - 状态流转');
  if (newMaterialId) {
    result = await request('PATCH', `/api/materials/${newMaterialId}/status`, { status: 'ARRIVED' }, supervisorId);
    printResult('状态流转: 待到货 -> 已到货', result);

    result = await request('PATCH', `/api/materials/${newMaterialId}/status`, { status: 'INSPECTION_PENDING' }, supervisorId);
    printResult('状态流转: 已到货 -> 待验收', result);

    result = await request('PATCH', `/api/materials/${newMaterialId}/status`, { status: 'CANCELLED' }, supervisorId);
    printResult('状态流转: 待验收 -> 已取消', result);
  }

  console.log('\n📋 验收管理接口测试');
  if (testData.problemMaterialId) {
    const inspectionData = {
      materialId: testData.problemMaterialId,
      type: 'INSTALLATION_QUALITY',
      result: 'FAIL',
      status: 'PENDING',
      rejectionReason: '安装平整度不达标',
      evidences: [
        { type: 'PHOTO', url: 'https://example.com/photo1.jpg', description: '平整度测量照片' }
      ]
    };
    result = await request('POST', '/api/inspections', inspectionData, supervisorId);
    printResult('创建验收记录', result, 201);

    const newInspectionId = result.data?.data?.id;

    result = await request('GET', `/api/inspections/material/${testData.problemMaterialId}`, undefined, supervisorId);
    printResult('获取主材验收记录', result);

    if (newInspectionId) {
      result = await request('POST', `/api/inspections/${newInspectionId}/comments`, { content: '已通知安装队整改' }, supervisorId);
      printResult('添加验收评论', result, 201);
    }
  }

  console.log('\n📋 驳回与补录测试');
  if (testData.problemMaterialId) {
    const inspectionList = await request('GET', `/api/inspections/material/${testData.problemMaterialId}`, undefined, supervisorId);
    const inspections = inspectionList.data?.data || [];
    if (inspections.length > 0) {
      const inspectionId = inspections[0].id;
      result = await request('POST', `/api/inspections/${inspectionId}/reject`, { rejectionReason: '整改不到位，需要重新处理' }, supervisorId);
      printResult('驳回验收', result);

      result = await request('POST', `/api/inspections/${inspectionId}/supplement`, {
        supplementNote: '已重新测量并调整，平整度达标',
        evidences: [
          { type: 'PHOTO', url: 'https://example.com/fixed.jpg', description: '整改后照片' }
        ]
      }, supervisorId);
      printResult('补录说明', result);
    }
  }

  console.log('\n📋 权限测试');
  result = await request('GET', '/api/materials');
  printResult('无认证访问被拒绝', result, 401);

  console.log('\n📋 导出测试');
  result = await request('GET', '/api/materials/export', undefined, supervisorId);
  printResult('导出CSV', result);

  console.log('\n📋 异常测试');
  result = await request('GET', '/api/materials/invalid-id', undefined, supervisorId);
  printResult('获取不存在的主材返回404', result, 404);

  result = await request('PATCH', `/api/materials/${testData.normalMaterialId || 'test'}/status`, { status: 'INVALID_STATUS' }, supervisorId);
  printResult('无效状态参数验证失败', result, 400);

  console.log('\n🎉 测试完成!');
}

runTests().catch(console.error);
