import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma, Role } from '@prisma/client';

// El seed corre como subproceso de `prisma db seed`: no hereda el datasource
// de prisma.config.ts, por eso carga dotenv y crea su propio cliente.
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

const programs: Prisma.ProgramCreateInput[] = [
  {
    slug: 'maestria-gestion-publica-gobernanza',
    title: 'Maestría en Gestión Pública y Gobernanza',
    category: { connect: { slug: 'maestria' } },
    flyerUrl: '/landing/program/programa1.webp',
    objective:
      'Formar profesionales con dominio de las herramientas de gestión, planificación y control gubernamental, capaces de diseñar e implementar políticas públicas efectivas y de liderar procesos de modernización institucional en los distintos niveles del Estado Plurinacional de Bolivia.',
    targetAudience:
      'Servidores públicos, consultores, economistas, abogados, administradores y profesionales de cualquier área que se desempeñen o aspiren a desempeñarse en entidades públicas, gobiernos autónomos departamentales y municipales, empresas estatales u organizaciones de la sociedad civil.',
    modality: 'Virtual con clases en vivo',
    startDate: new Date('2026-08-03T00:00:00.000Z'),
    duration: '18 meses (4 semestres) + trabajo de grado',
    schedule: 'Viernes 19:00–22:00 y sábados 09:00–12:00',
    requirements: [
      'Fotocopia legalizada del título en provisión nacional',
      'Fotocopia legalizada del diploma académico',
      'Fotocopia de la cédula de identidad',
      'Dos fotografías 4x4 con fondo rojo',
      'Hoja de vida (currículum vitae) documentada',
      'Formulario de inscripción completado',
    ],
    enrollmentFee: new Prisma.Decimal('500.00'),
    totalCost: new Prisma.Decimal('14000.00'),
    currency: 'Bs',
    paymentFacilities:
      'Pago en 18 cuotas mensuales de Bs 750 sin interés. Descuento del 10% por pago al contado.',
    modules: {
      create: [
        {
          order: 1,
          name: 'Estado, gobierno y políticas públicas',
          contents: [
            'Teoría del Estado y estructura del Estado Plurinacional',
            'Ciclo de las políticas públicas',
            'Análisis y evaluación de políticas públicas',
          ],
        },
        {
          order: 2,
          name: 'Gestión estratégica y planificación',
          contents: [
            'Planificación estratégica institucional (PEI)',
            'Sistema de Planificación Integral del Estado (SPIE): PDES y PTDI',
            'Gestión de la inversión pública',
          ],
        },
        {
          order: 3,
          name: 'Gestión presupuestaria y control gubernamental',
          contents: [
            'Presupuesto público y clasificadores presupuestarios',
            'Ley 1178 (SAFCO) y sistemas de administración',
            'Responsabilidad por la función pública y auditoría gubernamental',
          ],
        },
        {
          order: 4,
          name: 'Gobernanza territorial y autonomías',
          contents: [
            'Régimen autonómico boliviano',
            'Gestión pública intercultural',
            'Participación ciudadana y control social',
          ],
        },
        {
          order: 5,
          name: 'Taller de tesis',
          contents: [
            'Metodología de la investigación aplicada a la gestión pública',
            'Diseño del perfil de tesis',
            'Elaboración y defensa del trabajo de grado',
          ],
        },
      ],
    },
    teachers: {
      create: [
        {
          order: 1,
          fullName: 'Dra. María Eugenia Quiroga',
          credentials: 'Ph.D. en Ciencias Políticas, Universidad de Salamanca',
        },
        {
          order: 2,
          fullName: 'Mgr. Rodolfo Ticona Mamani',
          credentials:
            'Magíster en Gestión Pública, especialista en SPIE y Ley 1178',
        },
        {
          order: 3,
          fullName: 'Dr. Jorge Antonio Salinas',
          credentials: 'Doctor en Economía del Desarrollo, CIDES-UMSA',
        },
      ],
    },
  },
  {
    slug: 'maestria-educacion-superior-innovacion-docente',
    title: 'Maestría en Educación Superior e Innovación Docente',
    category: { connect: { slug: 'maestria' } },
    flyerUrl: '/landing/program/programa2.webp',
    objective:
      'Desarrollar competencias avanzadas en docencia universitaria, diseño curricular e integración de tecnologías educativas, para transformar la práctica pedagógica en la educación superior con enfoque en innovación, calidad e investigación educativa.',
    targetAudience:
      'Docentes universitarios en ejercicio, profesionales que aspiran a la docencia en educación superior, directores académicos, pedagogos y responsables de formación en instituciones públicas y privadas.',
    modality: 'Híbrida — La Paz',
    startDate: new Date('2026-08-17T00:00:00.000Z'),
    duration: '20 meses (4 módulos semestrales)',
    schedule: 'Sábados 08:30–12:30 y 14:30–18:30 (quincenal)',
    requirements: [
      'Fotocopia legalizada del título en provisión nacional',
      'Fotocopia legalizada del diploma académico',
      'Fotocopia de la cédula de identidad',
      'Dos fotografías 4x4 con fondo rojo',
      'Hoja de vida (currículum vitae)',
      'Carta de motivación dirigida a la dirección académica',
    ],
    enrollmentFee: new Prisma.Decimal('450.00'),
    totalCost: new Prisma.Decimal('12500.00'),
    currency: 'Bs',
    paymentFacilities:
      'Pago en 20 cuotas mensuales de Bs 625. Convenios institucionales con descuento del 15% para docentes de universidades públicas.',
    modules: {
      create: [
        {
          order: 1,
          name: 'Fundamentos pedagógicos de la educación superior',
          contents: [
            'Teorías del aprendizaje en adultos',
            'Modelos educativos universitarios',
            'Normativa boliviana de la educación superior',
          ],
        },
        {
          order: 2,
          name: 'Diseño curricular por competencias',
          contents: [
            'Planificación curricular y microcurricular',
            'Formulación de competencias y resultados de aprendizaje',
            'Diseño de syllabus y guías didácticas',
          ],
        },
        {
          order: 3,
          name: 'Tecnologías educativas y aulas virtuales',
          contents: [
            'Entornos virtuales de aprendizaje (Moodle, LMS)',
            'Producción de recursos educativos digitales',
            'Inteligencia artificial aplicada a la educación',
          ],
        },
        {
          order: 4,
          name: 'Evaluación e investigación educativa',
          contents: [
            'Evaluación de los aprendizajes por competencias',
            'Metodología de la investigación educativa',
            'Publicación académica y escritura científica',
          ],
        },
        {
          order: 5,
          name: 'Docencia universitaria: práctica supervisada',
          contents: [
            'Microenseñanza y observación entre pares',
            'Portafolio docente',
            'Trabajo final de grado',
          ],
        },
      ],
    },
    teachers: {
      create: [
        {
          order: 1,
          fullName: 'Dra. Carla Verónica Aliaga',
          credentials:
            'Doctora en Ciencias de la Educación, Universidad Mayor de San Andrés',
        },
        {
          order: 2,
          fullName: 'Mgr. Pablo Andrés Rocha',
          credentials:
            'Magíster en Tecnología Educativa, especialista en entornos virtuales',
        },
        {
          order: 3,
          fullName: 'Mgr. Silvia Fernández Castro',
          credentials:
            'Magíster en Diseño Curricular, docente investigadora en educación superior',
        },
      ],
    },
  },
  {
    slug: 'diplomado-derecho-procesal-penal-litigacion-oral',
    title: 'Diplomado en Derecho Procesal Penal y Litigación Oral',
    category: { connect: { slug: 'diplomado' } },
    flyerUrl: '/landing/program/programa3.webp',
    objective:
      'Actualizar y profundizar los conocimientos del sistema procesal penal boliviano y desarrollar destrezas prácticas de litigación oral, conforme al Código de Procedimiento Penal y las reformas de la Ley 1173 de abreviación procesal.',
    targetAudience:
      'Abogados litigantes, fiscales, defensores públicos, jueces, funcionarios del Órgano Judicial y del Ministerio Público, policías investigadores y estudiantes de último año de Derecho.',
    modality: 'Virtual (clases grabadas + sesiones en vivo)',
    startDate: new Date('2026-07-13T00:00:00.000Z'),
    duration: '6 meses (800 horas académicas)',
    schedule: 'Martes y jueves 19:30–21:30',
    requirements: [
      'Fotocopia del título en provisión nacional o certificado de egreso',
      'Fotocopia de la cédula de identidad',
      'Dos fotografías 4x4 con fondo rojo',
      'Formulario de inscripción completado',
    ],
    enrollmentFee: new Prisma.Decimal('300.00'),
    totalCost: new Prisma.Decimal('3500.00'),
    currency: 'Bs',
    paymentFacilities: 'Pago en 3 cuotas de Bs 1.167 sin interés.',
    modules: {
      create: [
        {
          order: 1,
          name: 'Sistema procesal penal boliviano',
          contents: [
            'Principios y garantías constitucionales del proceso penal',
            'Código de Procedimiento Penal y Ley 1173',
            'Sujetos procesales y jurisdicción',
          ],
        },
        {
          order: 2,
          name: 'Etapa preparatoria y medidas cautelares',
          contents: [
            'Actos iniciales e investigación preliminar',
            'Imputación formal y control jurisdiccional',
            'Medidas cautelares personales y reales',
          ],
        },
        {
          order: 3,
          name: 'Juicio oral y técnicas de litigación',
          contents: [
            'Teoría del caso',
            'Examen directo y contraexamen de testigos y peritos',
            'Alegatos de apertura y clausura',
          ],
        },
        {
          order: 4,
          name: 'Recursos y ejecución penal',
          contents: [
            'Recursos de apelación y casación',
            'Procedimientos especiales y salidas alternativas',
            'Ejecución de la pena y beneficios penitenciarios',
          ],
        },
      ],
    },
    teachers: {
      create: [
        {
          order: 1,
          fullName: 'Dr. Marcelo Ríos Vargas',
          credentials:
            'Doctor en Derecho Penal, ex juez de sentencia, docente de postgrado',
        },
        {
          order: 2,
          fullName: 'Mgr. Daniela Choque Apaza',
          credentials:
            'Magíster en Derecho Procesal Penal, especialista en litigación oral',
        },
        {
          order: 3,
          fullName: 'Mgr. Iván Gutiérrez Soliz',
          credentials:
            'Magíster en Ciencias Penales y Criminológicas, fiscal de materia',
        },
      ],
    },
  },
];

