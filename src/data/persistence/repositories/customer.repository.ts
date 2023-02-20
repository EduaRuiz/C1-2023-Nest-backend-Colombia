import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomerEntity } from '../entities';
import { BaseRepository } from './base';
import { CustomerRepositoryInterface } from './interfaces';

@Injectable()
export class CustomerRepository
  extends BaseRepository<CustomerEntity>
  implements CustomerRepositoryInterface
{
  findOneByFirebase(firebaseId: string, firebaseEmail: string): CustomerEntity {
    const currentCustomer = this.findAll().find(
      (c) =>
        c.firebaseId === firebaseId ||
        c.email.toLowerCase() === firebaseEmail.toLowerCase(),
    );
    if (currentCustomer) return currentCustomer;

    throw new NotFoundException('Usuario no existe en la base de datos');
  }
  findOneByEmailAndPassword(email: string, password: string): boolean {
    const currentCustomer = this.findAll().find(
      (c) =>
        c.email.toLowerCase() === email.toLowerCase() &&
        c.password === password,
    );
    if (currentCustomer) return true;
    return false;
  }

  findOneByDocumentTypeAndDocument(
    documentTypeId: string,
    document: string,
  ): CustomerEntity {
    const currentCustomer = this.findAll().find(
      (c) => c.documentType.id === documentTypeId && c.document === document,
    );
    if (currentCustomer) return currentCustomer;
    throw new NotFoundException(
      `No existe cliente con el numero de documento: ${document}`,
    );
  }

  findOneByEmail(email: string): CustomerEntity {
    const currentCustomer = this.findAll().find(
      (c) => c.email?.toLowerCase() === email?.toLowerCase(),
    );
    if (currentCustomer) return currentCustomer;
    throw new NotFoundException(`No existe cliente con el email: ${email}`);
  }

  findOneByPhone(phone: string): CustomerEntity {
    const currentCustomer = this.findAll().find(
      (c) => c.phone.toLowerCase() === phone.toLowerCase(),
    );
    if (currentCustomer) return currentCustomer;
    throw new NotFoundException(
      `No existe cliente con el número de teléfono: ${phone}`,
    );
  }

  findByState(state: boolean): CustomerEntity[] {
    const currentCustomers = this.findAll().filter((c) => c.state === state);
    return currentCustomers;
  }

  findByFullName(fullName: string): CustomerEntity[] {
    const currentCustomers = this.findAll().filter(
      (c) => c.fullName.toLowerCase().indexOf(fullName.toLowerCase()) !== -1,
    );
    return currentCustomers;
  }

  register(entity: CustomerEntity): CustomerEntity {
    const currentCustomers = this.findAll().find(
      (c) =>
        c.email.toLowerCase() === entity.email.toLowerCase() ||
        c.document.toLowerCase() === entity.document.toLocaleLowerCase(),
    );
    if (currentCustomers) {
      throw new ConflictException(
        'Correo y/o documento ya registrado en el sistema.',
      );
    }
    this.database.push(entity);
    return this.database.at(-1) ?? entity;
  }

  upate(id: string, entity: CustomerEntity): CustomerEntity {
    const currentCustomer = this.findOneById(id);
    if (JSON.stringify(currentCustomer) === JSON.stringify(entity)) {
      throw new ConflictException(
        'Los datos del cliente a actualizar ya existen',
      );
    }
    const index = this.database.findIndex((c) => c.id === id);
    this.database[index] = {
      ...currentCustomer,
      ...entity,
      id: id,
    };
    return this.database[index];
  }

  delete(id: string, soft?: boolean): void {
    this.findOneById(id);
    const index = this.database.findIndex((c) => c.id === id);
    if (soft) this.softDelete(index);
    else this.hardDelete(index);
  }

  private hardDelete(index: number): void {
    this.database.splice(index, 1);
  }

  private softDelete(index: number): void {
    const currentCustomer = this.database[index];
    currentCustomer.deletedAt = Date.now();
    this.database[index] = {
      ...currentCustomer,
    };
  }

  findAll(): CustomerEntity[] {
    return this.database.filter((c) => c.deletedAt === undefined);
  }

  findOneById(id: string): CustomerEntity {
    const currentCustomer = this.findAll().find((c) => c.id === id);
    if (currentCustomer) return Object.assign({}, currentCustomer);
    throw new NotFoundException(
      `El cliente con el Id ${id} no existe en la base de datos`,
    );
  }
}
