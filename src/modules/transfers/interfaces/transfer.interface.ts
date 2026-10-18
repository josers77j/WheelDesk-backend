import { ContextUser } from '../../../common/interfaces/context-user.interface';
import {
  CreateTransferDto,
  TransferDetailDto,
} from '../dto/create-transfer.dto';

export interface ExecuteTransferParams {
  createTransferDto: CreateTransferDto;
  user: ContextUser;
}

export interface ResolvedTransferDetail {
  detail: TransferDetailDto;
  productName: string;
}

export interface TransferExecutionResult {
  transferId: number;
  status: string;
  movementsCreated: number;
}
