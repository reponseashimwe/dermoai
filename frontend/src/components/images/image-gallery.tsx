"use client";

import { useConsultationImages, useUpdateImageConsent } from "@/hooks/use-images";
import { ImageCard } from "./image-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageIcon } from "lucide-react";

interface ImageGalleryProps {
  consultationId: string;
}

export function ImageGallery({ consultationId }: ImageGalleryProps) {
  const { data: images, isLoading } = useConsultationImages(consultationId);
  const updateConsent = useUpdateImageConsent();

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
        <li key={img.image_id} className="rounded-lg border border-slate-200 bg-white p-2">
          <ImageCard image={img} variant="row" />
          <div className="mt-2 border-t border-slate-200 pt-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={img.consent_to_reuse}
                onChange={(e) => {
                  updateConsent.mutate({
                    imageId: img.image_id,
                    consent: e.target.checked,
                  });
                }}
                className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600"
              />
              <span className="text-slate-600">Allow for model improvement</span>
            </label>
          </div>
        </li>
      ))}
    </ul>
  );
}
