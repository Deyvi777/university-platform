import { publicMetadata } from "@/lib/seo";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { Contacto } from "@/components/landing/contacto";

export const metadata = publicMetadata({
  title: "Contacto — Certificate",
  description:
    "Contáctanos: formulario directo a WhatsApp, redes sociales, dirección en el Centro Comercial COSCENTER (Cochabamba, Bolivia) y ubicación en el mapa.",
  path: "/contacto",
});

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
