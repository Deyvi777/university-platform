/**
 * Feriados nacionales de Bolivia (fijos + movibles dependientes de Pascua).
 * Se calculan en el cliente porque son deterministas por año y no dependen del
 * usuario. Cada feriado es `{ date: "YYYY-MM-DD", name }`.
 *
 * Movibles (basados en el Domingo de Pascua):
 *  - Lunes y Martes de Carnaval: 48 y 47 días antes de Pascua.
 *  - Viernes Santo: 2 días antes de Pascua.
 *  - Corpus Christi: 60 días después de Pascua.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function iso(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

/** Domingo de Pascua (algoritmo gregoriano anónimo / Meeus) en UTC. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=marzo, 4=abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

export interface Holiday {
  date: string;
  name: string;
}

/** Lista de feriados nacionales de Bolivia para un año dado. */
export function boliviaHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);
  const fixed: Holiday[] = [
    { date: `${year}-01-01`, name: "Año Nuevo" },
    { date: `${year}-01-22`, name: "Día del Estado Plurinacional" },
    { date: `${year}-05-01`, name: "Día del Trabajo" },
    { date: `${year}-06-21`, name: "Año Nuevo Andino Amazónico" },
    { date: `${year}-08-06`, name: "Día de la Independencia" },
    { date: `${year}-11-02`, name: "Día de los Difuntos" },
    { date: `${year}-12-25`, name: "Navidad" },
  ];
  const movable: Holiday[] = [
    { date: iso(addDays(easter, -48)), name: "Lunes de Carnaval" },
    { date: iso(addDays(easter, -47)), name: "Martes de Carnaval" },
    { date: iso(addDays(easter, -2)), name: "Viernes Santo" },
    { date: iso(addDays(easter, 60)), name: "Corpus Christi" },
  ];
  return [...fixed, ...movable].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Mapa "YYYY-MM-DD" → nombre del feriado para los años indicados (normalmente
 * el año visible y sus vecinos, por si el mes muestra días de otro año).
 */
export function holidayMap(years: number[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const y of years) {
    for (const h of boliviaHolidays(y)) map.set(h.date, h.name);
  }
  return map;
}
