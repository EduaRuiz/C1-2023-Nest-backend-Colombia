import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountService, CreateDepositDto } from 'src/business';
import { DateRangeModel, PaginationModel } from 'src/data/models';
import { DepositEntity } from 'src/data/persistence/entities';
import { DepositRepository } from 'src/data/persistence/repositories';

@Injectable()
export class DepositService {
  constructor(
    private readonly accountService: AccountService,
    private readonly depositRepository: DepositRepository,
  ) {}

  //Retorna todos los depositos registrados a la fecha
  getAll(pagination: PaginationModel, dateRange?: DateRangeModel): string {
    const deposits = this.depositRepository.findAll();
    const depositsHistory = this.historyPagination(
      deposits,
      pagination,
      dateRange,
    );
    const result = {
      ...depositsHistory,
      deposits: this.formatDeposits(depositsHistory.deposits),
    };
    return JSON.stringify(result);
  }

  //Creacion de un deposito y actualiza el balance de la cuenta afectada
  createDeposit(customerId: string, deposit: CreateDepositDto): string {
    const newDeposit = new DepositEntity();
    newDeposit.account = this.accountService.getAccountById(
      customerId,
      deposit.accountId,
    );
    newDeposit.amount = deposit.amount;
    newDeposit.dateTime = Date.now();
    this.depositRepository.register(newDeposit);
    this.accountService.addBalance(newDeposit.account.id, newDeposit.amount);
    return JSON.stringify(this.formatDeposits([newDeposit])[0]);
  }

  //Eliminacion de un deposito
  deleteDeposit(customerId: string, depositId: string): string {
    const account = this.depositRepository.findOneById(depositId).account;
    this.accountService.getAccountById(customerId, account.id);
    this.depositRepository.delete(depositId, true);
    return JSON.stringify(true);
  }

  //Retorna el listado de depositos relacionados a la cuenta de acuerdo a la paginacion solicitada
  getHistoryByAccount(
    customerId: string,
    accountId: string,
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): string {
    if (!pagination) {
      throw new BadRequestException(`Se debe paginar la solicitud`);
    }
    const account = this.accountService.getAccountById(customerId, accountId);
    const currentDeposits = this.depositRepository.findByAccountId(account.id);
    const historyPageDeposits = this.historyPagination(
      currentDeposits,
      pagination,
      dateRange,
    );
    const result = {
      ...historyPageDeposits,
      deposits: this.formatDeposits(historyPageDeposits.deposits),
    };
    return JSON.stringify(result);
  }

  getHistoryByCustomer(
    customerId: string,
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): string {
    const accounts = this.accountService.getAccountsByCustomer(customerId);
    const totalDeposits: DepositEntity[] = [];
    for (const account of accounts) {
      totalDeposits.push(...this.depositRepository.findByAccountId(account.id));
    }
    const historyPageDeposits = this.historyPagination(
      totalDeposits,
      pagination,
      dateRange,
    );
    const result = {
      ...historyPageDeposits,
      deposits: this.formatDeposits(historyPageDeposits.deposits),
    };
    return JSON.stringify(result);
  }

  private historyPagination(
    deposits: DepositEntity[],
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): {
    currentPage: number;
    totalPages: number;
    range: number;
    size: number;
    deposits: DepositEntity[];
    dateInit?: number | Date;
    dateEnd?: number | Date;
  } {
    deposits = deposits.reverse();
    let dateRangeDeposits: DepositEntity[];
    let dateInit: number | Date;
    let dateEnd: number | Date;
    if (dateRange) {
      dateInit = dateRange.dateInit ?? new Date('1999-01-01').getTime();
      dateEnd = dateRange.dateEnd ?? Date.now();
      dateRangeDeposits = deposits.filter(
        ({ dateTime }) => dateTime >= dateInit && dateTime <= dateEnd,
      );
    } else {
      dateInit = new Date('1999-01-01').getTime();
      dateEnd = Date.now();
      dateRangeDeposits = deposits;
    }
    const size = dateRangeDeposits.length;
    const currentPage = pagination?.currentPage ?? 1;
    const range = pagination?.range ?? 10;
    const totalPages = Math.ceil(size / range);
    const paginationDeposits: DepositEntity[] = [];
    const start = currentPage * range - range;
    const end = start + range;
    for (let i = start; i < end; i++) {
      deposits[i] ? paginationDeposits.push(deposits[i]) : (i = end);
    }
    return {
      currentPage,
      totalPages,
      range,
      size,
      deposits: paginationDeposits,
      dateInit,
      dateEnd,
    };
  }

  private formatDeposits(deposits: DepositEntity[]): {
    id: string;
    accountId: string;
    amount: number;
    dateTime: number | Date;
  }[] {
    const newDeposits: {
      id: string;
      accountId: string;
      amount: number;
      dateTime: number | Date;
    }[] = [];

    for (const d of deposits) {
      newDeposits.push({
        id: d.id,
        accountId: d.account.id,
        amount: d.amount,
        dateTime: d.dateTime,
      });
    }
    return newDeposits;
  }
}
