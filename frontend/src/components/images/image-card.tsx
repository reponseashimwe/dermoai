"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatConditionName, formatConfidence } from "@/lib/utils";
import { useDeleteImage } from "@/hooks/use-images";
import { cn } from "@/lib/utils";
import type { Image } from "@/types/api";

interface ImageCardProps {
  image: Image;
  variant?: "card" | "row";
  className?: string;
}

export function ImageCard({ image, variant = "card", className }: ImageCardProps) {
  const deleteImg = useDeleteImage();

  if (variant === "row") {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2",
          className
        )}
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
          <img
            src={image.image_url}
            alt="Consultation image"
            className="h-full w-full object-cover"
          />
          {image.source === "quick_scan" && (
            <Badge className="absolute left-0.5 top-0.5 text-[10px]" variant="info">
              Quick
            </Badge>
          )}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          {image.predicted_condition ? (
            <p className="font-medium text-slate-900">
              {formatConditionName(image.predicted_condition)}
            </p>
          ) : (
            <p className="text-slate-500">No prediction yet</p>
          )}
          {image.confidence !== null && (
            <p className="text-xs text-slate-500">
              {formatConfidence(image.confidence)}
            </p>
          )}
        </div>
        <button
          onClick={() => deleteImg.mutate(image.image_id)}
          className="shrink-0 rounded p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-red-600 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

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
