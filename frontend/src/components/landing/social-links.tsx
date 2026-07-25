import { ArrowUpRight } from "lucide-react";
import { SOCIAL_DEFS } from "./social-defs";
import type { SiteSocialLinks } from "@/lib/api/settings";

export function hasConfiguredSocialLinks(settings: SiteSocialLinks): boolean {
  return SOCIAL_DEFS.some((social) => Boolean(settings[social.key]));
}

export function SocialLinks({
  settings,
  variant,
}: {
  settings: SiteSocialLinks;
  variant: "footer" | "contact";
}) {
  const socials = SOCIAL_DEFS.flatMap((social) => {
    const href = settings[social.key];
    return href ? [{ ...social, href }] : [];
  });

  if (socials.length === 0) return null;

  return (
    <ul
      aria-label="Redes sociales de Certificate Bolivia"
      className={
        variant === "contact"
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2"
          : "flex flex-wrap gap-2.5"
      }
    >
      {socials.map((social) => (
        <li key={social.key}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visitar Certificate Bolivia en ${social.label}`}
            className={`group flex items-center border border-white/10 bg-white/[0.045] text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/80 ${social.accent} ${
              variant === "contact"
                ? "min-h-20 gap-3 rounded-2xl p-3.5"
                : "gap-2 rounded-full py-2 pl-2 pr-3"
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/10 ${social.iconSurface} ${
                variant === "contact" ? "size-11" : "size-9"
              }`}
            >
              <svg
                className={variant === "contact" ? "size-5" : "size-4"}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={social.path} />
              </svg>
            </span>
            <span
              className={
                variant === "contact"
                  ? "min-w-0 flex-1 text-sm font-semibold"
                  : "text-xs font-semibold sm:text-sm"
              }
            >
              {social.label}
            </span>
            {variant === "contact" && (
              <ArrowUpRight
                className="size-4 shrink-0 text-slate-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-current"
                aria-hidden="true"
              />
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
