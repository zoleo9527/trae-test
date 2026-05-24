import { CommentService } from './comment.service';
export declare class CommentController {
    private readonly commentService;
    constructor(commentService: CommentService);
    create(data: any): Promise<import("./comment.entity").Comment>;
    findByEntity(filters: any): Promise<import("./comment.entity").Comment[]>;
}
