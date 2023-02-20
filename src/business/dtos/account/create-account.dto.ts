import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAccountDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  readonly customerId?: string;
  @IsString()
  @IsUUID()
  readonly accountTypeId: string;
}
