const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export type CallQuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TEXT"
  | "FILE";

export interface CallQuestion {
  id: string;
  order: number;
  type: CallQuestionType;
  prompt: string;
  description: string | null;
  required: boolean;
  options: string[];
}

export interface CallSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string | null;
  opensAt: string | null;
  closesAt: string | null;
  _count: { questions: number };
}

export interface CallDetail extends Omit<CallSummary, "_count"> {
  description: string | null;
  questions: CallQuestion[];
  isOpen: boolean;
}

export interface CallUploadedFile {
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface CallApplicationAnswerPayload {
  questionId: string;
  textValue?: string | null;
  selectedOptions: string[];
  files: CallUploadedFile[];
}

export async function getCalls(): Promise<CallSummary[]> {
  const response = await fetch(`${API_URL}/calls`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) throw new Error("No se pudieron cargar las convocatorias");
  return response.json();
}

export async function getCallBySlug(slug: string): Promise<CallDetail | null> {
  const response = await fetch(`${API_URL}/calls/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("No se pudo cargar la convocatoria");
  return response.json();
}

export function formatCallDate(value: string): string {
  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/La_Paz",
  }).format(new Date(value));
}

export function callStatus(call: Pick<CallSummary, "opensAt" | "closesAt">) {
  const now = Date.now();
  if (call.opensAt && new Date(call.opensAt).getTime() > now) return "PRÓXIMA";
  if (call.closesAt && new Date(call.closesAt).getTime() < now)
    return "CERRADA";
  return "ABIERTA";
}
