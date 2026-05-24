"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("./student.entity");
const business_error_1 = require("../../common/errors/business-error");
let StudentService = class StudentService {
    constructor(studentRepository) {
        this.studentRepository = studentRepository;
    }
    async create(data) {
        const student = this.studentRepository.create(data);
        return this.studentRepository.save(student);
    }
    async findAll(page = 1, limit = 20, keyword) {
        const query = this.studentRepository.createQueryBuilder('student');
        if (keyword) {
            query.where('student.name LIKE :keyword OR student.phone LIKE :keyword OR student.email LIKE :keyword', { keyword: `%${keyword}%` });
        }
        const [data, total] = await query
            .orderBy('student.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
    async findOne(id) {
        const student = await this.studentRepository.findOne({
            where: { id },
            relations: ['workOrders'],
        });
        if (!student) {
            throw (0, business_error_1.createError)(business_error_1.ErrorCode.STUDENT_NOT_FOUND, `学生 ${id} 不存在`);
        }
        return student;
    }
    async update(id, data) {
        const student = await this.findOne(id);
        Object.assign(student, data);
        return this.studentRepository.save(student);
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StudentService);
//# sourceMappingURL=student.service.js.map