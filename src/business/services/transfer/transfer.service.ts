import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTransferDto } from 'src/business/dtos';
import { DateRangeModel, PaginationModel } from 'src/data/models';
import { TransferEntity } from 'src/data/persistence/entities';
import { TransferRepository } from 'src/data/persistence/repositories';
import { AccountService } from '../account';
import { UnauthorizedException } from '@nestjs/common/exceptions';

@Injectable()
export class TransferService {
  constructor(
    private readonly transferRepository: TransferRepository,
    private readonly accountService: AccountService,
  ) {}

  //Retorna todas las transferencias registradas en el sistema
  getAll(): TransferEntity[] {
    return this.transferRepository.findAll();
  }

  getAllByCustomer(
    customerId: string,
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): string {
    const accounts = this.accountService.getAccountsByCustomer(customerId);
    const totalTransfers: TransferEntity[] = [];
    for (const account of accounts) {
      let currentTransfersOut = this.transferRepository.findByOutcomeAccount(
        account.id,
      );
      currentTransfersOut = JSON.parse(JSON.stringify(currentTransfersOut));
      for (const out of currentTransfersOut) {
        out.amount = out.amount * -1;
      }
      totalTransfers.push(
        ...this.transferRepository.findByIncomeAccount(account.id),
        ...currentTransfersOut,
      );
    }
    const pageTransfers = this.historyPagination(
      totalTransfers,
      pagination,
      dateRange,
    );
    const result = {
      ...pageTransfers,
      transfers: this.formatTransfers(pageTransfers.transfers),
    };
    return JSON.stringify(result);
  }

  getHistoryOutByCustomer(
    customerId: string,
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): string {
    const accounts = this.accountService.getAccountsByCustomer(customerId);
    const totalTransfers: TransferEntity[] = [];
    for (const account of accounts) {
      totalTransfers.push(
        ...this.transferRepository.findByOutcomeAccount(account.id),
      );
    }
    const result = this.historyPagination(
      totalTransfers,
      pagination,
      dateRange,
    );
    return JSON.stringify(result);
  }

  getHistoryInByCustomer(
    customerId: string,
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): string {
    const accounts = this.accountService.getAccountsByCustomer(customerId);
    const totalTransfers: TransferEntity[] = [];
    for (const account of accounts) {
      totalTransfers.push(
        ...this.transferRepository.findByIncomeAccount(account.id),
      );
    }
    const result = this.historyPagination(
      totalTransfers,
      pagination,
      dateRange,
    );
    return JSON.stringify(result);
  }
  //Registra la transferancia en el sistema y actualiza el balance en las cuentas afectadas
  createTransfer(customerId: string, transfer: CreateTransferDto): string {
    if (transfer.incomeId === transfer.outcomeId) {
      throw new ConflictException('No se puede transferir a la misma cuenta');
    }
    const incomeAccount = this.accountService.getAnyAccountById(
      transfer.incomeId,
    );
    const outcomeAccount = this.accountService.getAccountById(
      customerId,
      transfer.outcomeId,
    );
    const newTransfer = new TransferEntity();
    newTransfer.amount = transfer.amount;
    newTransfer.dateTime = Date.now();
    newTransfer.income = incomeAccount;
    newTransfer.outcome = outcomeAccount;
    newTransfer.reason = transfer.reason;
    if (outcomeAccount.balance >= transfer.amount) {
      this.transferRepository.register(newTransfer);
      this.accountService.addBalance(incomeAccount.id, transfer.amount);
      this.accountService.removeBalance(outcomeAccount.id, transfer.amount);
      return JSON.stringify(this.formatTransfers([newTransfer]));
    }
    throw new ConflictException('Saldo insuficiente');
  }

  //Devuelve historial de transferencias con cuenta de entrada enviada junto a paginacion y rangos
  getHistoryOut(
    accountId: string,
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): string {
    const currentTransfers =
      this.transferRepository.findByOutcomeAccount(accountId);
    const pageTransfers = this.historyPagination(
      currentTransfers,
      pagination,
      dateRange,
    );
    const result = {
      ...pageTransfers,
      transfers: this.formatTransfers(pageTransfers.transfers),
    };
    return JSON.stringify(result);
  }

