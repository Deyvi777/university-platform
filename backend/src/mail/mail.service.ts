import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';

/** Nombre de la cola de correo (BullMQ) y del tipo de job de credenciales. */
export const MAIL_QUEUE = 'mail';
export const CREDENTIALS_JOB = 'credentials';

/** Datos para el correo de bienvenida con credenciales de acceso. */
export interface CredentialsMailPayload {
  to: string;
  firstName: string;
  email: string;
  /** Contraseña en claro (solo disponible al momento del alta). */
  password: string;
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
   * de `FRONTEND_URL` + `/login` (comportamiento previo).
   */
  private loginUrl(): string {
    const explicit = this.config.get<string>('MAIL_LOGIN_URL');
    if (explicit) return explicit.trim().replace(/\/$/, '');
    const base = (
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
    )
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');
    return `${base}/login`;
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
