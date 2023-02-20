// Libraries
import {
  Body,
  Controller,
  Get,
  Headers,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { CreateCustomerDto, SecurityDto } from 'src/business/dtos';
import { CustomerService, SecurityService } from 'src/business/services';
import { Auth, GetCustomer } from 'src/common/decorators';
import { UpdateCustomerDto } from '../../../business/dtos/customer/update-customer.dto';

@Controller('security')
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly customerService: CustomerService,
  ) {}

  @Post('signup')
  registerUser(@Body() createCustomerDto: CreateCustomerDto): JSON {
    return JSON.parse(this.securityService.signUp(createCustomerDto));
  }

  @Post('signin')
  signIn(@Body() securityDto: SecurityDto): JSON {
    return JSON.parse(this.securityService.signIn(securityDto));
  }

  @Post('signout')
  signOut(@Headers('Authorization') token: string): string {
    this.securityService.signOut(token);
    return 'OK';
  }

  @Post('signin/google')
  async signInGoogle(@Body('token') token: string): Promise<string> {
    return await this.securityService.signInGoogle(token);
  }

  @Get('refresh')
  @Auth()
  getUserInfo(
    @Headers('Authorization') token: string,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): string {
    return JSON.parse(this.securityService.refreshToken(customerId, token));
  }

  @Get('user')
  @Auth()
  validate(
    @Headers('Authorization') token: string,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): JSON {
    return JSON.parse(this.securityService.getUserInfo(customerId, token));
  }

  @Put('update')
  @Auth()
  updateUser(
    @Headers('Authorization') token: string,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
    @Body('user') user: UpdateCustomerDto,
  ): JSON {
    return JSON.parse(this.securityService.updateUser(customerId, user));
  }
}
