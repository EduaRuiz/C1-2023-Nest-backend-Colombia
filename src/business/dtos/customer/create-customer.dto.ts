import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsUUID()
  readonly documentTypeId: string;
  @IsNotEmpty()
  @IsNumberString()
  @MinLength(6)
  @MaxLength(12)
  readonly document: string;
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  readonly fullName: string;
  @IsString()
  //@IsEmail()
  @Matches(
    new RegExp(
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g,
    ),
  )
  readonly email: string;
  @IsNumberString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(10)
  readonly phone: string;
  @IsString()
  @IsNotEmpty()
  @Matches(
    new RegExp(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
    ),
  )
  @MinLength(8)
  readonly password: string;
  @IsOptional()
  @IsUrl()
  readonly avatarUrl?: string;
}
