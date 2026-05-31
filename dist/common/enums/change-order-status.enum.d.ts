export declare enum ChangeOrderStatus {
    DRAFT = "draft",
    SUBMITTED = "submitted",
    UNDER_REVIEW = "under_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    SETTLED = "settled",
    CANCELLED = "cancelled"
}
export declare enum ChangeOrderType {
    DESIGN_CHANGE = "design_change",
    MATERIAL_CHANGE = "material_change",
    CONSTRUCTION_METHOD = "construction_method",
    SCOPE_CHANGE = "scope_change",
    SITE_CONDITION = "site_condition",
    OTHER = "other"
}
export declare const ChangeOrderStatusFlow: {
    draft: ChangeOrderStatus[];
    submitted: ChangeOrderStatus[];
    under_review: ChangeOrderStatus[];
    approved: ChangeOrderStatus[];
    rejected: ChangeOrderStatus[];
    in_progress: ChangeOrderStatus[];
    completed: ChangeOrderStatus[];
    settled: any[];
    cancelled: any[];
};
