import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentKind, NotificationType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { slugify } from '../common/utils/slugify';
import {
  AddEnrollmentsDto,
  CreateCourseDto,
  SetModuleStatusDto,
  SetModuleTeachersDto,
  UpdateCourseDto,
} from './dto/course.dto';

// Datos públicos de un usuario (docente/estudiante) que sí se pueden mostrar en
// el panel — nunca el hash de contraseña.
const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
} satisfies Prisma.UserSelect;

// Un módulo con sus docentes asignados (co-docencia), listo para el panel.
const moduleInclude = {
  teachers: {
    include: { teacher: { select: userSelect } },
    orderBy: { assignedAt: 'asc' },
  },
} satisfies Prisma.CourseModuleInclude;

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAllAdmin() {
    return this.prisma.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        startDate: true,
        updatedAt: true,
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOneAdmin(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: { include: moduleInclude, orderBy: { order: 'asc' } },
        enrollments: {
          include: { student: { select: userSelect } },
          orderBy: { enrolledAt: 'asc' },
        },
      },
    });
    if (!course) {
      throw new NotFoundException('Programa no encontrado');
    }
    return course;
  }

  // ---- Cursos del usuario autenticado (panel docente/estudiante) ----

  /**
   * Cursos asignados al usuario según su rol:
   * - PROFESSOR: cursos donde dicta al menos un módulo (incluye los módulos a su
   *   cargo). Ve todos los estados (también DRAFT, porque prepara contenido).
   * - STUDENT: cursos en los que está inscrito, excluyendo borradores.
   * - ADMIN u otros: lista vacía (su home es otra).
   */
  async findForUser(userId: string, role: Role) {
    if (role === Role.PROFESSOR) {
      const courses = await this.prisma.course.findMany({
        where: {
          modules: { some: { teachers: { some: { teacherId: userId } } } },
        },
        orderBy: { startDate: { sort: 'desc', nulls: 'last' } },
        select: {
          id: true,
          code: true,
          name: true,
          modality: true,
          status: true,
          startDate: true,
          _count: { select: { modules: true } },
          modules: {
            where: { teachers: { some: { teacherId: userId } } },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, order: true },
          },
        },
      });
      return courses.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        modality: c.modality,
        status: c.status,
        startDate: c.startDate,
        moduleCount: c._count.modules,
        myModules: c.modules,
      }));
    }

    if (role === Role.STUDENT) {
      const courses = await this.prisma.course.findMany({
        where: {
          enrollments: { some: { studentId: userId } },
          status: { in: ['ACTIVE', 'FINISHED'] },
        },
        orderBy: { startDate: { sort: 'desc', nulls: 'last' } },
        select: {
          id: true,
          code: true,
          name: true,
          modality: true,
          status: true,
          startDate: true,
          // El estudiante no ve módulos en borrador.
          _count: {
            select: { modules: { where: { status: { not: 'DRAFT' } } } },
          },
          modules: {
            where: { status: { not: 'DRAFT' } },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              order: true,
              name: true,
              status: true,
              teachers: {
                orderBy: { assignedAt: 'asc' },
                select: {
                  teacher: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      });
      return courses.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        modality: c.modality,
        status: c.status,
        startDate: c.startDate,
        moduleCount: c._count.modules,
        myModules: null,
        modules: c.modules.map((m) => ({
          id: m.id,
          order: m.order,
          name: m.name,
          status: m.status,
          teachers: m.teachers.map((t) => t.teacher),
        })),
      }));
    }

    return [];
  }

  /**
   * Kárdex del estudiante: sus cursos inscritos con la nota de cada módulo y un
   * resumen por curso (promedio de módulos calificados, módulos aprobados).
   */
  async getKardex(studentId: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        enrollments: { some: { studentId } },
        status: { in: ['ACTIVE', 'FINISHED'] },
      },
      orderBy: { startDate: { sort: 'desc', nulls: 'last' } },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        passingScore: true,
        modules: {
          // El estudiante no ve módulos en borrador (tampoco en el kárdex).
          where: { status: { not: 'DRAFT' } },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            name: true,
            credits: true,
            status: true,
            grades: {
              where: { studentId },
              select: { finalScore: true, status: true },
            },
          },
        },
      },
    });

    return courses.map((c) => {
      const modules = c.modules.map((m) => {
        const g = m.grades[0];
        return {
          id: m.id,
          order: m.order,
          name: m.name,
          credits: m.credits,
          status: m.status,
          grade: g
            ? {
                finalScore: g.finalScore !== null ? Number(g.finalScore) : null,
                status: g.status,
              }
            : null,
        };
      });
      const scored = modules
        .map((m) => m.grade?.finalScore)
        .filter((s): s is number => s !== null && s !== undefined);
      const average =
        scored.length > 0
          ? Math.round(
              (scored.reduce((a, b) => a + b, 0) / scored.length) * 100,
            ) / 100
          : null;
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        status: c.status,
        passingScore: Number(c.passingScore),
        moduleCount: modules.length,
        gradedCount: scored.length,
        // Aprobados: solo cuentan los módulos CONCLUIDOS y aprobados (mientras
        // el módulo está activo no se considera aprobado/reprobado).
        passedCount: modules.filter(
          (m) => m.status === 'FINISHED' && m.grade?.status === 'PASSED',
        ).length,
        average,
        modules,
      };
    });
  }

  /**
   * Detalle de notas de un estudiante para el panel del ADMIN: sus programas
   * inscritos → cada módulo → cada actividad con su puntaje, más la nota final
   * (ponderada) del módulo y la observación del docente. Es la versión granular
   * del kárdex (que solo muestra la nota final del módulo). Mantiene la misma
   * visibilidad que el estudiante: solo cursos ACTIVE/FINISHED y se excluyen los
   * módulos en borrador.
   */
  async getStudentGradeDetail(studentId: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        enrollments: { some: { studentId } },
        status: { in: ['ACTIVE', 'FINISHED'] },
      },
      orderBy: { startDate: { sort: 'desc', nulls: 'last' } },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        passingScore: true,
        modules: {
          where: { status: { not: 'DRAFT' } },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            name: true,
            credits: true,
            status: true,
            contents: {
              where: { kind: ContentKind.ACTIVITY },
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                maxScore: true,
                weight: true,
                isOffline: true,
                submissions: {
                  where: { studentId },
                  select: { score: true, status: true },
                },
              },
            },
            grades: {
              where: { studentId },
              select: { finalScore: true, status: true, observations: true },
            },
          },
        },
      },
    });

    return courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      status: c.status,
      passingScore: Number(c.passingScore),
      modules: c.modules.map((m) => {
        const g = m.grades[0];
        return {
          id: m.id,
          order: m.order,
          name: m.name,
          credits: m.credits,
          status: m.status,
          activities: m.contents.map((a) => {
            const sub = a.submissions[0];
            return {
              id: a.id,
              title: a.title,
              maxScore: a.maxScore !== null ? Number(a.maxScore) : null,
              weight: a.weight !== null ? Number(a.weight) : null,
              isOffline: a.isOffline,
              score: sub && sub.score !== null ? Number(sub.score) : null,
              submissionStatus: sub?.status ?? null,
            };
          }),
          grade: g
            ? {
                finalScore: g.finalScore !== null ? Number(g.finalScore) : null,
                status: g.status,
                observations: g.observations,
              }
            : null,
        };
      }),
    }));
  }

  /**
   * Detalle de un curso para el usuario autenticado (docente/estudiante), con
   * sus módulos, docentes, temas, materiales y —para el estudiante— su nota por
   * módulo. Autoriza el acceso: el docente debe dictar algún módulo; el
   * estudiante debe estar inscrito y el curso no ser borrador. Si no, 404 (no se
   * filtra la existencia del curso).
   */
  async findOneForUser(userId: string, role: Role, courseId: string) {
    if (role !== Role.PROFESSOR && role !== Role.STUDENT) {
      throw new NotFoundException('Curso no encontrado');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        modality: true,
        status: true,
        startDate: true,
        endDate: true,
        passingScore: true,
        modules: {
          // El estudiante no ve módulos en borrador; el docente sí (los prepara).
          where:
            role === Role.STUDENT ? { status: { not: 'DRAFT' } } : undefined,
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            name: true,
            description: true,
            credits: true,
            status: true,
            teachers: {
              orderBy: { assignedAt: 'asc' },
              select: { teacher: { select: userSelect } },
            },
            // El detalle del contenido vive en la vista de aula; aquí solo el
            // conteo (publicado para el estudiante, total para el docente).
            _count: {
              select: {
                contents:
                  role === Role.STUDENT
                    ? { where: { isPublished: true } }
                    : true,
              },
            },
            grades: {
              where: { studentId: userId },
              select: { finalScore: true, status: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    // Autorización por rol (sin revelar la existencia del curso si no procede).
    const teaches = course.modules.some((m) =>
      m.teachers.some((t) => t.teacher.id === userId),
    );
    if (role === Role.PROFESSOR && !teaches) {
      throw new NotFoundException('Curso no encontrado');
    }
    if (role === Role.STUDENT) {
      const enrolled = await this.prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId, courseId } },
        select: { id: true },
      });
      if (!enrolled || course.status === 'DRAFT') {
        throw new NotFoundException('Curso no encontrado');
      }
    }

    return {
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description,
      modality: course.modality,
      status: course.status,
      startDate: course.startDate,
      endDate: course.endDate,
      passingScore: Number(course.passingScore),
      modules: course.modules.map((m) => {
        const grade = m.grades[0];
        return {
          id: m.id,
          order: m.order,
          name: m.name,
          description: m.description,
          credits: m.credits,
          status: m.status,
          mine:
            role === Role.PROFESSOR &&
            m.teachers.some((t) => t.teacher.id === userId),
          teachers: m.teachers.map((t) => t.teacher),
          contentCount: m._count.contents,
          grade: grade
            ? {
                finalScore:
                  grade.finalScore !== null ? Number(grade.finalScore) : null,
                status: grade.status,
              }
            : null,
        };
      }),
    };
  }

  async create(dto: CreateCourseDto) {
    const {
      modules,
      code: providedCode,
      startDate,
      endDate,
      passingScore,
      ...scalars
    } = dto;
    const code = await this.buildUniqueCode(providedCode ?? dto.name);

    return this.prisma.course.create({
      data: {
        ...scalars,
        code,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        passingScore: new Prisma.Decimal(passingScore),
        modules: {
          create: modules.map((m, i) => ({
            order: i + 1,
            name: m.name,
            description: m.description ?? null,
            credits: m.credits ?? null,
          })),
        },
      },
      include: {
        modules: { include: moduleInclude, orderBy: { order: 'asc' } },
        enrollments: { include: { student: { select: userSelect } } },
      },
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    const existing = await this.findOneAdmin(id);

    const { modules, code, startDate, endDate, passingScore, ...rest } = dto;
    const data: Prisma.CourseUpdateInput = { ...rest };
    if (code !== undefined) {
      data.code = await this.buildUniqueCode(code, id);
    }
    if (startDate !== undefined) {
      data.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      data.endDate = endDate ? new Date(endDate) : null;
    }
    if (passingScore !== undefined) {
      data.passingScore = new Prisma.Decimal(passingScore);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.course.update({ where: { id }, data });

      if (modules !== undefined) {
        const keepIds = modules
          .map((m) => m.id)
          .filter((x): x is string => Boolean(x));

        // Borra los módulos que el admin quitó (cascada: sus docentes/notas).
        await tx.courseModule.deleteMany({
          where: {
            courseId: id,
            id: { notIn: keepIds.length ? keepIds : [''] },
          },
        });

        // Reasignar `order` por posición sin chocar con @@unique([courseId,order]):
        // primero a un rango temporal alto, luego al definitivo.
        const existingIds = new Set(existing.modules.map((m) => m.id));
        for (let i = 0; i < modules.length; i++) {
          const m = modules[i];
          if (m.id && existingIds.has(m.id)) {
            await tx.courseModule.update({
              where: { id: m.id },
              data: { order: 1000 + i },
            });
          }
        }
        for (let i = 0; i < modules.length; i++) {
          const m = modules[i];
          const fields = {
            name: m.name,
            description: m.description ?? null,
            credits: m.credits ?? null,
          };
          if (m.id && existingIds.has(m.id)) {
            await tx.courseModule.update({
              where: { id: m.id },
              data: { ...fields, order: i + 1 },
            });
          } else {
            await tx.courseModule.create({
              data: { ...fields, order: i + 1, courseId: id },
            });
          }
        }
      }
    });

    return this.findOneAdmin(id);
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.course.delete({ where: { id } });
    return { success: true };
  }

  // ---- Co-docencia: docentes de un módulo ----

  async setModuleTeachers(
    courseId: string,
    moduleId: string,
    dto: SetModuleTeachersDto,
  ) {
    // Trae el módulo (con su nombre, el del programa y los docentes actuales)
    // para validar la pertenencia, redactar la notificación y calcular las altas.
    const module = await this.prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
      select: {
        id: true,
        name: true,
        course: { select: { name: true } },
        teachers: { select: { teacherId: true } },
      },
    });
    if (!module) {
      throw new NotFoundException('Módulo no encontrado en este programa');
    }
    await this.ensureUsersWithRole(dto.teacherIds, Role.PROFESSOR, 'docente');

    // Docentes recién asignados = están en la nueva lista y no estaban antes.
    const previous = new Set(module.teachers.map((t) => t.teacherId));
    const newlyAssigned = dto.teacherIds.filter((id) => !previous.has(id));

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.moduleTeacher.deleteMany({ where: { moduleId } });
      if (dto.teacherIds.length > 0) {
        await tx.moduleTeacher.createMany({
          data: dto.teacherIds.map((teacherId) => ({ moduleId, teacherId })),
        });
      }
      if (newlyAssigned.length > 0) {
        return this.notifications.createMany(
          newlyAssigned.map((teacherId) => ({
            userId: teacherId,
            type: NotificationType.MODULE_ASSIGNMENT,
            title: 'Asignación de módulo',
            body: `Te asignaron como docente del módulo «${module.name}» del programa «${module.course.name}».`,
            data: { courseId, moduleId },
          })),
          tx,
        );
      }
      return [];
    });
    // Push en tiempo real tras el commit.
    this.notifications.emitNotifications(created);

    return this.prisma.courseModule.findUniqueOrThrow({
      where: { id: moduleId },
      include: moduleInclude,
    });
  }

  // ---- Estado de un módulo (Borrador / Activo / Concluido) ----

  async setModuleStatus(
    courseId: string,
    moduleId: string,
    dto: SetModuleStatusDto,
  ) {
    const module = await this.prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
      select: { id: true },
    });
    if (!module) {
      throw new NotFoundException('Módulo no encontrado en este programa');
    }
    await this.prisma.courseModule.update({
      where: { id: moduleId },
      data: { status: dto.status },
    });
    return this.findOneAdmin(courseId);
  }

  // ---- Inscripción de estudiantes (a nivel de programa/curso) ----

  async addEnrollments(courseId: string, dto: AddEnrollmentsDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        name: true,
        enrollments: { select: { studentId: true } },
      },
    });
    if (!course) {
      throw new NotFoundException('Programa no encontrado');
    }
    await this.ensureUsersWithRole(dto.studentIds, Role.STUDENT, 'estudiante');

    // Estudiantes recién inscritos = no estaban ya inscritos en el programa.
    const already = new Set(course.enrollments.map((e) => e.studentId));
    const newlyEnrolled = dto.studentIds.filter((id) => !already.has(id));

    const created = await this.prisma.$transaction(async (tx) => {
      // `skipDuplicates` evita el 409 por @@unique([studentId, courseId]) si el
      // estudiante ya estaba inscrito.
      await tx.enrollment.createMany({
        data: dto.studentIds.map((studentId) => ({ studentId, courseId })),
        skipDuplicates: true,
      });
      if (newlyEnrolled.length > 0) {
        return this.notifications.createMany(
          newlyEnrolled.map((studentId) => ({
            userId: studentId,
            type: NotificationType.ENROLLMENT,
            title: 'Nueva inscripción',
            body: `Fuiste inscrito en el programa «${course.name}».`,
            data: { courseId },
          })),
          tx,
        );
      }
      return [];
    });
    // Push en tiempo real tras el commit.
    this.notifications.emitNotifications(created);

    return this.findOneAdmin(courseId);
  }

  async removeEnrollment(courseId: string, studentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      select: { id: true },
    });
    if (!enrollment) {
      throw new NotFoundException('El estudiante no está inscrito');
    }
    await this.prisma.enrollment.delete({ where: { id: enrollment.id } });
    return { success: true };
  }

  // ---- Helpers ----

  // Valida que todos los ids existan y tengan el rol esperado (PROFESSOR/STUDENT).
  private async ensureUsersWithRole(ids: string[], role: Role, label: string) {
    if (ids.length === 0) return;
    const found = await this.prisma.user.findMany({
      where: { id: { in: ids }, role },
      select: { id: true },
    });
    if (found.length !== new Set(ids).size) {
      throw new BadRequestException(
        `Uno o más ${label}s no son válidos o no tienen el rol correcto`,
      );
    }
  }

  // Código institucional único, derivado del nombre si no se provee. Mayúsculas
  // con guiones (ej. "Maestría en Gestión" → "MAESTRIA-EN-GESTION"), con
  // reintento numérico ante colisión.
  private async buildUniqueCode(base: string, excludeId?: string) {
    const root = slugify(base).toUpperCase() || 'PROGRAMA';
    let candidate = root;
    let suffix = 2;
    while (true) {
      const existing = await this.prisma.course.findUnique({
        where: { code: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      candidate = `${root}-${suffix++}`;
    }
  }
}
