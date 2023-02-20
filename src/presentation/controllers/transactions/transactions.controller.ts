import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { DateRangeDto, PaginationDto } from 'src/business/dtos';
import { Auth, GetCustomer } from 'src/common/decorators';
import { DateRangeModel, PaginationModel } from 'src/data/models';
import { TransactionService } from '../../../business/services/transaction/transaction.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('all')
  @Auth()
  getAll(
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
    @Body('pagination') pagination: PaginationDto,
    @Body('dateRange') dateRange?: DateRangeDto,
  ): JSON {
    return JSON.parse(
      JSON.stringify(
        this.transactionService.getAllbyCustomer(
          customerId,
          <PaginationModel>pagination,
          <DateRangeModel>dateRange,
        ),
      ),
    );
  }

  @Post('all/:id')
  @Auth()
  getAllByAccount(
    @Param('id', ParseUUIDPipe) accountId: string,
    @Body('pagination') pagination: PaginationDto,
    @Body('dateRange') dateRange?: DateRangeDto,
  ): JSON {
    return JSON.parse(
      this.transactionService.getAllByAccount(
        accountId,
        <PaginationModel>pagination,
        <DateRangeModel>dateRange,
      ),
    );
  }
}
