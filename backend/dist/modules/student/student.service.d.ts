import { Repository } from 'typeorm';
import { Student } from './student.entity';
export declare class StudentService {
    private readonly studentRepository;
    constructor(studentRepository: Repository<Student>);
    create(data: Partial<Student>): Promise<Student>;
    findAll(page?: number, limit?: number, keyword?: string): Promise<{
        data: Student[];
        total: number;
    }>;
    findOne(id: string): Promise<Student>;
    update(id: string, data: Partial<Student>): Promise<Student>;
}
