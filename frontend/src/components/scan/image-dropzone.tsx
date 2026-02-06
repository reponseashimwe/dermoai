"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { Upload, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

interface ImageDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  className?: string;
}

export function ImageDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  className,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please upload a JPEG, PNG, or WebP image.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("Image must be smaller than 10 MB.");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  function handleDrag(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  }

  function handleClear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  }

  if (selectedFile && preview) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative overflow-hidden rounded-lg border-2 border-primary-200 bg-primary-50 sm:rounded-xl">
          <img
            src={preview}
            alt="Selected skin image"
            className="mx-auto max-h-48 object-contain p-2 sm:max-h-64"
          />
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remove image"
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-slate-500 sm:mt-2 sm:text-sm">
          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        role="button"
        tabIndex={0}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 transition-colors sm:rounded-xl sm:p-5",
          dragActive
            ? "border-primary-500 bg-primary-50"
            : "border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-primary-50/50"
        )}
      >
        <Upload className="mb-1.5 h-6 w-6 text-slate-400 sm:mb-2 sm:h-8 sm:w-8" />
        <p className="text-center text-xs font-medium text-slate-700 sm:text-sm">
          Tap to upload or use camera
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
          JPEG, PNG, WebP · 10 MB max
        </p>
        <div className="mt-3 flex gap-2 sm:mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs sm:h-9"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Upload
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs sm:h-9"
            onClick={(e) => {
              e.stopPropagation();
              const cameraInput = document.createElement("input");
              cameraInput.type = "file";
              cameraInput.accept = "image/*";
              cameraInput.capture = "environment";
              cameraInput.onchange = (ev) => {
                const f = (ev.target as HTMLInputElement).files?.[0];
                if (f) validateAndSelect(f);
              };
              cameraInput.click();
            }}
          >
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Camera
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validateAndSelect(file);
        }}
      />

      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
