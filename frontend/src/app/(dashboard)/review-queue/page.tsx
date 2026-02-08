"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { useUnreviewedImages, useUpdateImageReview } from "@/hooks/use-images";
import { useToast } from "@/components/ui/toast";
import { CONDITION_INFO } from "@/lib/constants/conditions";
import { formatConfidence } from "@/lib/utils";
import { CheckSquare, ExternalLink } from "lucide-react";
import type { Image as ImageType } from "@/types/api";

const PAGE_SIZE = 12;
const CONDITION_OPTIONS = Object.entries(CONDITION_INFO).map(([key, info]) => ({
  value: key,
  label: info.displayName,
}));

function ImageReviewCard({
  image,
  onReview,
}: {
  image: ImageType;
  onReview: (img: ImageType) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-slate-100">
          <Image
            src={image.image_url}
            alt="Skin condition"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>
        <div className="space-y-2 p-3">
          <p className="text-sm font-medium text-slate-900">
            {image.predicted_condition
              ? CONDITION_INFO[image.predicted_condition]?.displayName ??
                image.predicted_condition
              : "—"}
          </p>
          {image.confidence != null && (
            <p className="text-xs text-slate-500">
              Confidence: {formatConfidence(image.confidence)}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onReview(image)}
            >
              <CheckSquare className="mr-1 h-4 w-4" />
              Review
            </Button>
            {image.consultation_id && (
              <Link href={`/consultations/${image.consultation_id}`}>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewQueuePage() {
  const [skip, setSkip] = useState(0);
  const [reviewing, setReviewing] = useState<ImageType | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const { data, isLoading } = useUnreviewedImages({ skip, limit: PAGE_SIZE });
  const updateReview = useUpdateImageReview();
  const { toast } = useToast();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = skip + items.length < total;

  function handleSubmitReview() {
    if (!reviewing || !selectedLabel) return;
    updateReview.mutate(
      { imageId: reviewing.image_id, reviewedLabel: selectedLabel },
      {
        onSuccess: () => {
          toast("Review submitted", "success");
          setReviewing(null);
          setSelectedLabel("");
        },
        onError: () => toast("Failed to submit review", "error"),
      }
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image Review Queue"
        description="Review and classify images for consultations"
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 font-medium text-slate-700">No images to review</p>
            <p className="text-sm text-slate-500">
              New images that need classification will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((img) => (
              <ImageReviewCard
                key={img.image_id}
                image={img}
                onReview={setReviewing}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setSkip((s) => s + PAGE_SIZE)}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={reviewing != null}
        onClose={() => {
          setReviewing(null);
          setSelectedLabel("");
        }}
        title="Set review label"
      >
        {reviewing && (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={reviewing.image_url}
                alt="Review"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-slate-600">
              AI prediction:{" "}
              {reviewing.predicted_condition
                ? CONDITION_INFO[reviewing.predicted_condition]?.displayName ??
                  reviewing.predicted_condition
                : "—"}{" "}
              ({reviewing.confidence != null ? formatConfidence(reviewing.confidence) : "—"})
            </p>
            <label className="block text-sm font-medium text-slate-700">
              Your classification
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
            >
              <option value="">Select condition</option>
              {CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewing(null);
                  setSelectedLabel("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={!selectedLabel}
                loading={updateReview.isPending}
              >
                Submit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
