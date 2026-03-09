"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchClient } from "@/lib/api/client";
import { ImageDetailContent } from "./image-detail-content";
import type { Image } from "@/types/api";

interface ImageDetailModalProps {
  imageId: string | null;
  open: boolean;
  onClose: () => void;
  /** When true, hide action buttons (e.g. when viewing image inside a consultation). */
  hideActions?: boolean;
  /** Optional content rendered below the image details (e.g. review form). */
  footer?: React.ReactNode;
  /** When true, hide "About condition" and "Recommended action" sections for a leaner view. */
  hideConditionInfo?: boolean;
  /** When true, show explainability metrics in a collapsed disclosure and emphasize form (review mode). */
  reviewMode?: boolean;
}

export function ImageDetailModal({
  imageId,
  open,
  onClose,
  hideActions = false,
  footer,
  hideConditionInfo = false,
  reviewMode = false,
}: ImageDetailModalProps) {
  const [image, setImage] = useState<Image | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && imageId) {
      setLoading(true);
      setImage(null);
      fetchClient<Image>(`/api/images/${imageId}?include_gradcam=true`)
        .then((data) => {
          setImage(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setImage(null);
    }
  }, [imageId, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Image details"
      className="max-w-5xl"
    >
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Skeleton className="h-80 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : image ? (
        <>
          <ImageDetailContent
            image={image}
            hideActions={hideActions}
            hideAboutCondition={hideConditionInfo}
            hideRecommendedAction={hideConditionInfo}
            explainabilityMetrics={reviewMode ? "disclosure" : "visible"}
          />
          {footer ? (
            <div
              className="mt-6 rounded-xl border-2 border-primary-200 bg-primary-50/50 p-5"
              role="region"
              aria-label="Review and classify"
            >
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Your classification</h3>
              {footer}
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-center text-slate-500 py-8">No image data</p>
      )}
    </Modal>
  );
}
