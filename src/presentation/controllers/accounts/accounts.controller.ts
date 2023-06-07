import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateAccountDto,
  PaginationDto,
  UpdateAccountDto,
} from 'src/business/dtos';
import { AccountService } from 'src/business/services';
import { Auth, GetCustomer } from 'src/common/decorators';
import { PaginationModel } from 'src/data/models';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountService: AccountService) {}

  @Post('all')
  @Auth()
  getAllAccounts(
    @Body() pagination: PaginationDto,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): JSON {
    return JSON.parse(
      this.accountService.getAllByCustomer(
        customerId,
        <PaginationModel>pagination,
      ),
    );
  }

  @Get('ownaccount/balance')
  @Auth()
  getTotalBalanceAllAccounts(
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): number {
    return this.accountService.getTotalBalanceAllAccountsCustomerId(customerId);
  }

  @Get('ownaccount/:id')
  @Auth()
  getAccountById(
    @Param('id', ParseUUIDPipe) accountId: string,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): JSON {
    return JSON.parse(
      JSON.stringify(this.accountService.getAccountById(customerId, accountId)),
    );
  }

  @Get('exist/:id')
  @Auth()
  exist(@Param('id') accountId: string): boolean {
    return this.accountService.exist(accountId);
  }

  @Post('add')
  @Auth()
  createAccount(
    @Body() accountDto: CreateAccountDto,
    @GetCustomer('id') customerId: string,
  ): JSON {
    return JSON.parse(
      this.accountService.createAccount(customerId, accountDto),
    );
  }

  @Delete(':id')
  @Auth()
  deleteAccount(
    @Param('id', ParseUUIDPipe) accountId: string,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): JSON {
    return JSON.parse(this.accountService.deleteAccount(customerId, accountId));
  }

  @Patch(':id')
  changeState(
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
    @Param('id', ParseUUIDPipe) accountId: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ): JSON {
    this.accountService.changeState(
      customerId,
      accountId,
      updateAccountDto.state,
    );
    return JSON.parse(JSON.stringify(true));
  }
}
