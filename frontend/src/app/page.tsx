import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Partners } from "@/components/landing/partners";
import { Programs } from "@/components/landing/programs";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Programs />
        <Partners />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
