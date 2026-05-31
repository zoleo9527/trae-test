export declare enum AuditAction {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
    STATUS_CHANGE = "status_change",
    SIGN_OFF = "sign_off",
    SIGN_OFF_REJECT = "sign_off_reject",
    VERSION_CREATE = "version_create",
    EXPORT = "export",
    LOGIN = "login",
    LOGOUT = "logout"
}
export declare enum AuditEntityType {
    USER = "user",
    CHANGE_ORDER = "change_order",
    DAILY_REPORT = "daily_report",
    DELIVERY = "delivery",
    SIGN_OFF = "sign_off"
}
