"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { ImageDropzone } from "./image-dropzone";
import { ConsentCheckbox } from "./consent-checkbox";
import { ScanResultCard } from "./scan-result-card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useQuickScan } from "@/hooks/use-quick-scan";
import { PENDING_QUICK_SCAN_IMAGE_ID_KEY } from "@/hooks/use-save-quick-scan-to-consultation";
import { isApiError } from "@/lib/api/errors";
import { Scan, Check } from "lucide-react";
import type { QuickScanResponse } from "@/types/api";
import type { Consultation } from "@/types/api";

export interface ScanUploadFormHandle {
	reset: () => void;
}

interface ScanUploadFormProps {
	/** When provided, REFER result shows "Save to my consultations" that creates a consultation and attaches the scan. */
	onSaveToConsultations?: (result: QuickScanResponse) => Promise<Consultation>;
	onSaveSuccess?: (consultationId: string) => void;
	onSaveError?: (error: unknown) => void;
	isSaving?: boolean;
	/** When true, after a successful scan redirect to /result/[id]. That page requires login to view; prefer false and use resultDisplay="fullPage" for public flow. */
	redirectToResultPage?: boolean;
	/** "inline" = result in same column; "fullPage" = result shown below hero (full width), parent renders it via onResultReady. */
	resultDisplay?: "inline" | "fullPage";
	/** When resultDisplay="fullPage", parent receives the result here and renders it full-width; form does not render result. */
	onResultReady?: (data: QuickScanResponse) => void;
	/** When resultDisplay="fullPage", called when user clicks Scan again in form area so parent can clear its result state. */
	onScanAgain?: () => void;
	/** Show a static sample result preview between dropzone and submit button */
	showSampleResult?: boolean;
}

export const ScanUploadForm = forwardRef<ScanUploadFormHandle, ScanUploadFormProps>(function ScanUploadForm(
	{
		onSaveToConsultations,
		onSaveSuccess,
		onSaveError,
		isSaving = false,
		redirectToResultPage = false,
		resultDisplay = "inline",
		onResultReady,
		onScanAgain,
		showSampleResult = false,
	},
	ref,
) {
	const [file, setFile] = useState<File | null>(null);
	const [consent, setConsent] = useState(false);
	const router = useRouter();
	const scan = useQuickScan();

	useImperativeHandle(
		ref,
		() => ({
			reset: () => {
				setFile(null);
				setConsent(false);
				scan.reset();
			},
		}),
		[scan],
	);

	useEffect(() => {
		if (scan.data && typeof window !== "undefined") {
			sessionStorage.setItem(PENDING_QUICK_SCAN_IMAGE_ID_KEY, scan.data.image_id);
			if (redirectToResultPage) {
				router.push(`/result/${scan.data.image_id}`);
			}
		}
	}, [scan.data, redirectToResultPage, router]);

	// In fullPage mode, notify parent so it can render result full-width below hero
	useEffect(() => {
		if (scan.data && resultDisplay === "fullPage") {
			onResultReady?.(scan.data);
		}
	}, [scan.data, resultDisplay, onResultReady]);

	function handleScanAgain() {
		setFile(null);
		setConsent(false);
		scan.reset();
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
		onScanAgain?.();
	}

	async function handleSubmit() {
		if (!file) return;
		scan.mutate({ file, consentToReuse: consent });
	}

	return (
		<div className='space-y-4'>
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
						<ConsentCheckbox
							checked={consent}
							onChange={setConsent}
						/>
					)}

					{scan.isError && (
						<Alert variant='error'>
							{isApiError(scan.error) ? scan.error.detail : "Failed to analyze image. Please try again."}
						</Alert>
					)}

					<Button
						onClick={handleSubmit}
						disabled={!file}
						loading={scan.isPending}
						className='w-full'
						size='lg'
					>
						<Scan className='h-5 w-5' />
						Analyze Skin Image
					</Button>
				</>
			)}

			{scan.data && !redirectToResultPage && resultDisplay === "inline" && (
				<div className='space-y-4'>
					<ScanResultCard
						result={scan.data}
						onSaveToConsultations={onSaveToConsultations}
						onSaveSuccess={onSaveSuccess}
						onSaveError={onSaveError}
						isSaving={isSaving}
					/>
					<Button
						variant='outline'
						onClick={handleScanAgain}
						className='w-full'
					>
						Scan Another Image
					</Button>
				</div>
			)}

			{/* fullPage: result is rendered by parent below hero; show only Scan again in form column */}
			{scan.data && !redirectToResultPage && resultDisplay === "fullPage" && (
				<div className='space-y-3'>
					<p className='text-sm text-slate-500'>Result shown below. Scroll down or scan another image.</p>
					<Button
						variant='outline'
						onClick={handleScanAgain}
						className='w-full'
					>
						<Scan className='mr-2 h-4 w-4' />
						Scan again
					</Button>
				</div>
			)}
		</div>
	);
});
