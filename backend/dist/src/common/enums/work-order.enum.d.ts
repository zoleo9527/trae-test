export declare enum WorkOrderStatus {
    ABNORMAL_REPORTED = "abnormal_reported",
    DOWNTIME_CONFIRMED = "downtime_confirmed",
    PART_REQUESTED = "part_requested",
    PART_APPROVED = "part_approved",
    PART_RECEIVED = "part_received",
    REPAIR_COMPLETED = "repair_completed",
    REVIEW_SUBMITTED = "review_submitted",
    CLOSED = "closed"
}
export declare const WorkOrderStatusLabels: Record<WorkOrderStatus, string>;
export declare const WorkOrderStatusFlow: Record<WorkOrderStatus, WorkOrderStatus[]>;
export declare enum AbnormalType {
    INVERTER_FAULT = "inverter_fault",
    STRING_ABNORMAL = "string_abnormal",
    COMMUNICATION_FAILURE = "communication_failure",
    GRID_ABNORMAL = "grid_abnormal",
    WEATHER_ISSUE = "weather_issue",
    OTHER = "other"
}
export declare const AbnormalTypeLabels: Record<AbnormalType, string>;
