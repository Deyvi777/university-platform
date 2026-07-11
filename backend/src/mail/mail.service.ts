import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';

/** Nombre de la cola de correo (BullMQ) y de los tipos de job. */
export const MAIL_QUEUE = 'mail';
export const CREDENTIALS_JOB = 'credentials';
export const ENROLLMENT_NOTICE_JOB = 'enrollment-notice';

/** Datos para el correo de bienvenida con credenciales de acceso. */
export interface CredentialsMailPayload {
  to: string;
  firstName: string;
  /** Apellido y teléfono: los usa el aviso al ADMIN si el envío falla. */
  lastName: string;
  phone: string;
  email: string;
  /** Contraseña en claro (solo disponible al momento del alta). */
  password: string;
}

/** Datos para el aviso por correo de una nueva solicitud de inscripción. */
export interface EnrollmentNoticeMailPayload {
  /** Buzón destino (configurable desde /dashboard/solicitudes). */
  to: string;
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
}

/**
 * Envío de correo transaccional vía SMTP (agnóstico al proveedor: Brevo,
 * Resend, Gmail, etc. — se configura con las variables `SMTP_*`). El envío real
 * lo hace `sendCredentials` desde el procesador de la cola; los servicios solo
 * **encolan** con `enqueueCredentials` para no bloquear la petición (clave en la
 * carga masiva). Si SMTP no está configurado, no se encola y se registra un
 * aviso — la app sigue funcionando sin correo.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from = '';

  constructor(
    private readonly config: ConfigService,
    @InjectQueue(MAIL_QUEUE) private readonly queue: Queue,
  ) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP no configurado (SMTP_HOST/SMTP_USER/SMTP_PASS): no se enviarán correos de credenciales.',
      );
      return;
    }
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    this.transporter = nodemailer.createTransport({
      host,
      port,
      // 465 = SSL implícito; 587/2525 = STARTTLS.
      secure: port === 465,
      auth: { user, pass },
    });
    // Remitente: SMTP_FROM o, por defecto, el usuario SMTP.
    this.from = this.config.get<string>('SMTP_FROM') ?? user;
    this.logger.log(`SMTP listo (${host}:${port}).`);
  }

  get isEnabled(): boolean {
    return this.transporter !== null;
  }

  /**
   * URL de login para el correo. `MAIL_LOGIN_URL` (si se define) tiene
   * prioridad y se usa tal cual — es intencionalmente independiente de
   * `FRONTEND_URL` porque esa variable también gobierna el CORS y los
   * WebSockets (puede llevar varios orígenes separados por coma para
   * desarrollo + producción a la vez, y el link no debe depender de cuál
   * quede primero en esa lista). Sin `MAIL_LOGIN_URL`, cae al primer origen
   * de `FRONTEND_URL` + `/login` (comportamiento previo). Pública porque el
   * procesador la incluye en el aviso al ADMIN cuando un envío falla (para el
   * mensaje de WhatsApp con las credenciales).
   */
  loginUrl(): string {
    const explicit = this.config.get<string>('MAIL_LOGIN_URL');
    if (explicit) return explicit.trim().replace(/\/$/, '');
    return `${this.frontendBase()}/login`;
  }

  /** URL de la sección de solicitudes del panel (para el aviso por correo). */
  requestsPanelUrl(): string {
    return `${this.frontendBase()}/dashboard/solicitudes`;
  }

  /** Primer origen de `FRONTEND_URL` (puede listar varios separados por coma). */
  private frontendBase(): string {
    return (this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');
  }

  /**
   * Encola el correo de credenciales. No lanza: si SMTP no está configurado
   * registra un aviso y no encola (el alta del usuario no debe fallar por el
   * correo).
   */
  async enqueueCredentials(payload: CredentialsMailPayload): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn(
        `SMTP deshabilitado; no se encola el correo de credenciales para ${payload.email}.`,
      );
      return;
    }
    try {
      await this.queue.add(CREDENTIALS_JOB, payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (e) {
      this.logger.error(
        `No se pudo encolar el correo para ${payload.email}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  /**
   * Encola el aviso de una nueva solicitud de inscripción. No lanza: sin SMTP
   * solo registra un aviso (la solicitud ya quedó guardada y notificada en la
   * campana del panel).
   */
  async enqueueEnrollmentNotice(
    payload: EnrollmentNoticeMailPayload,
  ): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn(
        `SMTP deshabilitado; no se encola el aviso de solicitud de ${payload.email}.`,
      );
      return;
    }
    try {
      await this.queue.add(ENROLLMENT_NOTICE_JOB, payload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (e) {
      this.logger.error(
        `No se pudo encolar el aviso de solicitud de ${payload.email}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  /** Envío real del aviso de solicitud (lo llama el procesador de la cola). */
  async sendEnrollmentNotice(
    payload: EnrollmentNoticeMailPayload,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP deshabilitado; se omite el aviso de solicitud de ${payload.email}.`,
      );
      return;
    }
    const { subject, html, text } = buildEnrollmentNoticeEmail({
      ...payload,
      panelUrl: this.requestsPanelUrl(),
    });
    await this.transporter.sendMail({
      from: this.from,
      to: payload.to,
      subject,
      text,
      html,
    });
    this.logger.log(
      `Aviso de solicitud de inscripción enviado a ${payload.to}.`,
    );
  }

  /** Envío real (lo llama el procesador de la cola). */
  async sendCredentials(payload: CredentialsMailPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP deshabilitado; se omite el correo para ${payload.email}.`,
      );
      return;
    }
    const loginUrl = this.loginUrl();
    const { subject, html, text } = buildCredentialsEmail({
      firstName: payload.firstName,
      email: payload.email,
      password: payload.password,
      loginUrl,
    });
    await this.transporter.sendMail({
      from: this.from,
      to: payload.to,
      subject,
      text,
      html,
    });
    this.logger.log(`Correo de credenciales enviado a ${payload.email}.`);
  }
}

/** Escapa texto para insertarlo en HTML (evita romper el markup / inyección). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Arma el asunto + cuerpo (HTML y texto plano) del correo de credenciales. */
export function buildCredentialsEmail(data: {
  firstName: string;
  email: string;
  password: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const name = data.firstName.trim() || 'Hola';
  const subject = 'Tus credenciales de acceso · Certificate';
  const text = [
    `Hola ${name},`,
    '',
    'Se creó tu cuenta en la plataforma Certificate. Estas son tus credenciales de acceso:',
    '',
    `  Correo:      ${data.email}`,
    `  Contraseña:  ${data.password}`,
    '',
    `Inicia sesión aquí: ${data.loginUrl}`,
    '',
    'Te recomendamos guardar este correo en un lugar seguro.',
    '',
    'Certificate — Escuela de Posgrado',
  ].join('\n');

  const html = `<!-- credenciales -->
<div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#1e3a8a;padding:20px 24px;">
      <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.3px;">Certificate</span>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 12px;font-size:15px;">Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
        Se creó tu cuenta en la plataforma <strong>Certificate</strong>. Estas son tus credenciales de acceso:
      </p>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;margin:0 0 20px;">
        <tr>
          <td style="padding:12px 14px;font-size:13px;color:#64748b;width:110px;">Correo</td>
          <td style="padding:12px 14px;font-size:14px;font-weight:bold;">${escapeHtml(data.email)}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;">Contraseña</td>
          <td style="padding:12px 14px;font-size:14px;font-weight:bold;border-top:1px solid #e2e8f0;font-family:'Courier New',monospace;">${escapeHtml(data.password)}</td>
        </tr>
      </table>
      <a href="${escapeHtml(data.loginUrl)}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:bold;">
        Iniciar sesión
      </a>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <span style="color:#1e3a8a;">${escapeHtml(data.loginUrl)}</span>
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
        Te recomendamos guardar este correo en un lugar seguro.
      </p>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
      Certificate — Escuela de Posgrado
    </div>
  </div>
</div>`;

  return { subject, html, text };
}

/**
 * Arma el asunto + cuerpo (HTML y texto) del aviso de una nueva solicitud de
 * inscripción. Incluye enlace al panel y un wa.me al teléfono del solicitante.
 */
export function buildEnrollmentNoticeEmail(
  data: EnrollmentNoticeMailPayload & { panelUrl: string },
): { subject: string; html: string; text: string } {
  // Convención institucional: "Apellido Nombre".
  const fullName = `${data.lastName} ${data.firstName}`.trim();
  const genderLabel = data.gender === 'FEMALE' ? 'Femenino' : 'Masculino';
  // Normalización local boliviana → wa.me (igual que el panel).
  const digits = data.phone.replace(/\D/g, '');
  const waUrl = digits
    ? `https://wa.me/${digits.startsWith('591') ? digits : `591${digits}`}`
    : null;

  const subject = `Nueva solicitud de inscripción · ${data.programTitle}`;

  const rows: Array<[string, string]> = [
    ['Apellidos y nombre', fullName],
    ['Programa', data.programTitle],
    ['Correo', data.email],
    ['Teléfono', data.phone],
    ['Documento', `${data.idDocument} (Exp. ${data.issuedIn})`],
    ['Género', genderLabel],
    ['Universidad de origen', data.originUniversity],
    ['Profesión', data.profession],
  ];

  const text = [
    'Llegó una nueva solicitud de inscripción desde la web:',
    '',
    ...rows.map(([label, value]) => `  ${label}: ${value}`),
    '',
    `Revisar e inscribir: ${data.panelUrl}`,
    ...(waUrl ? [`Contactar por WhatsApp: ${waUrl}`] : []),
    '',
    'Certificate — Escuela de Posgrado',
  ].join('\n');

  const htmlRows = rows
    .map(
      ([label, value], i) => `<tr>
          <td style="padding:10px 14px;font-size:13px;color:#64748b;width:160px;${i > 0 ? 'border-top:1px solid #e2e8f0;' : ''}">${escapeHtml(label)}</td>
          <td style="padding:10px 14px;font-size:14px;font-weight:bold;${i > 0 ? 'border-top:1px solid #e2e8f0;' : ''}">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('\n');

  const html = `<!-- solicitud de inscripción -->
<div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#1e3a8a;padding:20px 24px;">
      <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.3px;">Certificate</span>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:15px;">
        Llegó una <strong>nueva solicitud de inscripción</strong> desde la web:
      </p>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;margin:0 0 20px;">
${htmlRows}
      </table>
      <a href="${escapeHtml(data.panelUrl)}" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:bold;">
        Revisar e inscribir
      </a>
      ${
        waUrl
          ? `<a href="${escapeHtml(waUrl)}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:bold;margin-left:8px;">
        Contactar por WhatsApp
      </a>`
          : ''
      }
      <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <span style="color:#1e3a8a;">${escapeHtml(data.panelUrl)}</span>
      </p>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
      Certificate — Escuela de Posgrado
    </div>
  </div>
</div>`;

  return { subject, html, text };
}