// Nombres provisionales: reemplazar por las universidades reales que avalan
// los programas. La identidad de cada registro es su logoUrl (campo único).
const partners: Prisma.PartnerCreateInput[] = [
  {
    name: 'Universidad Aliada 1',
    logoUrl: '/landing/partners/2.webp',
    displayOrder: 1,
  },
  {
    name: 'Universidad Aliada 2',
    logoUrl: '/landing/partners/3.webp',
    displayOrder: 2,
  },
  {
    name: 'Universidad Aliada 3',
    logoUrl: '/landing/partners/4.webp',
    displayOrder: 3,
  },
  {
    name: 'Universidad Aliada 4',
    logoUrl: '/landing/partners/5.webp',
    displayOrder: 4,
  },
  {
    name: 'Universidad Aliada 5',
    logoUrl: '/landing/partners/6.webp',
    displayOrder: 5,
  },
  {
    name: 'Universidad Aliada 6',
    logoUrl: '/landing/partners/7.webp',
    displayOrder: 6,
  },
  {
    name: 'Universidad Aliada 7',
    logoUrl: '/landing/partners/8.webp',
    displayOrder: 7,
  },
  {
    name: 'Universidad Aliada 8',
    logoUrl: '/landing/partners/9.webp',
    displayOrder: 8,
  },
];

