import { StudentService } from './student.service';
export declare class StudentController {
    private readonly studentService;
    constructor(studentService: StudentService);
    create(data: any): Promise<import("./student.entity").Student>;
    findAll(page?: number, limit?: number, keyword?: string): Promise<{
        data: import("./student.entity").Student[];
        total: number;
    }>;
    findOne(id: string): Promise<import("./student.entity").Student>;
    update(id: string, data: any): Promise<import("./student.entity").Student>;
}
