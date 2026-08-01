import { buildCallApplicationNoticeEmail } from './mail.service';

describe('buildCallApplicationNoticeEmail', () => {
  it('incluye respuestas, archivos y enlace seguro al panel', () => {
    const email = buildCallApplicationNoticeEmail({
      to: 'avisos@example.com',
      callId: 'call-1',
      callTitle: 'Beca <Gestión 2026>',
      applicationId: 'application-1',
      submittedAt: '2026-07-31T14:30:00.000Z',
      panelUrl:
        'https://certificate.example/dashboard/convocatorias/call-1/postulaciones',
      answers: [
        {
          prompt: 'Nombre completo',
          textValue: 'Ana Pérez',
          selectedOptions: [],
          files: [],
        },
        {
          prompt: 'Área de interés',
          textValue: null,
          selectedOptions: ['Educación', 'Tecnología'],
          files: [],
        },
        {
          prompt: 'Currículum',
          textValue: null,
          selectedOptions: [],
          files: [
            {
              name: 'cv-ana.pdf',
              url: '/files/call-applications/private.pdf',
              size: 1_572_864,
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
    });

    expect(email.subject).toBe('Nueva postulación · Beca <Gestión 2026>');
    expect(email.text).toContain('Ana Pérez');
    expect(email.text).toContain('Educación, Tecnología');
    expect(email.text).toContain('cv-ana.pdf (1.5 MB)');
    expect(email.text).toContain('application-1');
    expect(email.html).toContain('Beca &lt;Gestión 2026&gt;');
    expect(email.html).not.toContain('<h1>Beca <Gestión 2026>');
    expect(email.html).toContain('Ver postulación y adjuntos');
    expect(email.html).toContain(
      'https://certificate.example/dashboard/convocatorias/call-1/postulaciones',
    );
  });
});
