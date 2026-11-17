import type { Metadata } from "next";
import type { ProgramDetail } from "@/lib/api/programs";

// Un único origen para canónicas, redes y sitemap, incluso al entrar por www.
export const SITE_URL = "https://certificatebolivia.com.bo";
export const SITE_NAME = "Certificate Bolivia";

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

function summarize(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}

export function publicMetadata({
  title,
  description,
  path,
  image = "/landing/CTA-image.webp",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const summary = summarize(description);
  const url = absoluteUrl(path);
  const images = [{ url: absoluteUrl(image), alt: title }];

  return {
    title,
    description: summary,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_BO",
      siteName: SITE_NAME,
      title,
      description: summary,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: summary,
      images,
    },
  };
}

export const organization = {
  "@type": "EducationalOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/landing/logo.webp"),
  telephone: "+59177933003",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Calle Jordán N° 333, Edificio COSCENTER, 1° piso, Oficina 7B",
    addressLocality: "Cochabamba",
    addressCountry: "BO",
  },
};

export function programDescription(program: ProgramDetail) {
  return (
    program.objective?.trim() ||
    `${program.title} en Certificate Bolivia. Consulta el plan de estudios, modalidad, requisitos e inversión del programa.`
  );
}

export function programStructuredData(program: ProgramDetail) {
  const url = absoluteUrl(`/programas/${program.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        "@id": `${url}#course`,
        name: program.title,
        description: programDescription(program),
        url,
        image: absoluteUrl(program.flyerUrl),
        provider: organization,
        ...(program.modality
          ? {
              hasCourseInstance: {
                "@type": "CourseInstance",
                courseMode: program.modality,
                ...(program.startDate ? { startDate: program.startDate } : {}),
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: program.title, item: url },
        ],
      },
    ],
  };
}
