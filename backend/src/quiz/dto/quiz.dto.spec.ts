import { submitQuizSchema } from './quiz.dto';

describe('submitQuizSchema', () => {
  const questionId = '11111111-1111-4111-8111-111111111111';

  it('acepta una entrega de archivo subida por el estudiante', () => {
    const result = submitQuizSchema.safeParse({
      answers: [
        {
          questionId,
          fileUrl:
            '/files/submissions/22222222-2222-4222-8222-222222222222.docx',
          fileName: 'Trabajo final.docx',
          fileSize: 1024,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rechaza archivos ajenos a la carpeta de entregas', () => {
    const result = submitQuizSchema.safeParse({
      answers: [
        {
          questionId,
          fileUrl: '/files/materials/22222222-2222-4222-8222-222222222222.pdf',
          fileName: 'instrucciones.pdf',
          fileSize: 1024,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('exige el nombre visible cuando existe un archivo', () => {
    const result = submitQuizSchema.safeParse({
      answers: [
        {
          questionId,
          fileUrl:
            '/files/submissions/22222222-2222-4222-8222-222222222222.pdf',
          fileSize: 1024,
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
