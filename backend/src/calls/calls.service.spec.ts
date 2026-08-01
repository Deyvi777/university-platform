import { NotFoundException } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CallsService } from './calls.service';

describe('CallsService.removeApplication', () => {
  function build(application: unknown) {
    const findFirst = jest.fn().mockResolvedValue(application);
    const deleteApplication = jest.fn().mockResolvedValue({});
    const deleteByUrls = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      callApplication: {
        findFirst,
        delete: deleteApplication,
      },
    } as unknown as PrismaService;
    const storage = {
      deleteByUrls,
    } as unknown as StorageService;
    const service = new CallsService(prisma, storage, {} as MailService);
    return { service, findFirst, deleteApplication, deleteByUrls };
  }

  it('elimina respuestas y limpia los adjuntos asociados', async () => {
    const { service, findFirst, deleteApplication, deleteByUrls } = build({
      answers: [
        {
          files: [
            {
              name: 'cv.pdf',
              url: '/files/call-applications/cv.pdf',
              size: 100,
              mimeType: 'application/pdf',
            },
          ],
        },
        { files: [{ name: 'sin-url.pdf' }, null, 'inválido'] },
      ],
    });

    await expect(
      service.removeApplication('call-1', 'application-1'),
    ).resolves.toEqual({ success: true });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'application-1', callId: 'call-1' },
      select: { answers: { select: { files: true } } },
    });
    expect(deleteApplication).toHaveBeenCalledWith({
      where: { id: 'application-1' },
    });
    expect(deleteByUrls).toHaveBeenCalledWith([
      '/files/call-applications/cv.pdf',
    ]);
  });

  it('rechaza una postulación que no pertenece a la convocatoria', async () => {
    const { service, deleteApplication, deleteByUrls } = build(null);

    await expect(
      service.removeApplication('call-1', 'application-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(deleteApplication).not.toHaveBeenCalled();
    expect(deleteByUrls).not.toHaveBeenCalled();
  });
});
