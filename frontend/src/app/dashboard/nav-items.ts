import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  Presentation,
  Share2,
  ShieldCheck,
  Tags,
  Users,
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
  | "categories"
  | "partners"
  | "users"
  | "social"
  | "admins"
  | "professors"
  | "students";

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  home: LayoutDashboard,
  programs: GraduationCap,
  categories: Tags,
  partners: Building2,
  users: Users,
  social: Share2,
  admins: ShieldCheck,
  professors: Presentation,
  students: GraduationCap,
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

/**
 * Secciones de navegación visibles para cada rol. ADMIN ve grupos con
 * encabezado (igual que la home); PROFESSOR y STUDENT solo ven "Inicio" por
 * ahora (sus funcionalidades llegarán pronto) — no se muestran acciones que el
 * rol no puede ejecutar.
 */
export function navSectionsForRole(role: string | undefined): NavSection[] {
  if (role === "ADMIN") {
    return [
      // "Inicio" suelto, sin encabezado, arriba de las secciones.
      { items: [HOME_ITEM] },
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
            href: "/dashboard/configuracion",
            label: "Redes sociales",
            icon: "social",
          },
        ],
      },
    ];
  }
  return [{ items: [HOME_ITEM] }];
}

/**
 * Aplana las secciones a items individuales, excluyendo el "Inicio" (href base
 * del panel). Consumido por los "Accesos rápidos" del panel de perfil, que no
 * agrupa por sección.
 */
export function quickLinksFromSections(sections: NavSection[]): NavItem[] {
  return sections
    .flatMap((section) => section.items)
    .filter((item) => item.href !== "/dashboard");
}
