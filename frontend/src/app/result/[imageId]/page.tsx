"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { ResultPageContent } from "@/components/scan/result-page-content";
import { useResultByImageId } from "@/hooks/use-result-by-image-id";
import { useSaveQuickScanToConsultation } from "@/hooks/use-save-quick-scan-to-consultation";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ResultPage() {
	const params = useParams();
	const imageId = typeof params.imageId === "string" ? params.imageId : null;
	const { data: result, isLoading, error } = useResultByImageId(imageId);
	const saveToConsultation = useSaveQuickScanToConsultation();
	const { toast } = useToast();

	const handleSaveSuccess = (consultationId: string) => {
		toast("Consultation created. Your scan has been saved.", "success");
		window.location.href = `/consultations/${consultationId}`;
	};

	const handleSaveError = (error: unknown) => {
		toast(
			isApiError(error) ? error.detail : "Failed to save to consultations. Please try again.",
			"error"
		);
	};

	const handleSaveToConsultations = async (r: { image_id: string }) => {
		const consultation = await saveToConsultation.mutateAsync({
			imageId: r.image_id,
		});
		return consultation;
	};

	return (
		<div className="min-h-screen flex flex-col bg-slate-50">
			<Header />
			<main className="flex-1">
				{isLoading && (
					<div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
						<div className="grid gap-8 lg:grid-cols-2">
							<Skeleton className="h-[400px] w-full rounded-xl" />
							<div className="space-y-4">
								<Skeleton className="h-8 w-48" />
								<Skeleton className="h-32 w-32 rounded-full" />
							</div>
						</div>
					</div>
				)}
				{error && (
					<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
						<Alert variant="error">
							{isApiError(error) ? error.detail : "Failed to load result. You may need to sign in to view this scan."}
						</Alert>
						<div className="mt-4 flex gap-3">
							<Link href="/">
								<Button>Back to Scan</Button>
							</Link>
							<Link href="/login">
								<Button variant="outline">Sign in</Button>
							</Link>
						</div>
					</div>
				)}
				{result && !isLoading && (
					<ResultPageContent
						result={result}
						onSaveToConsultations={handleSaveToConsultations}
						onSaveSuccess={handleSaveSuccess}
						onSaveError={handleSaveError}
						isSaving={saveToConsultation.isPending}
					/>
				)}
			</main>
		</div>
	);
}
