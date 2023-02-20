import { v4 as uuid } from 'uuid';
import { DocumentTypeEntity } from './';
import { CustomerModel } from 'src/data/models';

export class CustomerEntity implements CustomerModel {
  id = uuid();
  firebaseId?: string;
  documentType: DocumentTypeEntity;
  document: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  avatarUrl?: string;
  state = true;
  deletedAt?: Date | number;
}
