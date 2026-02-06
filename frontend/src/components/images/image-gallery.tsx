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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="aspect-square w-full" />
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((img) => (
        <ImageCard key={img.image_id} image={img} />
      ))}
    </div>
  );
}
