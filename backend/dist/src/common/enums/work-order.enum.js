"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbnormalTypeLabels = exports.AbnormalType = exports.WorkOrderStatusFlow = exports.WorkOrderStatusLabels = exports.WorkOrderStatus = void 0;
var WorkOrderStatus;
(function (WorkOrderStatus) {
    WorkOrderStatus["ABNORMAL_REPORTED"] = "abnormal_reported";
    WorkOrderStatus["DOWNTIME_CONFIRMED"] = "downtime_confirmed";
    WorkOrderStatus["PART_REQUESTED"] = "part_requested";
    WorkOrderStatus["PART_APPROVED"] = "part_approved";
    WorkOrderStatus["PART_RECEIVED"] = "part_received";
    WorkOrderStatus["REPAIR_COMPLETED"] = "repair_completed";
    WorkOrderStatus["REVIEW_SUBMITTED"] = "review_submitted";
    WorkOrderStatus["CLOSED"] = "closed";
})(WorkOrderStatus || (exports.WorkOrderStatus = WorkOrderStatus = {}));
exports.WorkOrderStatusLabels = {
    [WorkOrderStatus.ABNORMAL_REPORTED]: '待确认停机',
    [WorkOrderStatus.DOWNTIME_CONFIRMED]: '待申请备件',
    [WorkOrderStatus.PART_REQUESTED]: '待审批备件',
    [WorkOrderStatus.PART_APPROVED]: '待签收备件',
    [WorkOrderStatus.PART_RECEIVED]: '待完成维修',
    [WorkOrderStatus.REPAIR_COMPLETED]: '待提交复盘',
    [WorkOrderStatus.REVIEW_SUBMITTED]: '待验证复盘',
    [WorkOrderStatus.CLOSED]: '已关闭',
};
exports.WorkOrderStatusFlow = {
    [WorkOrderStatus.ABNORMAL_REPORTED]: [WorkOrderStatus.DOWNTIME_CONFIRMED],
    [WorkOrderStatus.DOWNTIME_CONFIRMED]: [WorkOrderStatus.PART_REQUESTED, WorkOrderStatus.REPAIR_COMPLETED],
    [WorkOrderStatus.PART_REQUESTED]: [WorkOrderStatus.PART_APPROVED, WorkOrderStatus.DOWNTIME_CONFIRMED],
    [WorkOrderStatus.PART_APPROVED]: [WorkOrderStatus.PART_RECEIVED],
    [WorkOrderStatus.PART_RECEIVED]: [WorkOrderStatus.REPAIR_COMPLETED],
    [WorkOrderStatus.REPAIR_COMPLETED]: [WorkOrderStatus.REVIEW_SUBMITTED],
    [WorkOrderStatus.REVIEW_SUBMITTED]: [WorkOrderStatus.CLOSED],
    [WorkOrderStatus.CLOSED]: [],
};
var AbnormalType;
(function (AbnormalType) {
    AbnormalType["INVERTER_FAULT"] = "inverter_fault";
    AbnormalType["STRING_ABNORMAL"] = "string_abnormal";
    AbnormalType["COMMUNICATION_FAILURE"] = "communication_failure";
    AbnormalType["GRID_ABNORMAL"] = "grid_abnormal";
    AbnormalType["WEATHER_ISSUE"] = "weather_issue";
    AbnormalType["OTHER"] = "other";
})(AbnormalType || (exports.AbnormalType = AbnormalType = {}));
exports.AbnormalTypeLabels = {
    [AbnormalType.INVERTER_FAULT]: '逆变器故障',
    [AbnormalType.STRING_ABNORMAL]: '组串异常',
    [AbnormalType.COMMUNICATION_FAILURE]: '通信故障',
    [AbnormalType.GRID_ABNORMAL]: '电网异常',
    [AbnormalType.WEATHER_ISSUE]: '天气问题',
    [AbnormalType.OTHER]: '其他',
};
//# sourceMappingURL=work-order.enum.js.map