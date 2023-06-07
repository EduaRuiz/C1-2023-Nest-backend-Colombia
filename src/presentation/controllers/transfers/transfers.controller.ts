import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  CreateTransferDto,
  DateRangeDto,
  PaginationDto,
} from 'src/business/dtos';
import { DateRangeModel, PaginationModel } from 'src/data/models';
import { TransferService } from 'src/business/services';
import { Auth, GetCustomer } from 'src/common/decorators';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transferService: TransferService) {}

  @Post('all')
  @Auth()
  getAll(
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
    @Body('pagination') pagination: PaginationDto,
    @Body('dateRange') dateRange?: DateRangeDto,
  ): JSON {
    return JSON.parse(
      this.transferService.getAllByCustomer(
        customerId,
        <PaginationModel>pagination,
        <DateRangeModel>dateRange,
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
      this.transferService.getHistory(
        accountId,
        <PaginationModel>pagination,
        <DateRangeModel>dateRange,
      ),
    );
  }

  @Post('income/:id')
  @Auth()
  getByIncomeAccount(
    @Param('id', ParseUUIDPipe) accountId: string,
    @Body('pagination') pagination: PaginationDto,
    @Body('dateRange') dateRange?: DateRangeDto,
  ): JSON {
    return JSON.parse(
      this.transferService.getHistoryIn(
        accountId,
        <PaginationModel>pagination,
        <DateRangeModel>dateRange,
      ),
    );
  }

  @Post('outcome/:id')
  @Auth()
  getByOutcomeAccount(
    @Param('id', ParseUUIDPipe) accountId: string,
    @Body('pagination') pagination: PaginationDto,
    @Body('dateRange') dateRange?: DateRangeDto,
  ): JSON {
    return JSON.parse(
      this.transferService.getHistoryOut(
        accountId,
        <PaginationModel>pagination,
        <DateRangeModel>dateRange,
      ),
    );
  }

  @Post('add')
  @Auth()
  createTransfer(
    @Body() createTransferDto: CreateTransferDto,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): JSON {
    return JSON.parse(
      this.transferService.createTransfer(customerId, createTransferDto),
    );
  }

  @Delete(':id')
  @Auth()
  deleteTransfer(
    @Param('id', ParseUUIDPipe) transferId: string,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
  ): boolean {
    this.transferService.deleteTransfer(customerId, transferId);
    return true;
  }

  @Post('negative/:id')
  @Auth()
  getNegative(
    @Param('id') accountId: string,
    @GetCustomer('id', ParseUUIDPipe) customerId: string,
    @Body('pagination') pagination: PaginationDto,
    @Body('dateRange') dateRange?: DateRangeDto,
  ): JSON {
    return JSON.parse(
      this.transferService.getNegative(
        accountId,
        <PaginationModel>pagination,
        <DateRangeModel>dateRange,
      ),
    );
  }
}
