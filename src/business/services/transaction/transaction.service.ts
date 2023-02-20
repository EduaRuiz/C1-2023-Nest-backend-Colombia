import { Injectable } from '@nestjs/common';
import { DateRangeModel, PaginationModel } from 'src/data/models';
import { DepositEntity } from '../../../data/persistence/entities/deposit.entity';
import { TransferEntity } from '../../../data/persistence/entities/transfer.entity';
import { AccountService } from '../account/account.service';
import {
  DepositRepository,
  TransferRepository,
} from 'src/data/persistence/repositories';

@Injectable()
export class TransactionService {
  constructor(
    private readonly transferRepository: TransferRepository,
    private readonly depositRepository: DepositRepository,
    private readonly accountService: AccountService,
  ) {}

  getAllbyCustomer(
    customerId: string,
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): string {
    const accounts = this.accountService.getAccountsByCustomer(customerId);
    const totalTransfers: TransferEntity[] = [];
    const totalDeposits: DepositEntity[] = [];
    for (const account of accounts) {
      let currentTransfersOut = this.transferRepository.findByOutcomeAccount(
        account.id,
      );
      currentTransfersOut = JSON.parse(JSON.stringify(currentTransfersOut));
      for (const out of currentTransfersOut) {
        out.amount = out.amount * -1;
      }
      const currentTransfersIn = this.transferRepository.findByIncomeAccount(
        account.id,
      );
      const currentTransfers = [...currentTransfersIn, ...currentTransfersOut];
      const currentDeposits = this.depositRepository.findByAccountId(
        account.id,
      );
      totalTransfers.push(...currentTransfers);
      totalDeposits.push(...currentDeposits);
    }
    const transactions = [
      ...this.formatTransactions(totalDeposits, 'Deposit'),
      ...this.formatTransactions(totalTransfers, 'Transfer'),
    ];
    const retult = this.historyPagination(transactions, pagination, dateRange);
    return JSON.stringify(retult);
  }

  getAllByAccount(
    accountId: string,
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): string {
    let currentTransfersOut =
      this.transferRepository.findByOutcomeAccount(accountId);
    currentTransfersOut = JSON.parse(JSON.stringify(currentTransfersOut));
    for (const out of currentTransfersOut) {
      out.amount = out.amount * -1;
    }
    const currentTransfersIn =
      this.transferRepository.findByIncomeAccount(accountId);
    const currentTransfers = [...currentTransfersIn, ...currentTransfersOut];
    const currentDeposits = this.depositRepository.findByAccountId(accountId);
    const transactions = [
      ...this.formatTransactions(currentDeposits, 'Deposit'),
      ...this.formatTransactions(currentTransfers, 'Transfer'),
    ];
    const retult = this.historyPagination(transactions, pagination, dateRange);
    return JSON.stringify(retult);
  }

  private formatTransactions(
    transactions: DepositEntity[] | TransferEntity[],
    type: string,
  ): {
    id: string;
    type: string;
    amount: number;
    dateTime: number | Date;
  }[] {
    const result: {
      id: string;
      type: string;
      amount: number;
      dateTime: number | Date;
    }[] = [];
    for (const transaction of transactions) {
      result.push({
        id: transaction.id,
        type: type,
        amount: transaction.amount,
        dateTime: transaction.dateTime,
      });
    }
    return result;
  }

  private historyPagination(
    transactions: {
      id: string;
      type: string;
      amount: number;
      dateTime: number | Date;
    }[],
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): {
    currentPage: number;
    totalPages: number;
    range: number;
    size: number;
    transactions: {
      id: string;
      type: string;
      amount: number;
      dateTime: number | Date;
    }[];
    dateInit?: number | Date;
    dateEnd?: number | Date;
  } {
    try {
      transactions?.sort((p1, p2) =>
        p1.dateTime < p2.dateTime ? 1 : p1.dateTime > p2.dateTime ? -1 : 0,
      );
    } catch (error) {
      console.log(error);
    }
    let dateRangeTransactions: {
      id: string;
      type: string;
      amount: number;
      dateTime: number | Date;
    }[];
    let dateInit: number | Date;
    let dateEnd: number | Date;
    if (dateRange) {
      dateInit = dateRange.dateInit ?? new Date('1999-01-01').getTime();
      dateEnd = dateRange.dateEnd ?? Date.now();
      dateRangeTransactions = transactions.filter(
        ({ dateTime }) => dateTime >= dateInit && dateTime <= dateEnd,
      );
    } else {
      dateInit = new Date('1999-01-01').getTime();
      dateEnd = Date.now();
      dateRangeTransactions = transactions;
    }
    const size = dateRangeTransactions.length;
    const currentPage = pagination?.currentPage ?? 1;
    const range = pagination?.range ?? 10;
    const totalPages = Math.ceil(size / range);
    const paginationTransactions: {
      id: string;
      type: string;
      amount: number;
      dateTime: number | Date;
    }[] = [];
    const start = currentPage * range - range;
    const end = start + range;
    for (let i = start; i < end; i++) {
      transactions[i]
        ? paginationTransactions.push(transactions[i])
        : (i = end);
    }
    return {
      currentPage,
      totalPages,
      range,
      size,
      transactions: paginationTransactions,
      dateInit,
      dateEnd,
    };
  }
}
