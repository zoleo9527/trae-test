export declare enum UserRole {
    BASE_MANAGER = "base_manager",
    INSPECTOR = "inspector",
    SALES = "sales"
}
export declare class User {
    id: number;
    name: string;
    role: UserRole;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
}
