//Libraries
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './business/services/security/jwt.strategy';
import { GoogleStrategy } from './business/services/security/google.strategy';
import { TransactionService } from './business/services/transaction/transaction.service';
//Controllers
import {
  AccountsController,
  DepositsController,
  SecurityController,
  TransfersController,
  UsersController,
  TransactionsController,
} from './presentation/controllers';
//Services
import {
  TransferService,
  CustomerService,
  DepositService,
  SecurityService,
  AccountService,
  jwtConstants,
  // jwtConstants,
} from './business/services';
//Repositories
import {
  AccountRepository,
  AccountTypeRepository,
  CustomerRepository,
  DepositRepository,
  DocumentTypeRepository,
  TransferRepository,
} from './data/persistence/repositories';

@Module({
  controllers: [
    SecurityController,
    UsersController,
    AccountsController,
    TransfersController,
    DepositsController,
    TransactionsController,
  ],
  providers: [
    AccountService,
    CustomerService,
    DepositService,
    TransferService,
    SecurityService,
    TransactionService,
    AccountRepository,
    AccountTypeRepository,
    TransferRepository,
    DepositRepository,
    CustomerRepository,
    DocumentTypeRepository,
    JwtStrategy,
    GoogleStrategy,
  ],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.JTW_SECRET,
      signOptions: { expiresIn: '10m' },
    }),
  ],
  exports: [
    AccountService,
    CustomerService,
    DepositService,
    TransferService,
    SecurityService,
    TransactionService,
    AccountRepository,
    AccountTypeRepository,
    TransferRepository,
    DepositRepository,
    CustomerRepository,
    DocumentTypeRepository,
    PassportModule,
    JwtModule,
    JwtStrategy,
    GoogleStrategy,
  ],
})
export class AppModule {}
