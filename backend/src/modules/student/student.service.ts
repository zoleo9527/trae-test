import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { BusinessError, ErrorCode } from '../../common/errors/business-error';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async create(data: Partial<Student>): Promise<Student> {
    const student = this.studentRepository.create(data);
    return this.studentRepository.save(student);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    keyword?: string,
  ): Promise<{ data: Student[]; total: number }> {
    const query = this.studentRepository.createQueryBuilder('student');

    if (keyword) {
      query.where(
        'student.name LIKE :keyword OR student.phone LIKE :keyword OR student.email LIKE :keyword',
        { keyword: `%${keyword}%` },
      );
    }

    const [data, total] = await query
      .orderBy('student.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['workOrders'],
    });

    if (!student) {
      throw BusinessError(ErrorCode.STUDENT_NOT_FOUND, `学生 ${id} 不存在`);
    }

    return student;
  }

  async update(id: string, data: Partial<Student>): Promise<Student> {
    const student = await this.findOne(id);
    Object.assign(student, data);
    return this.studentRepository.save(student);
  }
}
