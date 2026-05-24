import { TransferStatus } from '../enums/transfer-status.enum';
export declare class TransferStateMachine {
    private static readonly transitions;
    static canTransition(from: TransferStatus, to: TransferStatus): boolean;
    static transition(from: TransferStatus, to: TransferStatus): void;
    static getAllowedTransitions(status: TransferStatus): TransferStatus[];
}
