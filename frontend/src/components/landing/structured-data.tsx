export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // Los textos del catálogo son administrables: no deben cerrar el script.
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
