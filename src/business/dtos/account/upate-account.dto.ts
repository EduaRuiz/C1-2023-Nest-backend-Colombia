import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @IsUUID()
  readonly id?: string;
  @IsOptional()
  @IsString()
  @IsUUID()
  readonly customerId?: string;
  @IsOptional()
  @IsString()
  @IsUUID()
  readonly accountTypeId?: string;
  @IsBoolean()
  readonly state: boolean;
}
