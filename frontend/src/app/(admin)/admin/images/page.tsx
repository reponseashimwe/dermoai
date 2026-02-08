"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { useAllImages } from "@/hooks/use-images";
import { CONDITION_INFO } from "@/lib/constants/conditions";
import { formatDate, formatConfidence } from "@/lib/utils";
import { Image as ImageIcon, ExternalLink } from "lucide-react";
import type { Image as ImageType } from "@/types/api";

const PAGE_SIZE = 24;

export default function AdminImagesPage() {
  const [skip, setSkip] = useState(0);
  const [detail, setDetail] = useState<ImageType | null>(null);
  const { data, isLoading } = useAllImages({
    skip,
    limit: PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = skip + items.length < total;

  return (
    <div className="space-y-6">
      <PageHeader
        title="All System Images"
        description="Browse images uploaded to the system"
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 font-medium text-slate-700">No images</p>
            <p className="text-sm text-slate-500">
              Images will appear here as users upload and attach scans.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Showing {skip + 1}–{skip + items.length} of {total}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((img) => (
              <Card
                key={img.image_id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setDetail(img)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-slate-100">
                    <Image
                      src={img.image_url}
                      alt="Upload"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-2 text-xs text-slate-500">
                    {img.predicted_condition ?? "—"} · {formatDate(img.uploaded_at)}
                  </div>
                </CardContent>
              </Card>
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
        open={detail != null}
        onClose={() => setDetail(null)}
        title="Image details"
      >
        {detail && (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={detail.image_url}
                alt="Detail"
                fill
                className="object-contain"
              />
            </div>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-slate-500">Uploaded</dt>
                <dd>{formatDate(detail.uploaded_at)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Source</dt>
                <dd>{detail.source}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Predicted condition</dt>
                <dd>
                  {detail.predicted_condition
                    ? CONDITION_INFO[detail.predicted_condition]?.displayName ??
                      detail.predicted_condition
                    : "—"}
                </dd>
              </div>
              {detail.confidence != null && (
                <div>
                  <dt className="text-slate-500">Confidence</dt>
                  <dd>{formatConfidence(detail.confidence)}</dd>
                </div>
              )}
              {detail.reviewed_label && (
                <div>
                  <dt className="text-slate-500">Reviewed label</dt>
                  <dd>
                    {CONDITION_INFO[detail.reviewed_label]?.displayName ??
                      detail.reviewed_label}
                  </dd>
                </div>
              )}
            </dl>
            {detail.consultation_id && (
              <Link href={`/consultations/${detail.consultation_id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Open consultation
                </Button>
              </Link>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
