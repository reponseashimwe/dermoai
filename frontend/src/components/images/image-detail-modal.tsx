"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Sparkles } from "lucide-react";
import { fetchClient } from "@/lib/api/client";
import { formatConditionName, formatConfidence } from "@/lib/utils";
import type { Image } from "@/types/api";

interface ImageDetailModalProps {
  imageId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ImageDetailModal({ imageId, open, onClose }: ImageDetailModalProps) {
  const [image, setImage] = useState<Image | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGradCAM, setShowGradCAM] = useState(true);

  useEffect(() => {
    if (open && imageId) {
      setLoading(true);
      fetchClient.get<Image>(`/api/images/${imageId}?include_gradcam=true`)
        .then((res) => {
          setImage(res.data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setImage(null);
    }
  }, [imageId, open]);

  const hasGradCAM = !!image?.gradcam_base64;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Image Details with Explainability"
      className="max-w-3xl max-h-[90vh] overflow-y-auto"
    >

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : image ? (
          <div className="space-y-4">
            {/* Toggle Buttons */}
            {hasGradCAM && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={!showGradCAM ? "default" : "outline"}
                  onClick={() => setShowGradCAM(false)}
                  className="flex-1"
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  Original
                </Button>
                <Button
                  size="sm"
                  variant={showGradCAM ? "default" : "outline"}
                  onClick={() => setShowGradCAM(true)}
                  className="flex-1"
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Explainability
                </Button>
              </div>
            )}

            {/* Image Display */}
            <div className="relative">
              <img
                src={showGradCAM && hasGradCAM ? image.gradcam_base64 : image.image_url}
                alt={showGradCAM && hasGradCAM ? "GradCAM heatmap" : "Original image"}
                className="w-full rounded-lg border border-slate-200"
              />
              {showGradCAM && hasGradCAM && (
                <div className="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                  Red = High Importance
                </div>
              )}
            </div>

            {/* Prediction Info */}
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">AI Prediction</h3>
              <div className="space-y-1 text-sm">
                {image.predicted_condition ? (
                  <>
                    <p>
                      <span className="font-medium">Condition:</span>{" "}
                      {formatConditionName(image.predicted_condition)}
                    </p>
                    {image.confidence !== null && (
                      <p>
                        <span className="font-medium">Confidence:</span>{" "}
                        {formatConfidence(image.confidence)}
                      </p>
                    )}
                    {image.triage_stage && (
                      <p className="text-xs text-slate-600 mt-1">
                        Triage: {image.triage_stage.replace(/_/g, " ").toLowerCase()}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">No prediction available</p>
                )}
              </div>
            </div>

            {/* GradCAM Metrics */}
            {showGradCAM && image.gradcam_metrics && (
              <details className="rounded-lg bg-slate-50 p-3 text-sm">
                <summary className="cursor-pointer font-semibold text-slate-700">
                  Explainability Metrics
                </summary>
                <div className="mt-2 space-y-1 text-slate-600">
                  <p>
                    <span className="font-medium">Peak Location:</span> (
                    {image.gradcam_metrics.peak_activation_location.x},{" "}
                    {image.gradcam_metrics.peak_activation_location.y})
                  </p>
                  <p>
                    <span className="font-medium">Peak Intensity:</span>{" "}
                    {(image.gradcam_metrics.peak_intensity * 100).toFixed(1)}%
                  </p>
                  <p>
                    <span className="font-medium">Mean Activation:</span>{" "}
                    {(image.gradcam_metrics.mean_activation * 100).toFixed(1)}%
                  </p>
                  <p>
                    <span className="font-medium">Activation Area:</span>{" "}
                    {(image.gradcam_metrics.activation_area * 100).toFixed(1)}% of image
                  </p>
                </div>
              </details>
            )}

            {/* All Probabilities */}
            {image.all_probabilities && Object.keys(image.all_probabilities).length > 1 && (
              <details className="rounded-lg bg-slate-50 p-3 text-sm">
                <summary className="cursor-pointer font-semibold text-slate-700">
                  All Condition Probabilities
                </summary>
                <div className="mt-2 space-y-1">
                  {Object.entries(image.all_probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([condition, prob]) => (
                      <div key={condition} className="flex justify-between text-slate-600">
                        <span>{formatConditionName(condition)}</span>
                        <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </details>
            )}

            {/* Model Version */}
            {image.model_version && (
              <p className="text-xs text-slate-500 text-center">
                Model v{image.model_version}
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No image data</p>
        )}
    </Modal>
  );
}
