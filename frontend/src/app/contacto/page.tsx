import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { Contacto } from "@/components/landing/contacto";

export const metadata: Metadata = {
  title: "Contacto — Certificate",
  description:
    "Contáctanos: formulario directo a WhatsApp, redes sociales, dirección en el Centro Comercial COSCENTER (Cochabamba, Bolivia) y ubicación en el mapa.",
};

export default function ContactoPage() {
  return (
    <>
      <Navbar />
      <main>
        <Contacto />
      </main>
      <Footer />
    </>
  );
}
