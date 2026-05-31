export declare enum Role {
    ADMIN = "admin",
    PROJECT_MANAGER = "project_manager",
    SUPERVISOR = "supervisor",
    FOREMAN = "foreman",
    WORKER = "worker",
    ACCOUNTANT = "accountant",
    CLIENT = "client"
}
export declare const RolePermissions: {
    admin: string[];
    project_manager: string[];
    supervisor: string[];
    foreman: string[];
    worker: string[];
    accountant: string[];
    client: string[];
};
