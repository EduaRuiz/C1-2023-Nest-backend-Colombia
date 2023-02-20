import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountTypeEntity } from '../entities';
import { BaseRepository } from './base';
import { AccountTypeRepositoryInterface } from './interfaces';

@Injectable()
export class AccountTypeRepository
  extends BaseRepository<AccountTypeEntity>
  implements AccountTypeRepositoryInterface
{
  findByState(state: boolean): AccountTypeEntity[] {
    const currentAccountTypes = this.database.filter((a) => a.state === state);
    return currentAccountTypes;
  }

  findByName(name: string): AccountTypeEntity[] {
    const currentAccountTypes = this.database.filter(
      (n) => n.name.toLowerCase().indexOf(name.toLowerCase()) !== -1,
    );
    return currentAccountTypes;
  }

  register(entity: AccountTypeEntity): AccountTypeEntity {
    const currentAccountType = this.database.find((a) => a.id === entity.id);
    if (currentAccountType) {
      throw new ConflictException(
        'El tipo de cuenta que intenta registrar ya existe en la base de datos',
      );
    }
    this.database.push(entity);
    return this.database.at(-1) ?? entity;
  }

  upate(id: string, entity: AccountTypeEntity): AccountTypeEntity {
    const accountType = this.findOneById(id);
    if (JSON.stringify(accountType) === JSON.stringify(entity)) {
      throw new ConflictException(
        'Los datos del tipo de cuenta a actualizar ya existen',
      );
    }
    const index = this.database.findIndex((a) => a.id === id);
    this.database[index] = {
      ...accountType,
      ...entity,
      id: id,
    };
    return this.database[index];
  }

  delete(id: string, soft?: boolean): void {
    this.findOneById(id);
    if (soft) {
      throw new BadRequestException(
        'El borrado lógico no está implementado para tipos de cuentas',
      );
    }
    const index = this.database.findIndex((a) => a.id === id);
    this.database.splice(index, 1);
  }

  findAll(): AccountTypeEntity[] {
    return this.database;
  }

  findOneById(id: string): AccountTypeEntity {
    const hardAccountTypeDataBase = [
      {
        id: '4edf3a27-98ef-43ac-b1b9-21976ae00183',
        name: 'Saving account',
        state: true,
      },
      {
        id: 'e51651e8-a085-4ed3-9cf1-49a444fe667b',
        name: 'Checking account',
        state: true,
      },
    ];
    const currentAccountType = hardAccountTypeDataBase.find((a) => a.id === id);
    if (currentAccountType) return currentAccountType;
    throw new NotFoundException(
      `El tipo de cuenta con el Id ${id} no existe en la base de datos`,
    );
  }
}
