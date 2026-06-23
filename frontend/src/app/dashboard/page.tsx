import {
  ArrowUpRight,
  Building2,
  BookOpen,
  GraduationCap,
  Send,
  Share2,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  listAdminCategories,
  listAdminCourses,
  listAdminPartners,
  listAdminPrograms,
  listAdminUsers,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { requireUser } from "@/lib/auth-guard";
import { listMyCourses } from "@/lib/api/me";
import { MyCoursesHome } from "./my-courses-home";

export default async function DashboardPage() {
  const session = await requireUser();
  const role = session.user.role;

  if (role === "ADMIN") {
    return <AdminHome name={session.user.name} />;
  }

  const courses = await listMyCourses();

  if (role === "PROFESSOR") {
    return (
      <MyCoursesHome
        name={session.user.name}
        greeting="Bienvenido"
        intro="Este es tu panel docente. Aquí están los cursos en los que dictas módulos."
        courses={courses}
        emptyTitle="Aún no tienes cursos asignados"
        emptyDescription="Cuando te asignen como docente de un módulo, el curso aparecerá aquí."
      />
    );
  }

  return (
    <MyCoursesHome
      name={session.user.name}
      greeting="Bienvenido"
      intro="Este es tu panel de estudiante. Aquí están los cursos en los que estás inscrito."
      courses={courses}
      emptyTitle="Aún no estás inscrito en ningún curso"
      emptyDescription="Cuando te inscriban en un programa, lo verás aquí con sus módulos."
    />
  );
}

/**
 * Tinte pastel suave por tarjeta (estética de la referencia, atenuada para el
 * tono institucional). Cada tono define fondo de tarjeta, fondo+color del icono
 * y borde de hover. El ámbar queda reservado para la acción/marca, así que las
 * categorías usan sky/violet/emerald/rose/amber según convenga.
 */
type Tint = {
  card: string;
  icon: string;
  hoverBorder: string;
  ring: string;
};

const TINTS: Record<string, Tint> = {
  amber: {
    card: "bg-amber-50 dark:bg-amber-500/10",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    hoverBorder: "hover:border-amber-300 dark:hover:border-amber-500/40",
    ring: "focus-visible:ring-amber-400/50",
  },
  sky: {
    card: "bg-sky-50 dark:bg-sky-500/10",
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    hoverBorder: "hover:border-sky-300 dark:hover:border-sky-500/40",
    ring: "focus-visible:ring-sky-400/50",
  },
  violet: {
    card: "bg-violet-50 dark:bg-violet-500/10",
    icon: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    hoverBorder: "hover:border-violet-300 dark:hover:border-violet-500/40",
    ring: "focus-visible:ring-violet-400/50",
  },
  emerald: {
    card: "bg-emerald-50 dark:bg-emerald-500/10",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    hoverBorder: "hover:border-emerald-300 dark:hover:border-emerald-500/40",
    ring: "focus-visible:ring-emerald-400/50",
  },
  rose: {
    card: "bg-rose-50 dark:bg-rose-500/10",
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    hoverBorder: "hover:border-rose-300 dark:hover:border-rose-500/40",
    ring: "focus-visible:ring-rose-400/50",
  },
};

type HomeCard = {
  href: string;
  label: string;
  category: string;
  description: string;
  count: number | null;
  icon: LucideIcon;
  tint: keyof typeof TINTS;
};

async function AdminHome({ name }: { name?: string | null }) {
  const [programs, categories, partners, users, courses] = await Promise.all([
    listAdminPrograms(),
    listAdminCategories(),
    listAdminPartners(),
    listAdminUsers(),
    listAdminCourses(),
  ]);

  const firstName = name?.trim().split(/\s+/)[0];

  const academicCards: HomeCard[] = [
    {
      href: "/dashboard/cursos",
      label: "Programas",
      category: "Operación académica",
      description:
        "Programas con módulos, docentes a cargo y estudiantes inscritos.",
      count: courses.length,
      icon: BookOpen,
      tint: "sky",
    },
  ];

  const siteCards: HomeCard[] = [
    {
      href: "/dashboard/programas",
      label: "Programas",
      category: "Oferta académica",
      description: "Maestrías y diplomados que se muestran en la landing.",
      count: programs.length,
      icon: GraduationCap,
      tint: "sky",
    },
    {
      href: "/dashboard/categorias",
      label: "Categorías",
      category: "Clasificación",
      description: "Tipos de programa para clasificar la oferta.",
      count: categories.length,
      icon: Tags,
      tint: "violet",
    },
    {
      href: "/dashboard/partners",
      label: "Instituciones aliadas",
      category: "Avales",
      description: "Logos de las instituciones que avalan los programas.",
      count: partners.length,
      icon: Building2,
      tint: "emerald",
    },
    {
      href: "/dashboard/configuracion",
      label: "Redes sociales",
      category: "Pie de la landing",
      description: "Enlaces de redes que aparecen en el pie de la landing.",
      count: null,
      icon: Share2,
      tint: "rose",
    },
  ];

  const peopleCards: HomeCard[] = [
    {
      href: "/dashboard/usuarios",
      label: "Usuarios",
      category: "Personas",
      description: "Docentes y estudiantes con acceso a la plataforma.",
      count: users.length,
      icon: Users,
      tint: "amber",
    },
    {
      href: "/dashboard/notificaciones/enviar",
      label: "Enviar aviso",
      category: "Notificaciones",
      description: "Envía una notificación a docentes y estudiantes.",
      count: null,
      icon: Send,
      tint: "sky",
    },
  ];

  return (
    <div>
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          {firstName ? `Hola, ${firstName}` : "Panel de gestión"}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Gestiona tu plataforma
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Administra el contenido y las personas de Certificate desde un solo
          lugar.
        </p>
      </header>

      <HomeSection
        id="academico"
        title="Académico"
        cards={academicCards}
        className="mt-8"
      />

      <HomeSection
        id="personas"
        title="Personas"
        cards={peopleCards}
        className="mt-10"
      />

      <HomeSection
        id="gestion-sitio"
        title="Gestión del sitio · Landing"
        cards={siteCards}
        className="mt-10"
      />
    </div>
  );
}

function HomeSection({
  id,
  title,
  cards,
  className,
}: {
  id: string;
  title: string;
  cards: HomeCard[];
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <h2
        id={id}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {title}
      </h2>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {cards.map((card) => {
          const tint = TINTS[card.tint];
          return (
            <Link
              key={card.href}
              href={card.href}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-transparent p-6 shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2",
                tint.card,
                tint.hoverBorder,
                tint.ring,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                    tint.icon,
                  )}
                >
                  <card.icon className="size-4" aria-hidden="true" />
                  {card.category}
                </span>
                {card.count !== null && (
                  <span className="rounded-full bg-background/70 px-3 py-1 text-sm font-bold tabular-nums text-foreground shadow-sm dark:bg-white/10 dark:shadow-none dark:ring-1 dark:ring-white/10">
                    {card.count}
                  </span>
                )}
              </div>

              <div className="mt-8 flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-heading text-2xl font-bold tracking-tight">
                    {card.label}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background/60 text-foreground/70 transition-all group-hover:bg-background group-hover:text-foreground group-hover:-translate-y-0.5 dark:bg-white/10 dark:group-hover:bg-white/20"
                  aria-hidden="true"
                >
                  <ArrowUpRight className="size-5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
