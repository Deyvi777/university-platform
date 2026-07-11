import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  EnrollmentRequestStatus,
  NotificationType,
  Role,
} from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateEnrollmentRequestDto } from './dto/enrollment-request.dto';

/** Buzón por defecto si la fila de configuración aún no existe. Debe coincidir
 * con el `@default` de `SiteSettings.enrollmentNotifyEmail` en el schema. */
const DEFAULT_NOTIFY_EMAIL = 'certificatebolivia@gmail.com';

@Injectable()
export class EnrollmentRequestsService {
  private readonly logger = new Logger(EnrollmentRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  // ---- Público (landing) ----

  async create(dto: CreateEnrollmentRequestDto) {
    const request = await this.prisma.enrollmentRequest.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        idDocument: dto.idDocument,
        issuedIn: dto.issuedIn,
        gender: dto.gender,
        originUniversity: dto.originUniversity,
        profession: dto.profession,
        programTitle: dto.programTitle,
        programSlug: dto.programSlug ?? null,
      },
    });
    await this.notifyAdmins(request);
    await this.emailNotice(request);
    // No se expone el registro creado: el endpoint es público.
    return { success: true };
  }

  /** Encola el aviso por correo al buzón configurado en `SiteSettings`
   * (editable desde /dashboard/solicitudes). Nunca lanza. */
  private async emailNotice(request: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idDocument: string;
    issuedIn: string;
    gender: string;
    originUniversity: string;
    profession: string;
    programTitle: string;
  }) {
    try {
      const settings = await this.prisma.siteSettings.findUnique({
        where: { id: 'singleton' },
        select: { enrollmentNotifyEmail: true },
      });
      const to = settings?.enrollmentNotifyEmail ?? DEFAULT_NOTIFY_EMAIL;
      await this.mail.enqueueEnrollmentNotice({
        to,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phone: request.phone,
        idDocument: request.idDocument,
        issuedIn: request.issuedIn,
        gender: request.gender,
        originUniversity: request.originUniversity,
        profession: request.profession,
        programTitle: request.programTitle,
      });
    } catch (e) {
      this.logger.error(
        `No se pudo encolar el aviso por correo de la solicitud de ${request.email}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  /** Avisa a todos los ADMIN activos (campana en vivo vía WebSocket). Nunca
   * lanza: un fallo al notificar no debe rechazar el formulario público. */
  private async notifyAdmins(request: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    programTitle: string;
  }) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true },
      });
      if (admins.length === 0) return;
      const fullName = `${request.lastName} ${request.firstName}`;
      // Sin transacción: `createMany` empuja cada aviso por WebSocket al vuelo.
      await this.notifications.createMany(
        admins.map(({ id }) => ({
          userId: id,
          type: NotificationType.ENROLLMENT_REQUEST,
          title: 'Nueva solicitud de inscripción',
          body:
            `**${fullName}** envió una solicitud de inscripción al programa ` +
            `**${request.programTitle}** (${request.email}, tel. ${request.phone}). ` +
            'Revísala en la sección Solicitudes de inscripción.',
          data: {
            enrollmentRequest: true,
            requestId: request.id,
          },
        })),
      );
    } catch (e) {
      this.logger.error(
        `No se pudo notificar la solicitud de inscripción de ${request.email}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  // ---- Admin ----

  findAllAdmin() {
    return this.prisma.enrollmentRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Convierte la solicitud en una cuenta STUDENT reutilizando el alta normal
   * de usuarios: contraseña autogenerada (inicialApellidoNombre + documento) y
   * correo de credenciales encolado. Un correo/documento ya registrado
   * devuelve 409 desde `UsersService.create`.
   */
  async enroll(id: string) {
    const request = await this.prisma.enrollmentRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    if (request.status === EnrollmentRequestStatus.ENROLLED) {
      throw new ConflictException('La solicitud ya fue inscrita');
    }

    const user = await this.users.create({
      firstName: request.firstName,
      lastName: request.lastName,
      email: request.email,
      phone: request.phone,
      idDocument: request.idDocument,
      issuedIn: request.issuedIn,
      gender: request.gender,
      originUniversity: request.originUniversity,
      profession: request.profession,
      role: Role.STUDENT,
      isActive: true,
    });

    await this.prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: EnrollmentRequestStatus.ENROLLED,
        enrolledUserId: user.id,
      },
    });

    return user;
  }

  async remove(id: string) {
    const request = await this.prisma.enrollmentRequest.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }
    await this.prisma.enrollmentRequest.delete({ where: { id } });
    return { success: true };
  }
}
