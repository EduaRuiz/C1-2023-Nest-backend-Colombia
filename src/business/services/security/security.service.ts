import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateAccountDto,
  CreateCustomerDto,
  SecurityDto,
  UpdateCustomerDto,
} from 'src/business/dtos';
import { CustomerEntity } from 'src/data/persistence/entities';
import {
  CustomerRepository,
  DocumentTypeRepository,
} from 'src/data/persistence/repositories';
import { AccountService } from 'src/business/services';
import { hashSync, compareSync } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { GoogleStrategy } from './google.strategy';

@Injectable()
export class SecurityService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly documentTypeRepository: DocumentTypeRepository,
    private readonly accountService: AccountService,
    private readonly jwtService: JwtService,
    private readonly google: GoogleStrategy,
  ) {}

  //Logueo en el sistema
  signIn(securityDto: SecurityDto): string {
    let customer = new CustomerEntity();
    try {
      customer = this.customerRepository.findOneByEmail(securityDto.email);
    } catch (error) {
      throw new UnauthorizedException('Datos de identificación inválidos');
    }
    if (!customer.state) throw new UnauthorizedException('Usuario inactivo');
    if (customer)
      if (compareSync(securityDto.password, customer.password)) {
        return this.formatUser(customer);
      }
    throw new UnauthorizedException('Datos de identificación inválidos');
  }

  async signInGoogle(token: string): Promise<string> {
    return this.google
      .verify2(token)
      .then((decodedToken) => {
        const customer = this.customerRepository.findOneByFirebase(
          decodedToken.uid,
          decodedToken.email ?? '',
        );
        return this.formatUser(customer);
      })
      .catch((err) => {
        if (err.status === 404) {
          return this.signUpGoogle(token);
        }
        throw new UnauthorizedException(err);
      });
  }

  async signUpGoogle(token: string): Promise<string> {
    return this.google
      .verify2(token)
      .then((decodedToken) => {
        const currentDocumentType = this.documentTypeRepository.findOneById(
          'e07aeb4c-3765-46cd-b8e2-944a928dd497',
        );
        const newCustomer = new CustomerEntity();
        newCustomer.documentType = currentDocumentType;
        newCustomer.firebaseId = decodedToken.uid;
        newCustomer.document = Math.floor(Math.random() * 9999999999) + '';
        newCustomer.fullName = decodedToken?.name;
        newCustomer.email = decodedToken.email ?? 'generic@email.com';
        newCustomer.phone = decodedToken.phone_number ?? '1111111111';
        newCustomer.password = hashSync('fhu9ssuh9fhu9sd***AA', 10);
        newCustomer.state = true;
        newCustomer.avatarUrl =
          decodedToken.picture ??
          'https://cdn-icons-png.flaticon.com/512/1946/1946429.png';
        const customer = this.customerRepository.register(newCustomer);
        if (customer) {
          const newAccountDto = <CreateAccountDto>{
            accountTypeId: '4edf3a27-98ef-43ac-b1b9-21976ae00183',
            customerId: customer.id,
          };
          this.accountService.createAccount(customer.id, newAccountDto);
          return this.formatUser(customer);
        }
        throw new InternalServerErrorException('Error al registrar cliente');
      })
      .catch((error) => {
        console.log(error);
        throw new InternalServerErrorException('Error al registrar cliente');
      });
  }

  //Creacion de una cuenta de ciente con su cuenta bancaria
  signUp(user: CreateCustomerDto): string {
    const { password } = user;
    const currentDocumentType = this.documentTypeRepository.findOneById(
      user.documentTypeId,
    );
    const newCustomer = new CustomerEntity();
    newCustomer.documentType = currentDocumentType;
    newCustomer.document = user.document;
    newCustomer.fullName = user.fullName;
    newCustomer.email = user.email;
    newCustomer.phone = user.phone;
    newCustomer.password = hashSync(password, 10);
    newCustomer.avatarUrl =
      user.avatarUrl ??
      'https://cdn-icons-png.flaticon.com/512/1946/1946429.png';
    const customer = this.customerRepository.register(newCustomer);
    if (customer) {
      const newAccountDto = <CreateAccountDto>{
        accountTypeId: '4edf3a27-98ef-43ac-b1b9-21976ae00183',
        customerId: customer.id,
      };
      this.accountService.createAccount(customer.id, newAccountDto);
      return this.formatUser(customer);
    }
    throw new InternalServerErrorException('Error al registrar cliente');
  }

  //Cierre de sesión
  signOut(jwtToken: string): void {
    jwtToken = jwtToken.replace('Bearer ', '');
    try {
      this.jwtService.verify(jwtToken);
    } catch (e) {
      throw new UnauthorizedException(`Error token invalido`);
    }
  }

  getUserInfo(customerId: string, jwtToken: string): string {
    jwtToken = jwtToken.replace('Bearer ', '');
    try {
      this.jwtService.verify(jwtToken);
    } catch (e) {
      throw new UnauthorizedException(`Error token invalido`);
    }
    const user = this.customerRepository.findOneById(customerId);
    return JSON.stringify({
      id: user.id,
      fullName: user.fullName,
      documentTypeId: user.documentType.id,
      document: user.document,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    });
  }

  refreshToken(customerId: string, jwtToken: string): string {
    const customer = this.customerRepository.findOneById(customerId);
    jwtToken = jwtToken.replace('Bearer ', '');
    try {
      this.jwtService.verify(jwtToken);
    } catch (e) {
      throw new UnauthorizedException(`Error token invalido`);
    }
    return this.formatUser(customer);
  }

  private jwt(payload: string): string {
    return this.jwtService.sign({ id: payload });
  }

  updateUser(customerId: string, customer: UpdateCustomerDto): string {
    const currentCustomer = this.customerRepository.findOneById(customerId);
    let password = '';
    if (customer.password) {
      password = hashSync(customer?.password, 10);
    } else {
      password = currentCustomer.password;
    }
    let updatedCustomer = new CustomerEntity();
    updatedCustomer = {
      ...currentCustomer,
      ...customer,
      password: password,
      id: customerId,
      state: true,
    };
    const updatedUser = this.formatUser(
      this.customerRepository.upate(customerId, updatedCustomer),
    );
    return updatedUser;
  }

  private formatUser(customer: CustomerEntity): string {
    return JSON.stringify({
      success: true,
      user: {
        id: customer.id,
        fullName: customer.fullName,
        documentTypeId: customer.documentType.id,
        document: customer.document,
        email: customer.email,
        phone: customer.phone,
        avatarUrl: customer.avatarUrl,
      },
      token: this.jwt(customer.id),
    });
  }
}
