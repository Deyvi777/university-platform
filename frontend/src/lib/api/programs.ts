const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export interface ProgramCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProgramSummary {
  id: string;
  slug: string;
  title: string;
  category: ProgramCategory;
  flyerUrl: string;
  modality: string;
  startDate: string;
  duration: string;
}

export interface ProgramModule {
  id: string;
  order: number;
  name: string;
  contents: string[];
}

export interface ProgramTeacher {
  id: string;
  fullName: string;
  credentials: string;
  photoUrl: string | null;
}

export interface ProgramDetail extends ProgramSummary {
  objective: string;
  targetAudience: string;
  schedule: string;
  requirements: string[];
  // Prisma Decimal se serializa como string en JSON
  enrollmentFee: string;
  totalCost: string;
  currency: string;
  paymentFacilities: string | null;
  modules: ProgramModule[];
  teachers: ProgramTeacher[];
}

export async function getPrograms(): Promise<ProgramSummary[]> {
  const res = await fetch(`${API_URL}/programs`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Error al obtener programas: ${res.status}`);
  }
  return res.json();
}

export async function getCategories(): Promise<ProgramCategory[]> {
  const res = await fetch(`${API_URL}/categories`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Error al obtener categorías: ${res.status}`);
  }
  return res.json();
}

export async function getProgramBySlug(
  slug: string,
): Promise<ProgramDetail | null> {
  const res = await fetch(`${API_URL}/programs/${encodeURIComponent(slug)}`, {
    next: { revalidate: 300 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Error al obtener el programa: ${res.status}`);
  }
  return res.json();
}

export function formatStartDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

export function formatAmount(amount: string): string {
  return Number(amount).toLocaleString("es-BO");
}
