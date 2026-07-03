import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { bulkStudentRowSchema } from './dto/bulk-user.dto';

/**
 * Contraseña automática de un estudiante NUEVO: inicial del nombre + inicial
 * del apellido (en mayúsculas) + el documento de identidad completo. Ej.:
 * Juan Pérez, CI 1234567 → "JP1234567". Solo se usa en el ALTA de estudiantes
 * (el alta de docentes y la edición conservan la contraseña manual).
 */
export function generateStudentPassword(
  firstName: string,
  lastName: string,
  idDocument: string,
): string {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return `${f}${l}${idDocument.trim()}`;
}

/**
 * Traduce una violación de unicidad (P2002) de `users` a un mensaje claro según
 * la columna en conflicto (correo o documento de identidad, ambos `@unique`).
 * Prisma clásico expone `meta.target`, pero con el driver adapter (PrismaPg) la
 * info del constraint viene anidada (`meta.driverAdapterError…`, con el nombre
 * `users_idDocument_key`/`users_email_key`); serializamos `meta` y buscamos la
 * columna para cubrir ambos casos.
 */
function uniqueConflictMessage(
  e: Prisma.PrismaClientKnownRequestError,
): string {
  const haystack = JSON.stringify(e.meta ?? {});
  return haystack.includes('idDocument')
    ? 'Ya existe un usuario con ese documento de identidad'
    : 'Ya existe un usuario con ese correo';
}

/** Error de una fila en la carga masiva (índice 0-based dentro del arreglo). */
export interface BulkRowError {
  index: number;
  email?: string;
  message: string;
}

export interface BulkResult {
  total: number;
  created: number;
  errors: BulkRowError[];
}

// Nunca exponer el hash de contraseña hacia el panel.
const safeSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  idDocument: true,
  issuedIn: true,
  gender: true,
  originUniversity: true,
  profession: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mail: MailService,
  ) {}

  findAllAdmin(role?: string) {
    const isFilterable =
      role === Role.PROFESSOR || role === Role.STUDENT || role === Role.ADMIN;
    return this.prisma.user.findMany({
      where: isFilterable ? { role: role } : undefined,
      select: safeSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAdmin(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeSelect,
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    // Estudiante nuevo → contraseña automática (el documento es obligatorio por
    // DTO). Docente → contraseña manual obligatoria.
    let password: string;
    if (dto.role === Role.STUDENT) {
      password = generateStudentPassword(
        dto.firstName,
        dto.lastName,
        dto.idDocument,
      );
    } else {
      if (!dto.password) {
        throw new BadRequestException('La contraseña es obligatoria');
      }
      password = dto.password;
    }
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: await argon2.hash(password),
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          idDocument: dto.idDocument,
          issuedIn: dto.issuedIn ?? null,
          gender: dto.gender,
          originUniversity: dto.originUniversity ?? null,
          profession: dto.profession ?? null,
          role: dto.role,
          isActive: dto.isActive,
        },
        select: safeSelect,
      });
      // Correo de bienvenida con las credenciales (contraseña en claro, solo
      // disponible aquí). Se encola; no bloquea ni falla el alta.
      await this.mail.enqueueCredentials({
        to: user.email,
        firstName: user.firstName,
        email: user.email,
        password,
      });
      return user;
    } catch (e) {
      // Correo o documento duplicado (ambos @unique).
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(uniqueConflictMessage(e));
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOneAdmin(id);

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          // `undefined` deja el valor intacto; `null` (opcionales) lo limpia.
          phone: dto.phone,
          idDocument: dto.idDocument,
          issuedIn: dto.issuedIn,
          gender: dto.gender,
          originUniversity: dto.originUniversity,
          profession: dto.profession,
          role: dto.role,
          isActive: dto.isActive,
          // Solo re-hashea si se envía una contraseña nueva.
          ...(dto.password
            ? { password: await argon2.hash(dto.password) }
            : {}),
        },
        select: safeSelect,
      });
    } catch (e) {
      // Correo o documento duplicado (ambos @unique).
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(uniqueConflictMessage(e));
      }
      throw e;
    }
  }

  async remove(id: string) {
    const user = await this.findOneAdmin(id);
    // Borrar un ESTUDIANTE cascadea sus entregas; recolectar antes los archivos
    // (Tarea `fileUrl` + archivos de cada `ProjectDelivery`) para limpiar el
    // bucket tras el commit (mismo contrato que removeContent).
    const blobUrls: (string | null)[] = [];
    if (user.role === Role.STUDENT) {
      const subs = await this.prisma.submission.findMany({
        where: { studentId: id },
        select: {
          fileUrl: true,
          deliveries: { select: { files: { select: { url: true } } } },
        },
      });
      blobUrls.push(
        ...subs.flatMap((s) => [
          s.fileUrl,
          ...s.deliveries.flatMap((d) => d.files.map((f) => f.url)),
        ]),
      );
    }
    await this.prisma.user.delete({ where: { id } });
    await this.storage.deleteByUrls(blobUrls);
    return { success: true };
  }

  /**
   * Carga masiva de ESTUDIANTES (carga parcial): valida cada fila con Zod, crea
   * las válidas y reporta las que fallan (datos inválidos, correo duplicado en
   * el archivo o ya existente en la BD). Nunca aborta el lote por una fila mala.
   */
  async bulkCreateStudents(
    rows: Record<string, unknown>[],
  ): Promise<BulkResult> {
    const errors: BulkRowError[] = [];
    let created = 0;
    const seenEmails = new Set<string>();
    const seenDocuments = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const parsed = bulkStudentRowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        const rawEmail = rows[i]?.email;
        errors.push({
          index: i,
          email: typeof rawEmail === 'string' ? rawEmail : undefined,
          message: parsed.error.issues[0]?.message ?? 'Datos inválidos',
        });
        continue;
      }

      const data = parsed.data;
      const email = data.email.toLowerCase();
      const document = data.idDocument.trim();

      if (seenEmails.has(email)) {
        errors.push({
          index: i,
          email,
          message: 'Correo duplicado dentro del archivo',
        });
        continue;
      }
      if (seenDocuments.has(document)) {
        errors.push({
          index: i,
          email,
          message: 'Documento de identidad duplicado dentro del archivo',
        });
        continue;
      }
      seenEmails.add(email);
      seenDocuments.add(document);

      // Contraseña automática (documento obligatorio en la plantilla).
      const password = generateStudentPassword(
        data.firstName,
        data.lastName,
        data.idDocument,
      );
      try {
        await this.prisma.user.create({
          data: {
            email,
            password: await argon2.hash(password),
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            idDocument: data.idDocument,
            issuedIn: data.issuedIn ?? null,
            gender: data.gender,
            originUniversity: data.originUniversity ?? null,
            profession: data.profession ?? null,
            role: Role.STUDENT,
            isActive: true,
          },
        });
        created++;
        // Correo de credenciales (encolado; no bloquea el lote).
        await this.mail.enqueueCredentials({
          to: email,
          firstName: data.firstName,
          email,
          password,
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          errors.push({ index: i, email, message: uniqueConflictMessage(e) });
        } else {
          errors.push({ index: i, email, message: 'No se pudo registrar' });
        }
      }
    }

    return { total: rows.length, created, errors };
  }
}
