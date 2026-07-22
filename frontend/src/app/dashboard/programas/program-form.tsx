"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { VideoUploadField } from "@/components/admin/video-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProgram } from "@/lib/api/admin";
import type { ProgramCategory } from "@/lib/api/programs";
import {
  createProgramAction,
  updateProgramAction,
} from "@/app/dashboard/programas/actions";
import {
  programFormSchema,
  toFormValues,
  toPayload,
  type ProgramFormValues,
} from "@/app/dashboard/programas/program-schema";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function OptionalTag() {
  return (
    <span className="ml-1 text-xs font-normal text-muted-foreground">
      (opcional)
    </span>
  );
}

export function ProgramForm({
  program,
  categories,
}: {
  program?: AdminProgram;
  categories: ProgramCategory[];
}) {
  const router = useRouter();
  const isEdit = Boolean(program);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: toFormValues(program),
  });
  const { register, control, handleSubmit, formState } = form;
  const { errors, isSubmitting } = formState;

  const specificObjectives = useFieldArray({
    control,
    name: "specificObjectives",
  });
  const extraFeatures = useFieldArray({ control, name: "extraFeatures" });
  const bankAccounts = useFieldArray({ control, name: "bankAccounts" });
  const requirements = useFieldArray({ control, name: "requirements" });
  const modules = useFieldArray({ control, name: "modules" });
  const teachers = useFieldArray({ control, name: "teachers" });
  // Con "Módulo 0" activo la numeración visible de la malla empieza en 0.
  const moduleZero = useWatch({ control, name: "moduleZero" });

  async function onSubmit(values: ProgramFormValues) {
    const payload = toPayload(values);
    const result =
      isEdit && program
        ? await updateProgramAction(program.id, payload)
        : await createProgramAction(payload);

    if (result.ok) {
      toast.success(isEdit ? "Programa actualizado" : "Programa creado");
      router.push("/dashboard/programas");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Datos generales */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <h2 className="text-lg font-semibold">Datos generales</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo el nombre, la categoría y el flyer son obligatorios. Los campos
          opcionales que dejes vacíos no se mostrarán en la página del programa.
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Nombre del programa</Label>
            <Input id="title" {...register("title")} className="mt-1.5" />
            <FieldError message={errors.title?.message} />
          </div>

          <div>
            <Label htmlFor="categoryId">Categoría</Label>
            <select
              id="categoryId"
              {...register("categoryId")}
              className="mt-1.5 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Selecciona…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.categoryId?.message} />
          </div>

          <div>
            <Label htmlFor="slug">
              Slug
              <OptionalTag />
            </Label>
            <Input
              id="slug"
              placeholder="se genera del título"
              {...register("slug")}
              className="mt-1.5"
            />
            <FieldError message={errors.slug?.message} />
          </div>

          <div className="sm:col-span-2">
            <Label>Flyer</Label>
            <div className="mt-1.5">
              <Controller
                control={control}
                name="flyerUrl"
                render={({ field }) => (
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                    folder="programs"
                    variant="flyer"
                  />
                )}
              />
            </div>
            <FieldError message={errors.flyerUrl?.message} />
          </div>

          <div className="sm:col-span-2">
            <ProgramVideosField control={control} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="objective">
              Objetivo del programa
              <OptionalTag />
            </Label>
            <Textarea
              id="objective"
              rows={3}
              {...register("objective")}
              className="mt-1.5"
            />
            <FieldError message={errors.objective?.message} />
          </div>

          {/* Objetivos específicos: uno por campo, en la landing van con viñeta */}
          <div className="sm:col-span-2 rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>
                  Objetivos específicos
                  <OptionalTag />
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Agrega cada objetivo por separado; se muestran como lista en
                  la landing.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => specificObjectives.append({ value: "" })}
              >
                <Plus className="size-4" /> Agregar
              </Button>
            </div>
            {specificObjectives.fields.length > 0 && (
              <div className="mt-3 space-y-2">
                {specificObjectives.fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder={`Objetivo específico ${index + 1}`}
                        {...register(`specificObjectives.${index}.value`)}
                      />
                      <FieldError
                        message={
                          errors.specificObjectives?.[index]?.value?.message
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => specificObjectives.remove(index)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="targetAudience">
              Dirigido a
              <OptionalTag />
            </Label>
            <Textarea
              id="targetAudience"
              rows={2}
              {...register("targetAudience")}
              className="mt-1.5"
            />
            <FieldError message={errors.targetAudience?.message} />
          </div>

          <div>
            <Label htmlFor="modality">
              Modalidad
              <OptionalTag />
            </Label>
            <Input id="modality" {...register("modality")} className="mt-1.5" />
            <FieldError message={errors.modality?.message} />
          </div>

          <div>
            <Label htmlFor="startDate">
              Inicio de clases
              <OptionalTag />
            </Label>
            <Input
              id="startDate"
              type="date"
              {...register("startDate")}
              className="mt-1.5"
            />
            <FieldError message={errors.startDate?.message} />
          </div>

          <div>
            <Label htmlFor="duration">
              Duración
              <OptionalTag />
            </Label>
            <Input id="duration" {...register("duration")} className="mt-1.5" />
            <FieldError message={errors.duration?.message} />
          </div>

          <div>
            <Label htmlFor="schedule">
              Horarios
              <OptionalTag />
            </Label>
            <Input id="schedule" {...register("schedule")} className="mt-1.5" />
            <FieldError message={errors.schedule?.message} />
          </div>

          <div>
            <Label htmlFor="hourlyLoad">
              Carga horaria
              <OptionalTag />
            </Label>
            <Input
              id="hourlyLoad"
              placeholder="Ej. 1200 horas académicas"
              {...register("hourlyLoad")}
              className="mt-1.5"
            />
            <FieldError message={errors.hourlyLoad?.message} />
          </div>

          {/* Más características: pares etiqueta/valor definidos por el admin */}
          <div className="sm:col-span-2 rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>
                  Más características del programa
                  <OptionalTag />
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Campos personalizados (ej. Certificación, Idioma, Créditos)
                  que se muestran en la ficha del programa.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => extraFeatures.append({ label: "", value: "" })}
              >
                <Plus className="size-4" /> Agregar
              </Button>
            </div>
            {extraFeatures.fields.length > 0 && (
              <div className="mt-3 space-y-2">
                {extraFeatures.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]"
                  >
                    <div>
                      <Input
                        placeholder="Característica (ej. Certificación)"
                        {...register(`extraFeatures.${index}.label`)}
                      />
                      <FieldError
                        message={errors.extraFeatures?.[index]?.label?.message}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Detalle (ej. Doble titulación)"
                        {...register(`extraFeatures.${index}.value`)}
                      />
                      <FieldError
                        message={errors.extraFeatures?.[index]?.value?.message}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => extraFeatures.remove(index)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Malla académica */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Malla académica</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="moduleZero"
                render={({ field }) => (
                  <Switch
                    id="moduleZero"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="moduleZero"
                className="text-sm font-normal text-muted-foreground"
              >
                Incluir Módulo 0
              </Label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                modules.append({ name: "", contents: [{ value: "" }] })
              }
            >
              <Plus className="size-4" /> Agregar módulo
            </Button>
          </div>
        </div>
        <div className="mt-4 space-y-5">
          {modules.fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Módulo {index + (moduleZero ? 0 : 1)}
                </span>
                <Input
                  placeholder="Nombre del módulo"
                  {...register(`modules.${index}.name`)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => modules.remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <FieldError message={errors.modules?.[index]?.name?.message} />
              <ModuleContents
                control={control}
                register={register}
                moduleIndex={index}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Staff docente */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Staff docente</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Foto, grado y una breve reseña de cada docente.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              teachers.append({
                fullName: "",
                credentials: "",
                bio: "",
                photoUrl: "",
              })
            }
          >
            <Plus className="size-4" /> Agregar docente
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          {teachers.fields.map((field, index) => (
            <div
              key={field.id}
              className="relative rounded-lg border bg-background p-4"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 top-3"
                onClick={() => teachers.remove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
              <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                <div>
                  <Label className="text-xs">
                    Foto
                    <OptionalTag />
                  </Label>
                  <div className="mt-1">
                    <Controller
                      control={control}
                      name={`teachers.${index}.photoUrl`}
                      render={({ field: photoField }) => (
                        <ImageUploadField
                          value={photoField.value ?? ""}
                          onChange={photoField.onChange}
                          folder="team"
                          variant="portrait"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Nombre completo</Label>
                      <Input
                        {...register(`teachers.${index}.fullName`)}
                        className="mt-1"
                      />
                      <FieldError
                        message={errors.teachers?.[index]?.fullName?.message}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">
                        Grado / especialidad
                        <OptionalTag />
                      </Label>
                      <Input
                        {...register(`teachers.${index}.credentials`)}
                        className="mt-1"
                      />
                      <FieldError
                        message={errors.teachers?.[index]?.credentials?.message}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">
                      Descripción / historial
                      <OptionalTag />
                    </Label>
                    <Textarea
                      rows={3}
                      placeholder="Trayectoria, experiencia y logros del docente…"
                      {...register(`teachers.${index}.bio`)}
                      className="mt-1"
                    />
                    <FieldError
                      message={errors.teachers?.[index]?.bio?.message}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {teachers.fields.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Aún no agregaste docentes. Si no agregas ninguno, la sección no se
              muestra en la landing.
            </p>
          )}
        </div>
      </section>

      {/* Requisitos */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Requisitos</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Si no agregas ninguno, la sección no se muestra en la landing.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => requirements.append({ value: "" })}
          >
            <Plus className="size-4" /> Agregar
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {requirements.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Input {...register(`requirements.${index}.value`)} />
                <FieldError
                  message={errors.requirements?.[index]?.value?.message}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => requirements.remove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Inversión y publicación */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm shadow-blue-950/[0.04] dark:shadow-none">
        <h2 className="text-lg font-semibold">Inversión y publicación</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Las opciones o medios de pago que dejes vacíos no se muestran en la
          landing.
        </p>

        {/* Opciones de pago */}
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <Label className="font-semibold">
              Pago al contado
              <OptionalTag />
            </Label>
            <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr_1fr]">
              <div>
                <Label htmlFor="currency" className="text-xs">
                  Moneda
                </Label>
                <Input
                  id="currency"
                  {...register("currency")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="totalCost" className="text-xs">
                  Monto
                </Label>
                <Input
                  id="totalCost"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("totalCost")}
                  className="mt-1"
                />
                <FieldError message={errors.totalCost?.message} />
              </div>
              <div>
                <Label htmlFor="enrollmentFee" className="text-xs">
                  Matrícula
                  <OptionalTag />
                </Label>
                <Input
                  id="enrollmentFee"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("enrollmentFee")}
                  className="mt-1"
                />
                <FieldError message={errors.enrollmentFee?.message} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <Label className="font-semibold">
              Plan de cuotas
              <OptionalTag />
            </Label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <Label htmlFor="installmentCurrency" className="text-xs">
                  Moneda
                </Label>
                <Input
                  id="installmentCurrency"
                  {...register("installmentCurrency")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="installmentCount" className="text-xs">
                  Nº de cuotas
                </Label>
                <Input
                  id="installmentCount"
                  type="number"
                  step="1"
                  min="1"
                  {...register("installmentCount")}
                  className="mt-1"
                />
                <FieldError message={errors.installmentCount?.message} />
              </div>
              <div>
                <Label
                  htmlFor="installmentFirstAmount"
                  className="text-xs"
                >
                  Primera cuota
                  <OptionalTag />
                </Label>
                <Input
                  id="installmentFirstAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("installmentFirstAmount")}
                  className="mt-1"
                />
                <FieldError
                  message={errors.installmentFirstAmount?.message}
                />
              </div>
              <div>
                <Label htmlFor="installmentAmount" className="text-xs">
                  Monto por cuota
                </Label>
                <Input
                  id="installmentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("installmentAmount")}
                  className="mt-1"
                />
                <FieldError message={errors.installmentAmount?.message} />
              </div>
              <div>
                <Label
                  htmlFor="installmentEnrollmentFee"
                  className="text-xs"
                >
                  Matrícula
                  <OptionalTag />
                </Label>
                <Input
                  id="installmentEnrollmentFee"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("installmentEnrollmentFee")}
                  className="mt-1"
                />
                <FieldError
                  message={errors.installmentEnrollmentFee?.message}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="paymentFacilities">
            Nota / facilidades de pago
            <OptionalTag />
          </Label>
          <Textarea
            id="paymentFacilities"
            rows={2}
            placeholder="Ej. Descuento por pago al contado hasta el 31 de julio…"
            {...register("paymentFacilities")}
            className="mt-1.5"
          />
        </div>

        {/* Medios de pago */}
        <h3 className="mt-6 text-base font-semibold">Medios de pago</h3>
        <div className="mt-3 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">
                  Depósito o transferencia bancaria
                  <OptionalTag />
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Agrega una o más cuentas para recibir pagos.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  bankAccounts.append({
                    bank: "",
                    accountNumber: "",
                    holder: "",
                  })
                }
              >
                <Plus className="size-4" /> Agregar cuenta
              </Button>
            </div>
            {bankAccounts.fields.length > 0 && (
              <div className="mt-3 space-y-3">
                {bankAccounts.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                  >
                    <div>
                      <Label className="text-xs">Entidad financiera</Label>
                      <Input
                        placeholder="Ej. Banco Unión"
                        {...register(`bankAccounts.${index}.bank`)}
                        className="mt-1"
                      />
                      <FieldError
                        message={errors.bankAccounts?.[index]?.bank?.message}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Número de cuenta</Label>
                      <Input
                        placeholder="Ej. 10000012345678"
                        {...register(`bankAccounts.${index}.accountNumber`)}
                        className="mt-1"
                      />
                      <FieldError
                        message={
                          errors.bankAccounts?.[index]?.accountNumber?.message
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">
                        Titular de la cuenta
                        <OptionalTag />
                      </Label>
                      <Input
                        {...register(`bankAccounts.${index}.holder`)}
                        className="mt-1"
                      />
                      <FieldError
                        message={errors.bankAccounts?.[index]?.holder?.message}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => bankAccounts.remove(index)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-background p-4">
            <Label className="font-semibold">
              Transacción con QR
              <OptionalTag />
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sube la imagen del código QR de cobro.
            </p>
            <div className="mt-3">
              <Controller
                control={control}
                name="qrImageUrl"
                render={({ field }) => (
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                    folder="programs"
                    variant="logo"
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Controller
            control={control}
            name="isPublished"
            render={({ field }) => (
              <Switch
                id="isPublished"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="isPublished">Publicado (visible en la landing)</Label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear programa"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/programas")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/** Lista ordenada de videos promocionales; cada nuevo elemento se agrega al final. */
function ProgramVideosField({
  control,
}: {
  control: Control<ProgramFormValues>;
}) {
  const videos = useFieldArray({ control, name: "videos" });

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Label className="font-semibold">
            Videos del programa
            <OptionalTag />
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Agrega enlaces de YouTube/Vimeo o archivos. En la landing se
            mostrarán en este mismo orden, uno debajo del otro.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => videos.append({ value: "" })}
        >
          <Plus className="size-4" /> Agregar video
        </Button>
      </div>

      {videos.fields.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
          Este programa todavía no tiene videos promocionales.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {videos.fields.map((video, index) => (
            <div key={video.id} className="rounded-lg border bg-card p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">Video {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Quitar video ${index + 1}`}
                  onClick={() => videos.remove(index)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <Controller
                control={control}
                name={`videos.${index}.value`}
                render={({ field, fieldState }) => (
                  <>
                    <VideoFieldInput
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FieldError message={fieldState.error?.message} />
                  </>
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoFieldInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [mode, setMode] = useState<"link" | "upload">(() =>
    value.startsWith("/files/") ? "upload" : "link",
  );

  function selectMode(nextMode: "link" | "upload") {
    if (nextMode === mode) return;
    onChange("");
    setMode(nextMode);
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-3 inline-flex rounded-lg border bg-muted/40 p-0.5 text-sm">
        <button
          type="button"
          onClick={() => selectMode("link")}
          aria-pressed={mode === "link"}
          className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
            mode === "link"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Enlace
        </button>
        <button
          type="button"
          onClick={() => selectMode("upload")}
          aria-pressed={mode === "upload"}
          className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
            mode === "upload"
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Subir archivo
        </button>
      </div>

      {mode === "upload" ? (
        <VideoUploadField value={value} onChange={onChange} />
      ) : (
        <Input
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=…  o  https://vimeo.com/…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function ModuleContents({
  control,
  register,
  moduleIndex,
}: {
  control: Control<ProgramFormValues>;
  register: ReturnType<typeof useForm<ProgramFormValues>>["register"];
  moduleIndex: number;
}) {
  const contents = useFieldArray({
    control,
    name: `modules.${moduleIndex}.contents`,
  });

  return (
    <div className="mt-3 space-y-2 border-l-2 border-muted pl-4">
      <Label className="text-xs text-muted-foreground">
        Contenidos / asignaturas
      </Label>
      {contents.fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Input
            {...register(`modules.${moduleIndex}.contents.${index}.value`)}
            className="h-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => contents.remove(index)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => contents.append({ value: "" })}
      >
        <Plus className="size-4" /> Agregar contenido
      </Button>
    </div>
  );
}
