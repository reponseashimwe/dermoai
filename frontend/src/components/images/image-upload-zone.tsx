"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadImage } from "@/hooks/use-images";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

interface ImageUploadZoneProps {
  consultationId: string;
  className?: string;
}

export function ImageUploadZone({
  consultationId,
  className,
}: ImageUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const upload = useUploadImage();
  const { toast } = useToast();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await upload.mutateAsync({ file, consultationId });
      }
      toast(`${files.length} image(s) uploaded`, "success");
    } catch (err) {
      if (isApiError(err)) {
        toast(err.detail, "error");
      } else {
        toast("Failed to upload image", "error");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-primary-400 hover:bg-primary-50/50"
      >
        <Upload className="mb-2 h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          Click to upload consultation images
        </p>
        <p className="text-xs text-slate-400">Multiple images supported</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading && (
        <p className="text-center text-sm text-primary-600">Uploading...</p>
      )}
    </div>
  );
}
