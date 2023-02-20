import { ConflictException, Injectable } from '@nestjs/common';
import { CreateAccountDto } from 'src/business/dtos';
import { PaginationModel } from 'src/data';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import {
  AccountEntity,
  AccountTypeEntity,
} from 'src/data/persistence/entities';
import {
  AccountRepository,
  AccountTypeRepository,
  CustomerRepository,
  DepositRepository,
  TransferRepository,
} from 'src/data/persistence/repositories';

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountTypeRepository: AccountTypeRepository,
    private readonly transferRepository: TransferRepository,
    private readonly depositRepository: DepositRepository,
    private readonly customerRepository: CustomerRepository,
  ) {}
  //Retorna el liestado de todas las cuentas, este metodo solo se usaria para administradores pero por ahora todos
  getAll(pagination: PaginationModel): string {
    const accounts = this.accountRepository.findAll();
    const pageAccounts = this.historyPagination(accounts, pagination);
    const result = {
      ...pageAccounts,
      accounts: this.formatAccounts(pageAccounts.accounts),
    };
    return JSON.stringify(result);
  }

  //Trae todas las cuentas relacionadas al cliente
  getAllByCustomer(customerId: string, pagination: PaginationModel): string {
    const accounts = this.accountRepository.findByCustomer(customerId);
    const pageAccounts = this.historyPagination(accounts, pagination);
    const result = {
      ...pageAccounts,
      accounts: this.formatAccounts(pageAccounts.accounts),
    };
    return JSON.stringify(result);
  }

  //Retorna la cuenta segun el id y el cliente
  getAccountById(customerId: string, accountId: string): AccountEntity {
    const account = this.accountRepository.findOneById(accountId);
    if (account.customer.id !== customerId) {
      throw new UnauthorizedException(
        'El id de cuenta no existe o no pertenece al cliente',
      );
    }
    return this.accountRepository.findOneById(accountId);
  }

  getAnyAccountById(accountId: string): AccountEntity {
    return this.accountRepository.findOneById(accountId);
  }

  exist(accountId: string): boolean {
    try {
      this.accountRepository.findOneById(accountId);
      return true;
    } catch (error) {
      return false;
    }
  }

  //Creacion de cuentas
  createAccount(customerId: string, account: CreateAccountDto): string {
    const currentAccountType = this.getAccountType(account.accountTypeId);
    const currentCustomer = this.customerRepository.findOneById(customerId);
    const newAccount = new AccountEntity();
    newAccount.accountType = currentAccountType;
    newAccount.customer = currentCustomer;
    newAccount.balance = 0;
    this.accountRepository.register(newAccount);
    const result = {
      id: newAccount.id,
      customerId: newAccount.customer.id,
      accountType: {
        id: newAccount.accountType.id,
        name: newAccount.accountType.name,
      },
      balance: newAccount.balance,
    };
    return JSON.stringify(result);
  }

  getAccountsByCustomer(customerId: string): AccountEntity[] {
    return this.accountRepository.findByCustomer(customerId);
  }
  //Consultar solo cuentas activas
  private getOneActiveState(accountId: string): AccountEntity {
    if (!this.getState(accountId)) {
      throw new ConflictException('Cuenta inactiva');
    }
    const currentAccount = this.accountRepository.findOneById(accountId);
    return currentAccount;
  }

  //Obtención del balance por cuenta
  getBalance(accountId: string): number {
    const currentAccount = this.getOneActiveState(accountId);
    return currentAccount.balance;
  }

  //Agrega balance a la cuenta -- actualiza el balance
  addBalance(accountId: string, amount: number): void {
    const currentAccount = this.getOneActiveState(accountId);
    currentAccount.balance += amount;
    this.accountRepository.upate(accountId, currentAccount);
  }

  //Remueve o elimina balance de la cuenta -- resta valor a la cuenta
  removeBalance(accountId: string, amount: number): void {
    const currentAccount = this.getOneActiveState(accountId);
    if (this.verifyAmountToRemoveBalance(accountId, amount)) {
      throw new ConflictException('Saldo insuficiente');
    }
    currentAccount.balance -= amount;
    this.accountRepository.upate(accountId, currentAccount);
  }

  //Validar la disponibilidad del monto a retirar o a reducir
  verifyAmountToRemoveBalance(accountId: string, amount: number): boolean {
    return this.getBalance(accountId) < amount;
  }

  //Obtener el estado de una cuenta
  getState(accountId: string): boolean {
    const currentAccount = this.accountRepository.findOneById(accountId);
    return currentAccount.state;
  }

  //Actualiza o cambia el estado de una cuenta
  changeState(customerId: string, accountId: string, newState: boolean): void {
    const currentAccount = this.accountRepository.findOneById(accountId);
    if (currentAccount.customer.id !== customerId) {
      throw new UnauthorizedException(
        'La cuenta no existe o el no le pertenece al cliente',
      );
    }
    if (this.accountRepository.findOneById(accountId).balance != 0) {
      throw new ConflictException('No se puede inactivar una cuenta con saldo');
    }
    currentAccount.state = newState;
    this.accountRepository.upate(accountId, currentAccount);
  }

  //Obtiene el tipo de cuenta de la cuenta informada
  getAccountType(accountTypeId: string): AccountTypeEntity {
    return this.accountTypeRepository.findOneById(accountTypeId);
  }

  //Cambiar el tipo de cuenta
  changeAccountType(accountId: string, accountTypeId: string): AccountEntity {
    const currentAccount = this.accountRepository.findOneById(accountId);
    const currentAccountType =
      this.accountTypeRepository.findOneById(accountTypeId);
    currentAccount.accountType = currentAccountType;
    return this.accountRepository.upate(accountId, currentAccount);
  }

  //Eliminar una cuenta
  deleteAccount(customerId: string, accountId: string): string {
    const currentAccount = this.accountRepository.findOneById(accountId);
    if (currentAccount.customer.id !== customerId) {
      throw new UnauthorizedException(
        'Cuenta a eliminar no exite o no pertenece al Cliente',
      );
    }
    const balance = currentAccount.balance;
    if (balance === 0) {
      const currentDeposits = this.depositRepository.findByAccountId(accountId);
      currentDeposits.forEach((d) => this.depositRepository.delete(d.id, true));
      const currentTransfersIncome =
        this.transferRepository.findByIncomeAccount(accountId);
      const currentTransfersOutcome =
        this.transferRepository.findByOutcomeAccount(accountId);
      const totalTransfers = {
        ...currentTransfersIncome,
        ...currentTransfersOutcome,
      };
      if (totalTransfers.length > 0) {
        for (const transfer of totalTransfers) {
          this.transferRepository.delete(transfer.id, true);
        }
      }
      this.accountRepository.delete(accountId, true);
      const totalAccounts = this.accountRepository.findByCustomer(
        currentAccount.customer.id,
      ).length;
      if (totalAccounts === 0)
        this.customerRepository.delete(currentAccount.customer.id);
    } else {
      throw new ConflictException(
        `No se puede eliminar la cuenta con el id ${accountId} ya que tiene saldo!`,
      );
    }
    return JSON.stringify(true);
  }

  private historyPagination(
    accountsList: AccountEntity[],
    pagination: PaginationModel,
  ): {
    currentPage: number;
    totalPages: number;
    range: number;
    size: number;
    accounts: AccountEntity[];
  } {
    accountsList = accountsList.reverse();
    const size = accountsList.length;
    const currentPage = pagination?.currentPage ?? 1;
    const range = pagination?.range ?? 10;
    const totalPages = Math.ceil(size / range);
    const accounts: AccountEntity[] = [];
    const start = currentPage * range - range;
    const end = start + range;
    for (let i = start; i < end; i++) {
      accountsList[i] ? accounts.push(accountsList[i]) : (i = end);
    }
    return { currentPage, totalPages, range, size, accounts };
  }

  private formatAccounts(accounts: AccountEntity[]): {
    id: string;
    customerId: string;
    accountType: { id: string; name: string };
    balance: number;
  }[] {
    const newAccounts: {
      id: string;
      customerId: string;
      accountType: { id: string; name: string };
      balance: number;
    }[] = [];

    for (const a of accounts) {
      newAccounts.push({
        id: a.id,
        customerId: a.customer.id,
        accountType: { id: a.accountType.id, name: a.accountType.name },
        balance: a.balance,
      });
    }
    return newAccounts;
  }
}
