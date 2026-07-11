import {
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Presentation,
  ScrollText,
  Send,
  Share2,
  ShieldCheck,
  Tags,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type DashboardRole = "ADMIN" | "PROFESSOR" | "STUDENT";

/**
 * Clave de icono serializable. El `NavItem`/`NavSection` viaja de Server →
 * Client Components (layout → sidebar), y React no permite pasar
 * componentes/funciones por props en ese cruce. Por eso guardamos una clave
 * (string) y resolvemos el icono real de Lucide en el render con `NAV_ICONS`.
 */
export type NavIcon =
  | "home"
  | "programs"
  | "courses"
  | "categories"
  | "partners"
  | "team"
  | "users"
  | "social"
  | "admins"
  | "professors"
  | "students"
  | "notifications"
  | "send-notification"
  | "student-grades"
  | "kardex"
  | "enrollment-requests";

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  home: LayoutDashboard,
  programs: GraduationCap,
  courses: BookOpen,
  categories: Tags,
  partners: Building2,
  team: UsersRound,
  users: Users,
  social: Share2,
  admins: ShieldCheck,
  professors: Presentation,
  students: GraduationCap,
  notifications: Bell,
  "send-notification": Send,
  "student-grades": ClipboardList,
  kardex: ScrollText,
  "enrollment-requests": UserPlus,
};

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
};

/**
 * Grupo de navegación con encabezado opcional. Replica la agrupación de la home
 * del panel ("Personas" / "Gestión del sitio · Landing"). Cuando `title` es
 * `undefined`, el grupo se renderiza como items sueltos sin encabezado (p. ej.
 * "Inicio", que va arriba de las secciones). `icon` representa la sección
 * completa: se usa en el riel colapsado para condensar el grupo en un solo
 * icono cuando no caben los sub-items con etiqueta.
 *
 * Todo es serializable (strings); `icon` sigue siendo una clave, nunca un
 * componente de React — eso ya rompió antes la serialización Server→Client.
 */
export type NavSection = {
  title?: string;
  icon?: NavIcon;
  items: NavItem[];
};

/**
 * Un módulo dentro del árbol de programas del sidebar (PROFESSOR/STUDENT).
 * Forma **plana y serializable** (Server → Client): sin funciones ni
 * componentes. El enlace concreto lo arma el sidebar combinando `moduleHrefBase`
 * (derivado del rol en el layout) con el `id`.
 */
export type SidebarModule = {
  id: string;
  name: string;
  order: number;
};

/**
 * Un programa (curso) asignado, con sus módulos, para el árbol anidado del
 * sidebar. Serializable (objetos planos), por la misma razón que `NavSection`.
 */
export type SidebarProgram = {
  id: string;
  name: string;
  modules: SidebarModule[];
};

/**
 * Slug estable derivado del título de la sección. Es la clave compartida por (a)
 * el store de localStorage del acordeón (`dashboard:nav-section:<slug>`) y (b) los
 * `id`/`aria-controls`/`aria-labelledby` del encabezado-botón y su región de
 * items. Se deriva del título (en vez de guardarse en los datos) para que
 * `NavSection` siga 100% serializable Server→Client; el título es estable.
 */
export function sectionSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Item presente para cualquier rol autenticado. */
const HOME_ITEM: NavItem = {
  href: "/dashboard",
  label: "Inicio",
  icon: "home",
};

/** Item de notificaciones, visible para todos los roles (el ADMIN recibe los
 * avisos de correos de credenciales fallidos). */
const NOTIFICATIONS_ITEM: NavItem = {
  href: "/dashboard/notificaciones",
  label: "Notificaciones",
  icon: "notifications",
};

/** Item de kárdex, solo para estudiantes. */
const KARDEX_ITEM: NavItem = {
  href: "/dashboard/kardex",
  label: "Kárdex",
  icon: "kardex",
};

/**
 * Secciones de navegación visibles para cada rol. ADMIN ve grupos con
 * encabezado (igual que la home); PROFESSOR y STUDENT ven "Inicio",
 * "Notificaciones" y (solo STUDENT) "Kárdex". El **árbol de programas** anidado
 * (programa → módulos) NO vive aquí: lo renderiza el sidebar a partir de la prop
 * `programs` (ver `dashboard-sidebar.tsx`), porque `NavSection` es plano.
 */
export function navSectionsForRole(role: string | undefined): NavSection[] {
  if (role === "ADMIN") {
    return [
      // "Inicio" y "Notificaciones" sueltos, sin encabezado, arriba de las
      // secciones.
      { items: [HOME_ITEM, NOTIFICATIONS_ITEM] },
      {
        title: "Académico",
        icon: "courses",
        items: [
          {
            href: "/dashboard/cursos",
            label: "Programas",
            icon: "courses",
          },
          {
            href: "/dashboard/notas-estudiantes",
            label: "Notas de estudiantes",
            icon: "student-grades",
          },
        ],
      },
      {
        title: "Usuarios",
        icon: "users",
        items: [
          {
            href: "/dashboard/usuarios?rol=administrativos",
            label: "Administrativos",
            icon: "admins",
          },
          {
            href: "/dashboard/usuarios?rol=docentes",
            label: "Docentes",
            icon: "professors",
          },
          {
            href: "/dashboard/usuarios?rol=estudiantes",
            label: "Estudiantes",
            icon: "students",
          },
          {
            href: "/dashboard/solicitudes",
            label: "Solicitudes de inscripción",
            icon: "enrollment-requests",
          },
          {
            href: "/dashboard/notificaciones/enviar",
            label: "Enviar aviso",
            icon: "send-notification",
          },
        ],
      },
      {
        title: "Gestión del sitio",
        icon: "programs",
        items: [
          {
            href: "/dashboard/categorias",
            label: "Categorías",
            icon: "categories",
          },
          { href: "/dashboard/programas", label: "Programas", icon: "programs" },
          {
            href: "/dashboard/partners",
            label: "Instituciones",
            icon: "partners",
          },
          {
            href: "/dashboard/equipo",
            label: "Equipo",
            icon: "team",
          },
          {
            href: "/dashboard/configuracion",
            label: "Redes sociales",
            icon: "social",
          },
        ],
      },
    ];
  }
  if (role === "STUDENT") {
    // Dos grupos sin encabezado: "Inicio" arriba y el resto debajo. El sidebar
    // inserta el árbol de "Programas" ENTRE ambos grupos (ver `DashboardSidebar`).
    return [
      { items: [HOME_ITEM] },
      { items: [KARDEX_ITEM, NOTIFICATIONS_ITEM] },
    ];
  }
  // PROFESSOR: "Inicio" arriba, "Notificaciones" debajo; el árbol de "Programas"
  // se inserta entre ambos.
  return [{ items: [HOME_ITEM] }, { items: [NOTIFICATIONS_ITEM] }];
}
