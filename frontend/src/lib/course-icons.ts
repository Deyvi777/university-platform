import {
  Atom,
  BookMarked,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Calculator,
  Camera,
  Code,
  Cpu,
  Dna,
  FlaskConical,
  Gavel,
  Globe,
  GraduationCap,
  Hammer,
  HeartPulse,
  Landmark,
  Languages,
  Leaf,
  LineChart,
  type LucideIcon,
  Megaphone,
  Microscope,
  Music,
  Palette,
  PenTool,
  Pill,
  Plane,
  Scale,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Truck,
  Users,
  Utensils,
  Wrench,
} from "lucide-react";

/**
 * Catálogo de iconos predefinidos para los programas/cursos. La clave (string)
 * es lo que se persiste en `Course.icon`; el valor es el componente de lucide a
 * renderizar en las tarjetas. Pensado para áreas de estudio de un postgrado
 * (derecho, salud, negocios, tecnología, etc.). Para agregar uno nuevo, suma una
 * entrada aquí con su etiqueta en español.
 */
export const COURSE_ICONS: Record<string, { label: string; Icon: LucideIcon }> =
  {
    scale: { label: "Derecho / Jurídica", Icon: Scale },
    gavel: { label: "Justicia / Penal", Icon: Gavel },
    stethoscope: { label: "Salud / Medicina", Icon: Stethoscope },
    "heart-pulse": { label: "Enfermería / Clínica", Icon: HeartPulse },
    pill: { label: "Farmacia", Icon: Pill },
    brain: { label: "Psicología", Icon: Brain },
    briefcase: { label: "Negocios / Administración", Icon: Briefcase },
    "line-chart": { label: "Finanzas / Economía", Icon: LineChart },
    calculator: { label: "Contabilidad", Icon: Calculator },
    megaphone: { label: "Marketing / Comunicación", Icon: Megaphone },
    landmark: { label: "Gestión pública", Icon: Landmark },
    users: { label: "Recursos humanos", Icon: Users },
    cpu: { label: "Tecnología / Sistemas", Icon: Cpu },
    code: { label: "Programación / Software", Icon: Code },
    "shield-check": { label: "Seguridad / Ciberseguridad", Icon: ShieldCheck },
    wrench: { label: "Ingeniería", Icon: Wrench },
    hammer: { label: "Construcción", Icon: Hammer },
    "building-2": { label: "Arquitectura", Icon: Building2 },
    truck: { label: "Logística / Transporte", Icon: Truck },
    "flask-conical": { label: "Ciencias / Química", Icon: FlaskConical },
    microscope: { label: "Investigación", Icon: Microscope },
    atom: { label: "Física", Icon: Atom },
    dna: { label: "Biotecnología", Icon: Dna },
    leaf: { label: "Medio ambiente", Icon: Leaf },
    sprout: { label: "Agronomía", Icon: Sprout },
    globe: { label: "Relaciones internacionales", Icon: Globe },
    languages: { label: "Idiomas", Icon: Languages },
    palette: { label: "Arte / Diseño", Icon: Palette },
    "pen-tool": { label: "Diseño gráfico", Icon: PenTool },
    camera: { label: "Fotografía / Audiovisual", Icon: Camera },
    music: { label: "Música", Icon: Music },
    utensils: { label: "Gastronomía", Icon: Utensils },
    plane: { label: "Turismo / Hotelería", Icon: Plane },
    "book-marked": { label: "Educación / Pedagogía", Icon: BookMarked },
    "book-open": { label: "Humanidades", Icon: BookOpen },
    "graduation-cap": { label: "General / Postgrado", Icon: GraduationCap },
  };

/** Clave de icono por defecto cuando un curso no tiene uno asignado. */
export const DEFAULT_COURSE_ICON = "graduation-cap";

/** Lista ordenada para el selector del formulario. */
export const COURSE_ICON_OPTIONS = Object.entries(COURSE_ICONS).map(
  ([key, { label, Icon }]) => ({ key, label, Icon }),
);
