import { IsString } from 'class-validator';

export class FireBaseDto {
  @IsString()
  token: string;
}
