"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Camera, X } from "lucide-react";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCaptureModal({
  open,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      setSupported(null);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      setError("Camera is not supported in this browser.");
      return;
    }

    setSupported(true);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      })
      .catch((err) => {
        if (err.name === "NotAllowedError") {
          setError("Camera access was denied. Please allow camera in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found.");
        } else {
          setError("Could not start camera. Please try again.");
        }
      });

    return () => stopStream();
  }, [open, stopStream]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.srcObject || video.readyState < 2) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (blob.size > MAX_SIZE) {
          setError("Captured image is too large. Please try again.");
          return;
        }
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopStream();
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.9
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Take a photo">
      <div className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {supported === false && (
          <p className="text-sm text-slate-600">
            Use the Upload button to choose an image from your device instead.
          </p>
        )}

        {supported === true && !error && (
          <>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleCapture}
                className="flex-1 gap-2"
              >
                <Camera className="h-4 w-4" />
                Capture
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