async function main() {
  // Categorías base (idempotente). Los programas se conectan por slug.
  const categories = [
    { name: 'Maestría', slug: 'maestria', displayOrder: 1 },
    { name: 'Diplomado', slug: 'diplomado', displayOrder: 2 },
  ];
  for (const c of categories) {
    await prisma.programCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, displayOrder: c.displayOrder },
      create: c,
    });
  }
  console.log(`Categorías listas: ${categories.map((c) => c.name).join(', ')}`);

  const slugs = programs.map((p) => p.slug);
  await prisma.program.deleteMany({ where: { slug: { in: slugs } } });

  for (const data of programs) {
    const program = await prisma.program.create({ data });
    console.log(`Programa creado: ${program.title} (${program.slug})`);
  }

  const logoUrls = partners.map((p) => p.logoUrl);
  await prisma.partner.deleteMany({ where: { logoUrl: { in: logoUrls } } });

  for (const data of partners) {
    const partner = await prisma.partner.create({ data });
    console.log(`Institución aliada creada: ${partner.name}`);
  }

  // Configuración de la landing: enlaces a redes sociales (fila singleton).
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      facebook: 'https://facebook.com/certificate.bo',
      instagram: 'https://instagram.com/certificate.bo',
      linkedin: 'https://linkedin.com/company/certificate-bo',
      youtube: 'https://youtube.com/@certificate-bo',
      tiktok: 'https://tiktok.com/@certificate.bo',
      whatsapp: 'https://wa.me/59176543210',
    },
  });
  console.log('Configuración de redes sociales lista');

  // Usuario administrador para el panel de gestión.
  const adminEmail = 'admin@certificate.bo';
  const adminPassword = 'Certificate2026!';
  const hashed = await argon2.hash(adminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed, role: Role.ADMIN, isActive: true },
    create: {
      email: adminEmail,
      password: hashed,
      firstName: 'Administrador',
      lastName: 'Certificate',
      role: Role.ADMIN,
    },
  });
  console.log(`Usuario ADMIN listo: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
