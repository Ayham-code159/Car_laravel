import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import type { Car } from "../../types/api";
import { CarImage } from "./CarCard";
import { Overlay } from "../../components/ui/Overlay";

export function CarImageGallery({ car }: { car: Car }) {
  const images = [...car.images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order,
  );
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const name = `${car.brand.name} ${car.model}`;
  const current = images[index]?.url || car.primaryImageUrl;
  const move = (n: number) =>
    setIndex((i) => (i + n + images.length) % images.length);
  const keys = (event: React.KeyboardEvent) => {
    if (images.length < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  };
  return (
    <div
      className="car-gallery"
      onKeyDown={keys}
      role="region"
      aria-label={`${name} photographs`}
    >
      <div className="gallery-main">
        <CarImage
          key={current}
          src={current}
          alt={`${name}, view ${index + 1}`}
          priority
        />
        {current && (
          <Overlay
            open={open}
            onOpenChange={setOpen}
            title={name}
            description={`Vehicle photograph ${index + 1} of ${images.length || 1}`}
            trigger={
              <button
                className="icon-button expand-button"
                aria-label="Enlarge vehicle image"
              >
                <Expand size={19} />
              </button>
            }
          >
            <div className="lightbox" onKeyDown={keys}>
              <CarImage
                key={current}
                src={current}
                alt={`${name}, view ${index + 1}`}
              />
              {images.length > 1 && (
                <div className="gallery-controls">
                  <button
                    className="icon-button"
                    onClick={() => move(-1)}
                    aria-label="Previous image"
                  >
                    <ChevronLeft />
                  </button>
                  <span>
                    {index + 1} / {images.length}
                  </span>
                  <button
                    className="icon-button"
                    onClick={() => move(1)}
                    aria-label="Next image"
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>
          </Overlay>
        )}
        {images.length > 1 && (
          <div className="gallery-controls">
            <button
              className="icon-button"
              onClick={() => move(-1)}
              aria-label="Previous image"
            >
              <ChevronLeft />
            </button>
            <span aria-live="polite">
              {index + 1} / {images.length}
            </span>
            <button
              className="icon-button"
              onClick={() => move(1)}
              aria-label="Next image"
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbnails">
          {images.map((img, i) => (
            <button
              key={img.id}
              className={index === i ? "selected" : ""}
              onClick={() => setIndex(i)}
              aria-label={`Show photograph ${i + 1}`}
              aria-pressed={index === i}
            >
              <CarImage
                src={img.thumbnailUrl}
                alt={`${name}, thumbnail ${i + 1}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
