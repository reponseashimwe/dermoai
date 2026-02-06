"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatConditionName, formatConfidence } from "@/lib/utils";
import { useDeleteImage } from "@/hooks/use-images";
import { cn } from "@/lib/utils";
import type { Image } from "@/types/api";

interface ImageCardProps {
  image: Image;
  className?: string;
}

export function ImageCard({ image, className }: ImageCardProps) {
  const deleteImg = useDeleteImage();

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-slate-200",
        className
      )}
    >
      <img
        src={image.image_url}
        alt="Consultation image"
        className="aspect-square w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        {image.predicted_condition && (
          <p className="text-xs font-medium text-white">
            {formatConditionName(image.predicted_condition)}
          </p>
        )}
        {image.confidence !== null && (
          <p className="text-xs text-white/80">
            {formatConfidence(image.confidence)}
          </p>
        )}
      </div>
      <button
        onClick={() => deleteImg.mutate(image.image_id)}
        className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-white"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-600" />
      </button>
      {image.source === "quick_scan" && (
        <Badge className="absolute left-2 top-2" variant="info">
          Quick Scan
        </Badge>
      )}
    </div>
  );
}
