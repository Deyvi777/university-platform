import { Beneficios } from "@/components/landing/beneficios";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Partners } from "@/components/landing/partners";
import { Programs } from "@/components/landing/programs";
import { RestoreLandingScroll } from "@/components/landing/restore-landing-scroll";

export default function Home() {
  return (
    <>
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
