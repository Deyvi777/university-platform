import { Beneficios } from "@/components/landing/beneficios";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Partners } from "@/components/landing/partners";
import { Programs } from "@/components/landing/programs";
import { RestoreLandingScroll } from "@/components/landing/restore-landing-scroll";
import { StructuredData } from "@/components/landing/structured-data";
import { organization, publicMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata = publicMetadata({
  title: "Postgrados en Bolivia: maestrías y diplomados | Certificate",
  description:
    "Explora maestrías y diplomados en Bolivia con Certificate. Consulta programas de postgrado, modalidades, requisitos e inversión. Sede en Cochabamba.",
  path: "/",
});

export default function Home() {
  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@graph": [
            organization,
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: SITE_NAME,
              url: SITE_URL,
              inLanguage: "es-BO",
              publisher: { "@id": organization["@id"] },
            },
          ],
        }}
      />
      <RestoreLandingScroll />
      <Navbar />
      <main>
        <Hero />
        <Partners />
        <Programs />
        <Beneficios />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
