import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: await argon2.hash(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        idDocument: dto.idDocument ?? null,
      },
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Credenciales correctas pero cuenta desactivada: respondemos 403 (distinto
    // de 401) para que el frontend muestre el mensaje de "cuenta suspendida".
    // El check va DESPUÉS de validar la contraseña para no revelar a terceros
    // qué correos existen o están suspendidos.
    if (!user.isActive) {
      throw new ForbiddenException('Account suspended');
    }
    return this.buildAuthResponse(user, dto.remember);
  }

  private buildAuthResponse(user: User, remember = false) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    // Con "Recordarme" el token vive más (JWT_REMEMBER_EXPIRES_IN); si no, usa
    // el TTL por defecto del JwtModule (JWT_EXPIRES_IN). El frontend lee el `exp`
    // del token para alinear la duración de la sesión de NextAuth.
    const signOptions: JwtSignOptions | undefined = remember
      ? ({
          expiresIn: this.config.get<string>('JWT_REMEMBER_EXPIRES_IN', '30d'),
        } as JwtSignOptions)
      : undefined;
    return {
      accessToken: this.jwtService.sign(payload, signOptions),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