  //Devuelve historial de transferencias con cuenta de salida enviada junto a paginacion y rangos
  getHistoryIn(
    accountId: string,
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): string {
    const currentTransfers =
      this.transferRepository.findByIncomeAccount(accountId);
    const pageTransfers = this.historyPagination(
      currentTransfers,
      pagination,
      dateRange,
    );
    const result = {
      ...pageTransfers,
      transfers: this.formatTransfers(pageTransfers.transfers),
    };
    return JSON.stringify(result);
  }

  //Devuelve todas las transferencias realizadas segun paginacion y rango
  getHistory(
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
    const pageTransfers = this.historyPagination(
      currentTransfers,
      pagination,
      dateRange,
    );
    const result = {
      ...pageTransfers,
      transfers: this.formatTransfers(pageTransfers.transfers),
    };
    return JSON.stringify(result);
  }

  //Borrado de la transferencia enviada
  deleteTransfer(customerId: string, transferId: string): void {
    if (
      this.transferRepository.findOneById(transferId).outcome.customer.id !==
      customerId
    ) {
      throw new UnauthorizedException(
        'La transferencia a eliminar no pertenece al cliente',
      );
    }
    this.transferRepository.delete(transferId, true);
  }

  getNegative(
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
    const pageTransfers = this.historyPagination(
      currentTransfers,
      pagination,
      dateRange,
    );
    const result = {
      ...pageTransfers,
      transfers: this.formatTransfers(pageTransfers.transfers),
    };
    return JSON.stringify(result);
  }

  //Metodo generico para paginacion
  private historyPagination(
    transfers: TransferEntity[],
    pagination: PaginationModel,
    dateRange?: DateRangeModel,
  ): {
    currentPage: number;
    totalPages: number;
    range: number;
    size: number;
    transfers: TransferEntity[];
    dateInit?: number | Date;
    dateEnd?: number | Date;
  } {
    transfers = transfers.reverse();
    let dateRangeTransfers: TransferEntity[];
    let dateInit: number | Date;
    let dateEnd: number | Date;
    if (dateRange) {
      dateInit = dateRange.dateInit ?? new Date('1999-01-01').getTime();
      dateEnd = dateRange.dateEnd ?? Date.now();
      dateRangeTransfers = transfers.filter(
        ({ dateTime }) => dateTime >= dateInit && dateTime <= dateEnd,
      );
    } else {
      dateInit = new Date('1999-01-01').getTime();
      dateEnd = Date.now();
      dateRangeTransfers = transfers;
    }
    const size = dateRangeTransfers.length;
    const currentPage = pagination?.currentPage ?? 1;
    const range = pagination?.range ?? 10;
    const totalPages = Math.ceil(size / range);
    const paginationTransfers: TransferEntity[] = [];
    const start = currentPage * range - range;
    const end = start + range;
    for (let i = start; i < end; i++) {
      transfers[i] ? paginationTransfers.push(transfers[i]) : (i = end);
    }
    return {
      currentPage,
      totalPages,
      range,
      size,
      transfers: paginationTransfers,
      dateInit,
      dateEnd,
    };
  }

  private formatTransfers(transfers: TransferEntity[]): {
    id: string;
    incomeId: string;
    outcomeId: string;
    amount: number;
    reason: string;
    dateTime: number | Date;
  }[] {
    const newTransfers: {
      id: string;
      incomeId: string;
      outcomeId: string;
      amount: number;
      reason: string;
      dateTime: number | Date;
    }[] = [];

    for (const d of transfers) {
      newTransfers.push({
        id: d.id,
        incomeId: d.income.id,
        outcomeId: d.outcome.id,
        amount: d.amount,
        reason: d.reason,
        dateTime: d.dateTime,
      });
    }
    newTransfers.sort((p1, p2) =>
      p1.dateTime < p2.dateTime ? 1 : p1.dateTime > p2.dateTime ? -1 : 0,
    );
    return newTransfers;
  }
}
