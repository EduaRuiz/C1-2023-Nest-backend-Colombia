import { Injectable } from '@nestjs/common';
import { UpdateCustomerDto } from 'src/business/dtos';
import { PaginationModel } from 'src/data';
import { CustomerEntity } from 'src/data/persistence/entities';
import { CustomerRepository } from 'src/data/persistence/repositories';
import { AccountService } from '../account';
import { UnauthorizedException } from '@nestjs/common/exceptions';

@Injectable()
export class CustomerService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly accountService: AccountService,
  ) {}

  //Retorna todos los clientes
  getAll(paginationModel: PaginationModel): CustomerEntity[] {
    const customers = this.customerRepository.findAll();
    return this.historyPagination(customers, paginationModel);
  }

  //Retorna la informacion del cliente solicitado
  getCustomerInfo(customerId: string): CustomerEntity {
    const currentCustomer = this.customerRepository.findOneById(customerId);
    return currentCustomer;
  }

  //Actualiza informacion del ususario solicitado
  updateCustomer(
    currentCustomerId: string,
    customerId: string,
    customer: UpdateCustomerDto,
  ): CustomerEntity {
    if (currentCustomerId !== customerId) {
      throw new UnauthorizedException(
        'El usuario a eliminar no existe o es el mismo cliente',
      );
    }
    const currentCustomer = this.customerRepository.findOneById(customerId);
    let updatedCustomer = new CustomerEntity();
    updatedCustomer = {
      ...currentCustomer,
      ...customer,
      id: customerId,
    };
    return this.customerRepository.upate(customerId, updatedCustomer);
  }

  //Elimina el usuario solicitado de forma logica
  unsubscribe(currentCustomerId: string, customerId: string): boolean {
    if (currentCustomerId !== customerId) {
      throw new UnauthorizedException(
        'El usuario a eliminar no existe o no es el mismo cliente',
      );
    }
    const currentAccounts =
      this.accountService.getAccountsByCustomer(customerId);
    currentAccounts.forEach((a) =>
      this.accountService.deleteAccount(customerId, a.id),
    );
    return true;
  }

  //Cambiar estado de Cliente si está inactivo lo activa o viceversa
  changeState(customerId: string): boolean {
    const currentCustomer = this.getCustomerInfo(customerId);
    currentCustomer.state = !currentCustomer.state;
    const updatedCustomer = this.customerRepository.upate(
      customerId,
      currentCustomer,
    );
    if (updatedCustomer) return true;
    return false;
  }

  private historyPagination(
    customersList: CustomerEntity[],
    pagination: PaginationModel,
  ): CustomerEntity[] {
    const currentPage = pagination?.currentPage ?? 1;
    const range = pagination?.range ?? 10;
    const customers: CustomerEntity[] = [];
    const start = currentPage * range - range;
    const end = start + range;
    for (let i = start; i < end; i++) {
      customersList[i] ? customers.push(customersList[i]) : (i = end);
    }
    return customers;
  }
}
