import { DocumentTypeEntity } from 'src/data/persistence/entities';
import { BaseRepositoryInterface } from './base';

export interface DocumentTypeRepositoryInterface
  extends BaseRepositoryInterface<DocumentTypeEntity> {
  findByState(state: boolean): Array<DocumentTypeEntity>;
  findByName(name: string): Array<DocumentTypeEntity>;
}
