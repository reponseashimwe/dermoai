"use client";

import { useConsultationImages } from "@/hooks/use-images";
import { ImageCard } from "./image-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageIcon } from "lucide-react";

interface ImageGalleryProps {
  consultationId: string;
}

export function ImageGallery({ consultationId }: ImageGalleryProps) {
  const { data: images, isLoading } = useConsultationImages(consultationId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!images?.length) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-10 w-10" />}
        title="No images yet"
        description="Upload images for this consultation to get AI predictions."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {images.map((img) => (
        <li key={img.image_id}>
          <ImageCard image={img} variant="row" />
        </li>
      ))}
    </ul>
  );
}
