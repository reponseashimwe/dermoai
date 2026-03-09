"use client";

import { useState } from "react";
import { useConsultationImages, useUpdateImageConsent, useDeleteImage } from "@/hooks/use-images";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageDetailModal } from "./image-detail-modal";
import { ImageIcon, Trash2 } from "lucide-react";
import { formatConditionName, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  consultationId: string;
  /** When false, per-image consent checkboxes are hidden (consent is set at consultation level). */
  showConsentCheckboxes?: boolean;
  /** When set, the detail modal opens for this image (e.g. after upload). Clear on close. */
  openDetailImageId?: string | null;
  /** Called when the detail modal is closed. Use to clear openDetailImageId. */
  onCloseDetail?: () => void;
}

export function ImageGallery({
  consultationId,
  showConsentCheckboxes = true,
  openDetailImageId = null,
  onCloseDetail,
}: ImageGalleryProps) {
  const { data: images, isLoading } = useConsultationImages(consultationId);
  const updateConsent = useUpdateImageConsent();
  const deleteImg = useDeleteImage();
  const [detailImageId, setDetailImageId] = useState<string | null>(null);
  const imageIdToShow = openDetailImageId ?? detailImageId;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
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
    <>
      <ul className="space-y-2">
        {images.map((img) => (
          <li
            key={img.image_id}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-[#f7f5f3] p-2.5 cursor-pointer hover:bg-slate-100/80 transition-colors"
            onClick={() => setDetailImageId(img.image_id)}
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-200">
              <img
                src={img.image_url}
                alt="Scan"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {img.predicted_condition
                  ? formatConditionName(img.predicted_condition)
                  : "Processing..."}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">{formatDate(img.uploaded_at)}</span>
                {img.confidence !== null && (
                  <>
                    <span className="text-slate-300">·</span>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className="h-1 flex-1 max-w-20 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            img.confidence >= 0.45 ? "bg-primary-500" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.min(100, img.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-slate-600 shrink-0">{(img.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteImg.mutate(img.image_id);
              }}
              className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-red-600 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {showConsentCheckboxes && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={img.consent_to_reuse}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateConsent.mutate({
                        imageId: img.image_id,
                        consent: e.target.checked,
                      });
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600"
                  />
                  <span className="text-slate-600">Consent for reuse in model improvement</span>
                </label>
              </div>
            )}
          </li>
        ))}
      </ul>
      <ImageDetailModal
        imageId={imageIdToShow}
        open={imageIdToShow !== null}
        onClose={() => {
          setDetailImageId(null);
          onCloseDetail?.();
        }}
        hideActions
      />
    </>
  );
}
