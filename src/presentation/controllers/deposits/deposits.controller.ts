import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Delete,
} from '@nestjs/common';
import {
  CreateDepositDto,
  DateRangeDto,
  PaginationDto,
} from 'src/business/dtos';
import { DepositService } from 'src/business/services';
import { Auth, GetCustomer } from 'src/common/decorators';
import { DateRangeModel, PaginationModel } from 'src/data/models';

@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositService: DepositService) {}

  @Post('all')
  @Auth()
  getAll(
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
    @Body('pagination') pagination: PaginationDto,
    @Body('dateRange') dateRange?: DateRangeDto,
  ): JSON {
    return JSON.parse(
      JSON.stringify(
        this.depositService.getHistoryByCustomer(
          customerId,
          <PaginationModel>pagination,
          <DateRangeModel>dateRange,
        ),
      ),
    );
  }

  // Obtiene todas las transferencias por cuenta
  @Post('all/:id')
  @Auth()
  getAllByAccount(
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
    @Param('id', ParseUUIDPipe) accountId: string,
    @Body('pagination') pagination: PaginationDto,
    @Body('dateRange') dateRange?: DateRangeDto,
  ): JSON {
    return JSON.parse(
      this.depositService.getHistoryByAccount(
        customerId,
        accountId,
        <PaginationModel>pagination,
        <DateRangeModel>dateRange,
      ),
    );
  }

  @Post('add')
  @Auth()
  createDeposit(
    @Body() createDepositDto: CreateDepositDto,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): JSON {
    return JSON.parse(
      this.depositService.createDeposit(customerId, createDepositDto),
    );
  }

  @Delete(':id')
  @Auth()
  deleteDeposit(
    @Param('id', ParseUUIDPipe) depositId: string,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): JSON {
    return JSON.parse(this.depositService.deleteDeposit(customerId, depositId));
  }
}
