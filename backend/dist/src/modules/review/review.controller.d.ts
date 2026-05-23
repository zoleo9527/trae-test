import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto, VerifyReviewDto, QueryReviewDto } from './dto/review.dto';
import { ReviewRecord } from '../../entities/review-record.entity';
import { PaginatedResult } from '../../common/dto/pagination.dto';
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    create(createDto: CreateReviewDto): Promise<ReviewRecord>;
    findAll(queryDto: QueryReviewDto): Promise<PaginatedResult<ReviewRecord>>;
    findOne(id: string): Promise<ReviewRecord>;
    update(id: string, updateDto: UpdateReviewDto): Promise<ReviewRecord>;
    verify(id: string, verifyDto: VerifyReviewDto): Promise<ReviewRecord>;
    delete(id: string): Promise<void>;
}
