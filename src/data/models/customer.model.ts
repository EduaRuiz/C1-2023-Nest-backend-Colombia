import { DocumentTypeModel } from './';

export interface CustomerModel {
  id: string;
  firebaseId?: string;
  documentType: DocumentTypeModel;
  document: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  avatarUrl?: string;
  state: boolean;
  deletedAt?: Date | number;
}
