import Image from "next/image";
import { getPartners, type Partner } from "@/lib/api/partners";

function LogoItem({
  partner,
  ariaHidden = false,
}: {
  partner: Partner;
  ariaHidden?: boolean;
}) {
  return (
    <li
      aria-hidden={ariaHidden}
      className="mx-8 flex shrink-0 items-center justify-center sm:mx-12"
    >
      <Image
        src={partner.logoUrl}
        alt={ariaHidden ? "" : partner.name}
        width={250}
        height={250}
        className="h-28 w-auto object-contain transition-transform duration-300 hover:scale-110 sm:h-32"
      />
    </li>
  );
}

export async function Partners() {
  let partners: Partner[] = [];
  try {
    partners = await getPartners();
  } catch {
    // Si el backend no responde, la sección simplemente no se muestra.
  }

  if (partners.length === 0) return null;

  return (
    <section
      id="instituciones-aliadas"
      className="scroll-mt-20 border-t border-white/5 bg-slate-950 py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium tracking-wide text-amber-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Instituciones aliadas
          </p>

          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Con el respaldo de nuestras{" "}
            <span className="text-white">instituciones aliadas</span>
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-200">
            Trabajamos junto a instituciones reconocidas que avalan y convalidan
            nuestros programas, garantizando la validez y la calidad de tu
            formación.
          </p>
        </div>
      </div>

      <div className="group relative mt-16 overflow-hidden py-4 sm:py-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ul className="animate-marquee flex w-max items-center group-hover:[animation-play-state:paused]">
          {partners.map((partner) => (
            <LogoItem key={partner.id} partner={partner} />
          ))}
          {/* Copia para el bucle continuo; oculta a lectores de pantalla. */}
          {partners.map((partner) => (
            <LogoItem key={`dup-${partner.id}`} partner={partner} ariaHidden />
          ))}
        </ul>
      </div>
    </section>
  );
}
