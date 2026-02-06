"use client";

import { useState } from "react";
import { ImageDropzone } from "./image-dropzone";
import { ConsentCheckbox } from "./consent-checkbox";
import { ScanResultCard } from "./scan-result-card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useQuickScan } from "@/hooks/use-quick-scan";
import { isApiError } from "@/lib/api/errors";
import { Scan } from "lucide-react";

export function ScanUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const scan = useQuickScan();

  async function handleSubmit() {
    if (!file) return;
    scan.mutate({ file, consentToReuse: consent });
  }

  return (
    <div className="space-y-6">
      {!scan.data && (
        <>
          <ImageDropzone
            onFileSelect={setFile}
            selectedFile={file}
            onClear={() => {
              setFile(null);
              scan.reset();
            }}
          />

          {file && (
            <ConsentCheckbox checked={consent} onChange={setConsent} />
          )}

          {scan.isError && (
            <Alert variant="error">
              {isApiError(scan.error)
                ? scan.error.detail
                : "Failed to analyze image. Please try again."}
            </Alert>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!file}
            loading={scan.isPending}
            className="w-full"
            size="lg"
          >
            <Scan className="h-5 w-5" />
            Analyze Skin Image
          </Button>
        </>
      )}

      {scan.data && (
        <div className="space-y-4">
          <ScanResultCard result={scan.data} />
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setConsent(false);
              scan.reset();
            }}
            className="w-full"
          >
            Scan Another Image
          </Button>
        </div>
      )}
    </div>
  );
}
