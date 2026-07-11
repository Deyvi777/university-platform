"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  submitEnrollmentAction,
  type EnrollmentRequestPayload,
} from "./actions";

// Mismos datos que el alta de estudiante (sin contraseña), TODOS obligatorios.
const enrollmentSchema = z.object({
  lastName: z.string().trim().min(1, "El apellido es obligatorio"),
  firstName: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.email("Ingresa un correo electrónico válido"),
  phone: z.string().trim().min(1, "El teléfono es obligatorio"),
  idDocument: z
    .string()
    .trim()
    .min(1, "El documento de identidad es obligatorio"),
  issuedIn: z.string().trim().min(1, "El lugar de expedición es obligatorio"),
  gender: z.enum(["MALE", "FEMALE"], { error: "Selecciona el género" }),
  originUniversity: z
    .string()
    .trim()
    .min(1, "La universidad de origen es obligatoria"),
  profession: z.string().trim().min(1, "La profesión es obligatoria"),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-amber-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-amber-400/20";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-rose-400">{message}</p>;
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-slate-300"
    >
      {children}
      <span className="ml-0.5 text-amber-400">*</span>
    </label>
  );
}

export function EnrollmentForm({
  programTitle,
  programSlug,
}: {
  programTitle: string;
  programSlug: string;
}) {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      email: "",
      phone: "",
      idDocument: "",
      issuedIn: "",
      gender: undefined,
      originUniversity: "",
      profession: "",
    },
  });

  async function onSubmit(values: EnrollmentFormValues) {
    setServerError(null);
    const payload: EnrollmentRequestPayload = {
      ...values,
      programTitle,
      programSlug,
    };
    const result = await submitEnrollmentAction(payload);
    if (result.ok) {
      setSent(true);
    } else {
      setServerError(result.error);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/30">
          <CheckCircle2 className="h-8 w-8 text-amber-400" />
        </span>
        <h2 className="mt-6 text-2xl font-bold text-white">
          ¡Solicitud enviada!
        </h2>
        <p className="mx-auto mt-3 max-w-md leading-7 text-slate-300">
          Recibimos tu solicitud de inscripción a{" "}
          <span className="font-semibold text-white">{programTitle}</span>.
          Nuestro equipo se pondrá en contacto contigo a la brevedad para
          completar el proceso.
        </p>
        <Link
          href={`/programas/${programSlug}`}
          className="mt-8 inline-block rounded-full border border-white/30 px-8 py-3 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10"
        >
          Volver al programa
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="lastName">Apellidos</FieldLabel>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Ej. Pérez Gutiérrez"
            {...register("lastName")}
            className={inputCls}
          />
          <FieldError message={errors.lastName?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="firstName">Nombres</FieldLabel>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Ej. Juan Carlos"
            {...register("firstName")}
            className={inputCls}
          />
          <FieldError message={errors.firstName?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            {...register("email")}
            className={inputCls}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="phone">Teléfono / WhatsApp</FieldLabel>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Ej. 77712345"
            {...register("phone")}
            className={inputCls}
          />
          <FieldError message={errors.phone?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="idDocument">Documento de identidad</FieldLabel>
          <input
            id="idDocument"
            type="text"
            placeholder="Ej. 1234567"
            {...register("idDocument")}
            className={inputCls}
          />
          <FieldError message={errors.idDocument?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="issuedIn">Expedido en</FieldLabel>
          <input
            id="issuedIn"
            type="text"
            placeholder="Ej. Cochabamba"
            {...register("issuedIn")}
            className={inputCls}
          />
          <FieldError message={errors.issuedIn?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="gender">Género</FieldLabel>
          <select
            id="gender"
            defaultValue=""
            {...register("gender")}
            className={`${inputCls} appearance-none [&>option]:bg-slate-900`}
          >
            <option value="" disabled>
              Selecciona…
            </option>
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
          </select>
          <FieldError message={errors.gender?.message} />
        </div>

        <div>
          <FieldLabel htmlFor="originUniversity">
            Universidad de origen
          </FieldLabel>
          <input
            id="originUniversity"
            type="text"
            placeholder="Ej. Universidad Mayor de San Simón"
            {...register("originUniversity")}
            className={inputCls}
          />
          <FieldError message={errors.originUniversity?.message} />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel htmlFor="profession">Profesión</FieldLabel>
          <input
            id="profession"
            type="text"
            placeholder="Ej. Licenciado en Derecho"
            {...register("profession")}
            className={inputCls}
          />
          <FieldError message={errors.profession?.message} />
        </div>
      </div>

      {serverError && (
        <p className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300 hover:shadow-amber-300/40 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isSubmitting ? "Enviando…" : "Enviar solicitud de inscripción"}
      </button>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Todos los campos son obligatorios. Tus datos se usan únicamente para
        gestionar tu inscripción; nuestro equipo te contactará para confirmar
        los siguientes pasos.
      </p>
    </form>
  );
}
