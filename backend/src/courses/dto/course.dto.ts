import { CourseStatus, ModuleStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Módulo al CREAR: el admin define cantidad + nombre de cada uno. El `order`
// se deriva de la posición en el arreglo en el servicio.
const createModuleSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del módulo es obligatorio'),
  description: z.string().trim().nullish(),
  credits: z.coerce.number().int().min(0).nullish(),
});

// Módulo al EDITAR: con `id` actualiza el módulo existente (conserva docentes y
// notas); sin `id` crea uno nuevo. Los módulos existentes ausentes del arreglo
// se eliminan.
const updateModuleSchema = createModuleSchema.extend({
  id: z.uuid().optional(),
});

export const createCourseSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del programa es obligatorio'),
  // Código institucional único (ej. "MBA-2026-I"). Si no se envía, se genera.
  code: z.string().trim().min(1).optional(),
  description: z.string().trim().nullish(),
  // Clave de icono predefinido para las tarjetas del panel.
  icon: z.string().trim().min(1).nullish(),
  modality: z.string().trim().nullish(),
  // Fechas ISO ("2026-08-03"); se convierten a Date en el servicio.
  startDate: z.string().min(1).nullish(),
  endDate: z.string().min(1).nullish(),
  passingScore: z.coerce.number().min(0).max(100).default(71),
  status: z
    .enum([
      CourseStatus.DRAFT,
      CourseStatus.ACTIVE,
      CourseStatus.FINISHED,
      CourseStatus.ARCHIVED,
    ])
    .default(CourseStatus.DRAFT),
  modules: z
    .array(createModuleSchema)
    .min(1, 'Define al menos un módulo')
    .max(50),
});

export const updateCourseSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  description: z.string().trim().nullish(),
  icon: z.string().trim().min(1).nullish(),
  modality: z.string().trim().nullish(),
  startDate: z.string().min(1).nullish(),
  endDate: z.string().min(1).nullish(),
  passingScore: z.coerce.number().min(0).max(100).optional(),
  status: z
    .enum([
      CourseStatus.DRAFT,
      CourseStatus.ACTIVE,
      CourseStatus.FINISHED,
      CourseStatus.ARCHIVED,
    ])
    .optional(),
  modules: z.array(updateModuleSchema).min(1).max(50).optional(),
});

// Asignación de docentes (co-docencia) a un módulo: reemplaza la lista completa.
export const setModuleTeachersSchema = z.object({
  teacherIds: z.array(z.uuid()).default([]),
});

// Inscripción de estudiantes al programa (a nivel de curso → todos los módulos).
export const addEnrollmentsSchema = z.object({
  studentIds: z.array(z.uuid()).min(1, 'Selecciona al menos un estudiante'),
});

// Estado de un módulo (lo fija el admin manualmente): Borrador / Activo / Concluido.
export const setModuleStatusSchema = z.object({
  status: z.enum([
    ModuleStatus.DRAFT,
    ModuleStatus.ACTIVE,
    ModuleStatus.FINISHED,
  ]),
});

export class CreateCourseDto extends createZodDto(createCourseSchema) {}
export class UpdateCourseDto extends createZodDto(updateCourseSchema) {}
export class SetModuleTeachersDto extends createZodDto(
  setModuleTeachersSchema,
) {}
export class AddEnrollmentsDto extends createZodDto(addEnrollmentsSchema) {}
export class SetModuleStatusDto extends createZodDto(setModuleStatusSchema) {}
