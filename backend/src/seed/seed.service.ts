import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Camper, Room, Material, User, ResupplyRequest, EvidenceChain, CheckIn, MedicalReport, MaterialDistribution } from '../entities';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Camper) private camperRepo: Repository<Camper>,
    @InjectRepository(Room) private roomRepo: Repository<Room>,
    @InjectRepository(Material) private materialRepo: Repository<Material>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(ResupplyRequest) private resupplyRepo: Repository<ResupplyRequest>,
    @InjectRepository(EvidenceChain) private evidenceRepo: Repository<EvidenceChain>,
    @InjectRepository(CheckIn) private checkInRepo: Repository<CheckIn>,
    @InjectRepository(MedicalReport) private medicalRepo: Repository<MedicalReport>,
    @InjectRepository(MaterialDistribution) private distributionRepo: Repository<MaterialDistribution>,
  ) {}

  async onModuleInit() {
    const camperCount = await this.camperRepo.count();
    if (camperCount === 0) {
      await this.seedAll();
    }
  }

  async seedAll() {
    console.log('Seeding initial data...');
    
    await this.seedUsers();
    const rooms = await this.seedRooms();
    const materials = await this.seedMaterials();
    const campers = await this.seedCampers();
    await this.seedMaterialDistributions(campers, materials);
    await this.seedResupplyRequests(campers, materials);
    await this.seedCheckIns(campers);
    await this.seedMedicalReports(campers);
    
    console.log('Seeding completed!');
  }

  async seedUsers() {
    const users = [
      { username: 'director', name: '张明', role: 'director' },
      { username: 'teacher1', name: '李老师', role: 'teacher' },
      { username: 'teacher2', name: '王老师', role: 'teacher' },
      { username: 'logistics', name: '陈后勤', role: 'logistics' },
    ];
    
    return this.userRepo.save(users.map(u => this.userRepo.create(u)));
  }

  async seedRooms() {
    const rooms = [
      { name: '101', building: 'A栋', floorNumber: 1, bedCount: 4, genderType: 'male' },
      { name: '102', building: 'A栋', floorNumber: 1, bedCount: 4, genderType: 'male' },
      { name: '103', building: 'A栋', floorNumber: 1, bedCount: 4, genderType: 'female' },
      { name: '104', building: 'A栋', floorNumber: 1, bedCount: 4, genderType: 'female' },
      { name: '201', building: 'A栋', floorNumber: 2, bedCount: 4, genderType: 'male' },
      { name: '202', building: 'A栋', floorNumber: 2, bedCount: 4, genderType: 'female' },
    ];
    
    return this.roomRepo.save(rooms.map(r => this.roomRepo.create(r)));
  }

  async seedMaterials() {
    const materials = [
      { name: '营服套装', category: '服装', stockQuantity: 50, unit: '套', specification: '包含上衣、裤子' },
      { name: '床上用品', category: '住宿', stockQuantity: 45, unit: '套', specification: '被子、枕头、床单' },
      { name: '洗漱包', category: '生活用品', stockQuantity: 60, unit: '个', specification: '牙刷、牙膏、毛巾' },
      { name: '运动水壶', category: '生活用品', stockQuantity: 40, unit: '个', specification: '500ml' },
      { name: '驱蚊液', category: '防护', stockQuantity: 30, unit: '瓶', specification: '100ml' },
      { name: '防晒霜', category: '防护', stockQuantity: 25, unit: '支', specification: 'SPF50+' },
      { name: '急救包', category: '医疗', stockQuantity: 15, unit: '个', specification: '基础急救用品' },
      { name: '笔记本', category: '文具', stockQuantity: 80, unit: '本', specification: 'A5笔记本' },
    ];
    
    return this.materialRepo.save(materials.map(m => this.materialRepo.create(m)));
  }

  async seedCampers() {
    const campers = [
      { name: '张伟', gender: 'male', age: 12, idCard: '110101201201011234', parentName: '张建国', parentPhone: '13800138001', allergy: '花生', roomId: null, bedNumber: null },
      { name: '李娜', gender: 'female', age: 11, idCard: '110101201302022345', parentName: '李明', parentPhone: '13800138002', allergy: '', medicalHistory: '哮喘', roomId: null, bedNumber: null },
      { name: '王强', gender: 'male', age: 13, idCard: '110101201103033456', parentName: '王刚', parentPhone: '13800138003', allergy: '', roomId: null, bedNumber: null },
      { name: '刘芳', gender: 'female', age: 12, idCard: '110101201204044567', parentName: '刘伟', parentPhone: '13800138004', allergy: '青霉素', roomId: null, bedNumber: null },
      { name: '陈明', gender: 'male', age: 11, idCard: '110101201305055678', parentName: '陈华', parentPhone: '13800138005', allergy: '', roomId: null, bedNumber: null },
      { name: '杨丽', gender: 'female', age: 13, idCard: '110101201106066789', parentName: '杨军', parentPhone: '13800138006', allergy: '海鲜', medicalHistory: '', roomId: null, bedNumber: null },
      { name: '赵磊', gender: 'male', age: 12, idCard: '110101201207077890', parentName: '赵强', parentPhone: '13800138007', allergy: '', roomId: null, bedNumber: null },
      { name: '周敏', gender: 'female', age: 11, idCard: '110101201308088901', parentName: '周明', parentPhone: '13800138008', allergy: '', roomId: null, bedNumber: null },
      { name: '吴涛', gender: 'male', age: 13, idCard: '110101201109099012', parentName: '吴刚', parentPhone: '13800138009', allergy: '芒果', roomId: null, bedNumber: null },
      { name: '郑雪', gender: 'female', age: 12, idCard: '110101201210100123', parentName: '郑华', parentPhone: '13800138010', allergy: '', medicalHistory: '心脏病', roomId: null, bedNumber: null },
      { name: '孙浩', gender: 'male', age: 11, idCard: '110101201311111234', parentName: '孙伟', parentPhone: '13800138011', allergy: '', roomId: null, bedNumber: null },
      { name: '马琳', gender: 'female', age: 13, idCard: '110101201112122345', parentName: '马军', parentPhone: '13800138012', allergy: '', roomId: null, bedNumber: null },
    ];
    
    const saved = await this.camperRepo.save(campers.map(c => this.camperRepo.create(c)));
    
    const rooms = await this.roomRepo.find();
    const maleCampers = saved.filter(c => c.gender === 'male');
    const femaleCampers = saved.filter(c => c.gender === 'female');
    const maleRooms = rooms.filter(r => r.genderType === 'male');
    const femaleRooms = rooms.filter(r => r.genderType === 'female');
    
    let bedIndex = 0;
    maleCampers.forEach((camper, idx) => {
      const roomIdx = Math.floor(idx / 4) % maleRooms.length;
      const bedNum = (idx % 4) + 1;
      camper.roomId = maleRooms[roomIdx].id;
      camper.bedNumber = bedNum;
    });
    
    femaleCampers.forEach((camper, idx) => {
      const roomIdx = Math.floor(idx / 4) % femaleRooms.length;
      const bedNum = (idx % 4) + 1;
      camper.roomId = femaleRooms[roomIdx].id;
      camper.bedNumber = bedNum;
    });
    
    return this.camperRepo.save(saved);
  }

  async seedMaterialDistributions(campers: Camper[], materials: Material[]) {
    const distributions = [];
    
    campers.slice(0, 8).forEach(camper => {
      materials.slice(0, 4).forEach(material => {
        distributions.push({
          camperId: camper.id,
          materialId: material.id,
          quantity: 1,
          distributedBy: '陈后勤',
          status: 'distributed',
        });
      });
    });
    
    return this.distributionRepo.save(distributions.map(d => this.distributionRepo.create(d)));
  }

  async seedResupplyRequests(campers: Camper[], materials: Material[]) {
    const requests = [
      {
        camperId: campers[0].id,
        materialId: materials[2].id,
        quantity: 1,
        requestType: 'lost',
        reason: '洗漱包在户外活动时遗失，孩子无法正常洗漱',
        requestedBy: '李老师',
        status: 'pending',
        currentHandler: 'director',
      },
      {
        camperId: campers[1].id,
        materialId: materials[4].id,
        quantity: 1,
        requestType: 'damaged',
        reason: '驱蚊液喷雾头损坏，无法正常使用',
        requestedBy: '王老师',
        status: 'approved',
        currentHandler: 'logistics',
        reviewedBy: '张明',
      },
      {
        camperId: campers[2].id,
        materialId: materials[1].id,
        quantity: 1,
        requestType: 'other',
        reason: '孩子对棉被材质过敏，需要更换防过敏床上用品',
        requestedBy: '李老师',
        status: 'fulfilled',
        currentHandler: 'teacher',
        reviewedBy: '张明',
        fulfilledBy: '陈后勤',
        fulfillNote: '已更换为防过敏蚕丝被',
      },
      {
        camperId: campers[3].id,
        materialId: materials[5].id,
        quantity: 2,
        requestType: 'insufficient',
        reason: '防晒霜用量较大，户外时间长，需要额外补充',
        requestedBy: '王老师',
        status: 'closed',
        currentHandler: null,
        reviewedBy: '张明',
        fulfilledBy: '陈后勤',
        followupNote: '家长已确认收到，孩子使用情况良好',
        parentNotified: true,
      },
      {
        camperId: campers[4].id,
        materialId: materials[0].id,
        quantity: 1,
        requestType: 'size_issue',
        reason: '营服尺码偏小，孩子穿着不合身，需要更换大一号',
        requestedBy: '李老师',
        status: 'rejected',
        currentHandler: null,
        reviewedBy: '张明',
        rejectReason: '目前没有更大尺码的库存，建议先凑合用，后续统一处理',
      },
    ];
    
    const saved = await this.resupplyRepo.save(requests.map(r => this.resupplyRepo.create(r)));
    
    await this.evidenceRepo.save([
      { requestId: saved[0].id, actionType: 'create', content: '班务老师发起补领申请', operator: '李老师', operatorRole: 'teacher' },
      { requestId: saved[1].id, actionType: 'create', content: '班务老师发起补领申请', operator: '王老师', operatorRole: 'teacher' },
      { requestId: saved[1].id, actionType: 'review_approve', content: '营地主任审核通过', operator: '张明', operatorRole: 'director' },
      { requestId: saved[2].id, actionType: 'create', content: '班务老师发起补领申请', operator: '李老师', operatorRole: 'teacher' },
      { requestId: saved[2].id, actionType: 'review_approve', content: '营地主任审核通过', operator: '张明', operatorRole: 'director' },
      { requestId: saved[2].id, actionType: 'fulfill', content: '后勤完成物资发放', operator: '陈后勤', operatorRole: 'logistics' },
      { requestId: saved[3].id, actionType: 'create', content: '班务老师发起补领申请', operator: '王老师', operatorRole: 'teacher' },
      { requestId: saved[3].id, actionType: 'review_approve', content: '营地主任审核通过', operator: '张明', operatorRole: 'director' },
      { requestId: saved[3].id, actionType: 'fulfill', content: '后勤完成物资发放', operator: '陈后勤', operatorRole: 'logistics' },
      { requestId: saved[3].id, actionType: 'close', content: '班务老师确认完成并回访家长', operator: '王老师', operatorRole: 'teacher' },
      { requestId: saved[4].id, actionType: 'create', content: '班务老师发起补领申请', operator: '李老师', operatorRole: 'teacher' },
      { requestId: saved[4].id, actionType: 'review_reject', content: '营地主任驳回申请: 目前没有更大尺码的库存', operator: '张明', operatorRole: 'director' },
    ].map(e => this.evidenceRepo.create(e)));
    
    return saved;
  }

  async seedCheckIns(campers: Camper[]) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const checkIns = [];
    
    campers.forEach(camper => {
      checkIns.push({
        camperId: camper.id,
        activity: '开营仪式',
        activityDate: yesterday,
        checkedIn: true,
        checkedInAt: yesterday,
        checkedInBy: '李老师',
      });
      
      checkIns.push({
        camperId: camper.id,
        activity: '早餐',
        activityDate: today,
        checkedIn: camper.id % 3 !== 0,
        checkedInAt: camper.id % 3 !== 0 ? today : null,
        checkedInBy: camper.id % 3 !== 0 ? '王老师' : null,
      });
    });
    
    return this.checkInRepo.save(checkIns.map(c => this.checkInRepo.create(c)));
  }

  async seedMedicalReports(campers: Camper[]) {
    const reports = [
      {
        camperId: campers[1].id,
        symptom: '哮喘发作',
        description: '户外活动后出现呼吸急促，使用随身药物后缓解',
        reportType: 'chronic',
        reportedBy: '李老师',
        status: 'handled',
        handledBy: '陈后勤',
        handlingNote: '已使用沙丁胺醇气雾剂，情况稳定，建议减少剧烈运动',
        parentNotified: true,
        parentNotification: '已电话告知家长，家长表示已知晓孩子情况，同意按建议处理',
      },
      {
        camperId: campers[5].id,
        symptom: '皮肤过敏',
        description: '手臂出现红疹，疑似接触性皮炎',
        reportType: 'allergy',
        reportedBy: '王老师',
        status: 'pending',
      },
      {
        camperId: campers[9].id,
        symptom: '头晕',
        description: '孩子自述头晕，面色苍白，有心脏病史',
        reportType: 'emergency',
        reportedBy: '李老师',
        status: 'handled',
        handledBy: '陈后勤',
        handlingNote: '已送医务室检查，心率正常，建议休息观察',
        parentNotified: true,
      },
    ];
    
    return this.medicalRepo.save(reports.map(r => this.medicalRepo.create(r)));
  }
}
