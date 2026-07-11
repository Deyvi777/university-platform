import { requireAdmin } from "@/lib/auth-guard";
import { listAdminGallery } from "@/lib/api/admin";
import { GalleryList } from "@/app/dashboard/galeria/gallery-list";
import { GalleryUpload } from "@/app/dashboard/galeria/gallery-upload";

export default async function GalleryAdminPage() {
  await requireAdmin();
  const items = await listAdminGallery();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Galería</h1>
          <p className="mt-1 text-muted-foreground">
            {items.length}{" "}
            {items.length === 1 ? "elemento" : "elementos"} en la galería de la
            landing. Arrastra para reordenar; ese orden es el del carrusel.
          </p>
        </div>
        <GalleryUpload />
      </div>

      <GalleryList items={items} />
    </div>
  );
}
