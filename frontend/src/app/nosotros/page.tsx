import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { Nosotros } from "@/components/landing/nosotros";

export const metadata: Metadata = {
  title: "Nosotros — Certificate",
  description:
    "Escuela Multidisciplinaria de Postgrado y Formación Continua con sede en Cochabamba, Bolivia. Conoce nuestra misión, visión y valores.",
};

export default function NosotrosPage() {
  return (
    <>
      <Navbar />
      <main>
        <Nosotros />
      </main>
      <Footer />
    </>
  );
}
