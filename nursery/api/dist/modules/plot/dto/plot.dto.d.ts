export declare class CreatePlotDto {
    name: string;
    location?: string;
    variety?: string;
    specification?: string;
    quantity?: number;
    inspectorId: number;
}
export declare class QueryPlotDto {
    name?: string;
    location?: string;
    variety?: string;
    inspectorId?: number;
}
