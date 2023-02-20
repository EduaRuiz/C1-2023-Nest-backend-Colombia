import { CustomerEntity } from 'src/data/persistence/entities';
import { BaseRepositoryInterface } from './base';

export interface CustomerRepositoryInterface
  extends BaseRepositoryInterface<CustomerEntity> {
  findOneByEmailAndPassword(email: string, password: string): boolean;
  findOneByDocumentTypeAndDocument(
    documentTypeId: string,
    document: string,
  ): CustomerEntity;
  findOneByEmail(email: string): CustomerEntity;
  findOneByPhone(phone: string): CustomerEntity;
  findByState(state: boolean): Array<CustomerEntity>;
  findByFullName(fullName: string): Array<CustomerEntity>;
  findOneByFirebase(firebaseId: string, firebaseEmail: string): CustomerEntity;
}
