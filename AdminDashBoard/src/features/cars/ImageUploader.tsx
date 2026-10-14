import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CarImage, ConfirmDialog, ErrorNotice } from "@/components/shared";
import { carApi } from "@/lib/api/services";
import { useInvalidate } from "@/hooks/use-data";
import type { Car, Media } from "@/types/api";
const BATCH = Number(import.meta.env.VITE_IMAGE_BATCH_LIMIT) || 6;
const TOTAL = Number(import.meta.env.VITE_IMAGE_TOTAL_LIMIT) || 12;
const MB = Number(import.meta.env.VITE_IMAGE_MAX_MB) || 5;
export async function validateImages(files: File[], existing: number) {
  if (!files.length) throw new Error("Select at least one image.");
  if (files.length > BATCH)
    throw new Error(`Upload at most ${BATCH} images per batch.`);
  if (files.length + existing > TOTAL)
    throw new Error(`A vehicle can have at most ${TOTAL} images.`);
  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw new Error(`${file.name}: use JPEG, PNG or WebP.`);
    if (file.size > MB * 1024 * 1024)
      throw new Error(`${file.name}: maximum size is ${MB} MB.`);
    const bitmap = await createImageBitmap(file).catch(() => {
      throw new Error(`${file.name}: the image could not be decoded.`);
    });
    const invalid = bitmap.width > 6000 || bitmap.height > 6000;
    bitmap.close();
    if (invalid)
      throw new Error(`${file.name}: maximum dimensions are 6000 × 6000.`);
  }
}
export default function ImageUploader({ car }: { car?: Car }) {
  const input = useRef<HTMLInputElement>(null);
  const invalidate = useInvalidate();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [remove, setRemove] = useState<Media | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      if (!car) throw new Error("Save the vehicle first.");
      await validateImages(files, car.images.length);
      const next = files.map((f) => ({
        url: URL.createObjectURL(f),
        name: f.name,
      }));
      setPreviews(next);
      try {
        return await carApi.upload(car.id, files, setProgress);
      } finally {
        next.forEach((p) => URL.revokeObjectURL(p.url));
        setPreviews([]);
      }
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Images uploaded.");
      setProgress(0);
    },
    onError: setError,
  });
  const modify = useMutation({
    mutationFn: async ({
      action,
      media,
    }: {
      action: "primary" | "delete" | "left" | "right";
      media: Media;
    }) => {
      if (!car) return;
      if (action === "primary") return carApi.primaryImage(car.id, media.id);
      if (action === "delete") return carApi.deleteImage(car.id, media.id);
      const order = [...car.images]
        .sort((a, b) => a.order - b.order)
        .map((m) => m.id);
      const index = order.indexOf(media.id);
      const target = index + (action === "left" ? -1 : 1);
      [order[index], order[target]] = [order[target], order[index]];
      return carApi.orderImages(car.id, order);
    },
    onSuccess: async () => {
      await invalidate();
      setRemove(null);
      toast.success("Image gallery updated.");
    },
    onError: setError,
  });
  const busy = upload.isPending || modify.isPending;
  const accept = (files: File[]) => {
    if (busy) return;
    setError(null);
    setProgress(0);
    upload.mutate(files);
  };
  const images = [...(car?.images || [])].sort((a, b) => a.order - b.order);
  return (
    <section className="panel form-section">
      <div className="section-heading">
        <span className="section-number">05</span>
        <div>
          <h2>Vehicle gallery</h2>
          <p>Give each vehicle the presentation it deserves.</p>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          {images.length} / {TOTAL}
        </span>
      </div>
      {!car ? (
        <div className="upload-placeholder">
          <ImagePlus size={28} />
          <h3>Your gallery starts here</h3>
          <p>
            Save this vehicle to unlock image uploads, primary selection, and
            ordering.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`upload-zone ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              accept(Array.from(e.dataTransfer.files));
            }}
          >
            <UploadCloud size={28} />
            <h3>Make a lasting first impression.</h3>
            <p>Drag images here, or browse your files.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => input.current?.click()}
              disabled={busy || images.length >= TOTAL}
            >
              <ImagePlus size={16} />{" "}
              {upload.isPending ? "Uploading…" : "Choose images"}
            </Button>
            <span className="field-hint">
              JPEG, PNG, WebP · Up to {MB} MB each · {BATCH} per upload · Max
              6000 × 6000
            </span>
            <input
              ref={input}
              type="file"
              aria-label="Upload vehicle images"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                accept(Array.from(e.target.files || []));
                e.target.value = "";
              }}
            />
          </div>
          {upload.isPending && (
            <div
              className="upload-progress"
              role="progressbar"
              aria-label="Image upload progress"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div style={{ width: `${progress}%` }} />
              <span>
                {progress === 100
                  ? "Processing images…"
                  : `Uploading ${progress}%`}
              </span>
            </div>
          )}
          <ErrorNotice error={error} />
          <div className="image-gallery">
            {images.map((media, index) => (
              <div className="gallery-card" key={media.id}>
                <a href={media.url} target="_blank" rel="noreferrer">
                  <CarImage
                    url={media.thumbnailUrl}
                    alt={`${car.brand.name} ${car.model}, image ${index + 1}`}
                  />
                </a>
                {media.isPrimary && (
                  <span className="primary-label">
                    <Star size={12} fill="currentColor" /> PRIMARY
                  </span>
                )}
                <div className="gallery-controls">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move image ${index + 1} earlier`}
                    disabled={busy || index === 0}
                    onClick={() => modify.mutate({ action: "left", media })}
                  >
                    <ArrowLeft size={15} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Move image ${index + 1} later`}
                    disabled={busy || index === images.length - 1}
                    onClick={() => modify.mutate({ action: "right", media })}
                  >
                    <ArrowRight size={15} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Set image ${index + 1} as primary`}
                    disabled={busy || media.isPrimary}
                    onClick={() => modify.mutate({ action: "primary", media })}
                  >
                    {media.isPrimary ? <Check size={15} /> : <Star size={15} />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove image ${index + 1}`}
                    disabled={busy}
                    onClick={() => {
                      modify.reset();
                      setRemove(media);
                    }}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
            {previews.map((p) => (
              <div key={p.url} className="gallery-card opacity-60">
                <CarImage url={p.url} alt={`Uploading ${p.name}`} />
              </div>
            ))}
          </div>
          <ConfirmDialog
            open={!!remove}
            onOpenChange={(v) => {
              if (!v) setRemove(null);
            }}
            title="Remove this image?"
            description="The image will be permanently deleted. If it is the primary image, the next image becomes primary."
            destructive
            confirmLabel="Remove image"
            pending={modify.isPending}
            error={modify.error}
            onConfirm={() =>
              remove && modify.mutate({ action: "delete", media: remove })
            }
          />
        </>
      )}
    </section>
  );
}
