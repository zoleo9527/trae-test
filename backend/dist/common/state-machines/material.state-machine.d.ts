import { MaterialStatus } from '../enums/material-status.enum';
export declare class MaterialStateMachine {
    private static readonly transitions;
    static canTransition(from: MaterialStatus, to: MaterialStatus): boolean;
    static transition(from: MaterialStatus, to: MaterialStatus): void;
    static getAllowedTransitions(status: MaterialStatus): MaterialStatus[];
}
