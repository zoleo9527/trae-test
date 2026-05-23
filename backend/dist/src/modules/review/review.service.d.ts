import { Repository, DataSource } from 'typeorm';
import { ReviewRecord } from '../../entities/review-record.entity';
import { WorkOrder } from '../../entities/work-order.entity';
import { CreateReviewDto, UpdateReviewDto, VerifyReviewDto, QueryReviewDto } from './dto/review.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class ReviewService {
    private reviewRepository;
    private workOrderRepository;
    private dataSource;
    constructor(reviewRepository: Repository<ReviewRecord>, workOrderRepository: Repository<WorkOrder>, dataSource: DataSource);
    create(createDto: CreateReviewDto): Promise<ReviewRecord>;
    findAll(queryDto: QueryReviewDto): Promise<PaginatedResult<ReviewRecord>>;
    findOne(id: string): Promise<ReviewRecord>;
    update(id: string, updateDto: UpdateReviewDto): Promise<ReviewRecord>;
    verify(id: string, verifyDto: VerifyReviewDto): Promise<ReviewRecord>;
    delete(id: string): Promise<void>;
}
