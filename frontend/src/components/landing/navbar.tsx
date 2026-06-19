"use client";

import Image from "next/image";
import Link from "next/link";
import { ScrollLink } from "./scroll-link";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/lib/api/programs";

const navLinks = [
  { href: "/nosotros", label: "Nosotros" },
  { href: "/#contacto", label: "Contacto" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-slate-950/85 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Certificate — Inicio">
          <Image
            src="/landing/logo.webp"
            alt="Certificate — Escuela Multidisciplinaria de Postgrado"
            width={150}
            height={64}
            priority
            className="h-12 w-auto"
          />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          <li className="group relative">
            <ScrollLink
              href="/#programas"
              className="flex items-center gap-1 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              Programas
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
            </ScrollLink>
            
            <div className="absolute left-0 top-full mt-4 w-56 origin-top-left rounded-xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-lg transition-all duration-300 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
              <div className="absolute -top-4 left-0 h-4 w-full" />
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/?categoria=${category.slug}#programas`}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </li>
          {navLinks.map((link) => (
            <li key={link.href}>
              <ScrollLink
                href={link.href}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                {link.label}
              </ScrollLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-full border border-white/25 px-5 py-2 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10"
          >
            Acceder
          </Link>
          <ScrollLink
            href="/#programas"
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300"
          >
            Inscríbete
          </ScrollLink>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-white lg:hidden"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 backdrop-blur-md lg:hidden">
          <ul className="space-y-1 px-6 py-4">
            <li>
              <div className="block rounded-md px-3 py-2 text-base font-medium text-white">
                Programas
              </div>
              <ul className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/?categoria=${category.slug}#programas`}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            {navLinks.map((link) => (
              <li key={link.href}>
                <ScrollLink
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <div onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </div>
                </ScrollLink>
              </li>
            ))}
            <li className="flex gap-3 pt-3">
              <Link
                href="/login"
                className="flex-1 rounded-full border border-white/25 px-5 py-2 text-center text-sm font-medium text-white"
              >
                Acceder
              </Link>
              <ScrollLink
                href="/#programas"
                className="flex-1 rounded-full bg-amber-400 px-5 py-2 text-center text-sm font-semibold text-slate-950"
              >
                <div onClick={() => setMenuOpen(false)}>
                  Inscríbete
                </div>
              </ScrollLink>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
