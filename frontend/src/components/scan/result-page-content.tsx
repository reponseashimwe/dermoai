"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UrgencyBadge } from "./urgency-badge";
import { ConditionInfoPanel } from "./condition-info-panel";
import { ConfidenceCircle } from "./confidence-circle";
import { formatConditionName, formatConfidence } from "@/lib/utils";
import { CONDITION_INFO } from "@/lib/constants/conditions";
import { fetchClient } from "@/lib/api/client";
import { FileText, Eye, Sparkles, Loader2 } from "lucide-react";
import type { QuickScanResponse, Consultation, Image, GradCAMMetrics } from "@/types/api";

interface ResultPageContentProps {
	result: QuickScanResponse;
	onSaveToConsultations?: (result: QuickScanResponse) => Promise<Consultation>;
	onSaveSuccess?: (consultationId: string) => void;
	onSaveError?: (error: unknown) => void;
	isSaving?: boolean;
}

export function ResultPageContent({
	result,
	onSaveToConsultations,
	onSaveSuccess,
	onSaveError,
	isSaving = false,
}: ResultPageContentProps) {
	const [showGradCAM, setShowGradCAM] = useState(true);
	const [loadedGradCAM, setLoadedGradCAM] = useState<{
		gradcam_base64: string;
		gradcam_metrics?: GradCAMMetrics;
	} | null>(null);
	const [loadingGradCAM, setLoadingGradCAM] = useState(false);

	const conditionInfo = CONDITION_INFO[result.predicted_condition];
	const displayName =
		conditionInfo?.displayName ||
		formatConditionName(result.predicted_condition);
	const hasGradCAM = !!(
		result.gradcam_base64 || loadedGradCAM?.gradcam_base64
	);
	const gradcamBase64 =
		loadedGradCAM?.gradcam_base64 ?? result.gradcam_base64;
	const gradcamMetrics =
		loadedGradCAM?.gradcam_metrics ?? result.gradcam_metrics;
	const isRefer = result.urgency === "REFER";

	async function handleLoadGradCAM() {
		if (!result.image_id || loadingGradCAM) return;
		setLoadingGradCAM(true);
		try {
			const img = await fetchClient<Image>(
				`/api/images/${result.image_id}?include_gradcam=true`
			);
			if (img.gradcam_base64)
				setLoadedGradCAM({
					gradcam_base64: img.gradcam_base64,
					gradcam_metrics: img.gradcam_metrics,
				});
		} finally {
			setLoadingGradCAM(false);
		}
	}

	return (
		<div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
			{/* Grid: image left, result right */}
			<div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
				<div className="space-y-3 min-w-0">
					<div className="flex flex-wrap gap-2">
						{hasGradCAM && (
							<>
								<Button
									size="sm"
									variant={!showGradCAM ? "primary" : "outline"}
									onClick={() => setShowGradCAM(false)}
									className="min-w-0 flex-1"
								>
									<Eye className="mr-1.5 h-4 w-4 shrink-0" />
									Original
								</Button>
								<Button
									size="sm"
									variant={showGradCAM ? "primary" : "outline"}
									onClick={() => setShowGradCAM(true)}
									className="min-w-0 flex-1"
								>
									<Sparkles className="mr-1.5 h-4 w-4 shrink-0" />
									Explainability
								</Button>
							</>
						)}
						{!hasGradCAM && result.image_id && (
							<Button
								size="sm"
								variant="outline"
								onClick={handleLoadGradCAM}
								disabled={loadingGradCAM}
							>
								{loadingGradCAM ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Sparkles className="h-4 w-4" />
								)}
								{loadingGradCAM ? "Loading…" : "Show explainability"}
							</Button>
						)}
					</div>
					<div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
						<img
							src={
								showGradCAM && hasGradCAM
									? gradcamBase64
									: result.image_url
							}
							alt={
								showGradCAM && hasGradCAM
									? "GradCAM explainability heatmap"
									: "Uploaded skin image"
							}
							className="w-full object-contain"
							style={{ maxHeight: "500px" }}
						/>
						{showGradCAM && hasGradCAM && (
							<div className="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
								Red = High Importance
							</div>
						)}
					</div>
				</div>

				<div className="flex flex-col items-center gap-6 lg:min-w-[240px] lg:items-start">
					<div className="flex w-full flex-wrap items-center justify-between gap-3 lg:flex-col lg:items-start">
						<div>
							<p className="text-sm text-slate-500">Predicted condition</p>
							<h1 className="text-2xl font-bold text-slate-900">
								{displayName}
							</h1>
						</div>
						<UrgencyBadge urgency={result.urgency} />
					</div>
					<ConfidenceCircle
						value={result.confidence}
						urgency={result.urgency}
						size={140}
						strokeWidth={12}
					/>
					{result.model_version && (
						<div className="text-xs text-slate-500">
							Model v{result.model_version}
							{result.triage_stage &&
								result.triage_stage !== "NORMAL_PREDICTION" && (
									<> • {result.triage_stage.replace(/_/g, " ").toLowerCase()}</>
								)}
						</div>
					)}
				</div>
			</div>

			{/* Grid: About | All condition probabilities */}
			<div className="grid gap-8 lg:grid-cols-2">
				<ConditionInfoPanel condition={result.predicted_condition} />
				{result.all_probabilities &&
					Object.keys(result.all_probabilities).length > 0 && (
						<div className="space-y-3 min-w-0">
							<h2 className="text-sm font-semibold text-slate-800">
								All condition probabilities
							</h2>
							<div className="space-y-3">
								{Object.entries(result.all_probabilities)
									.sort(([, a], [, b]) => b - a)
									.map(([condition, prob]) => {
										const pct = prob * 100;
										const isTop =
											condition === result.predicted_condition;
										return (
											<div
												key={condition}
												className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_3.5rem] items-center gap-3"
											>
												<span
													className={`truncate text-sm ${
														isTop
															? "font-semibold text-slate-900"
															: "text-slate-600"
													}`}
													title={formatConditionName(condition)}
												>
													{formatConditionName(condition)}
												</span>
												<div className="flex min-w-0 items-center">
													<div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
														<div
															className={`h-full rounded-full transition-all duration-500 ${
																isTop ? "bg-primary-600" : "bg-slate-400"
															}`}
															style={{
																width: `${Math.min(100, pct)}%`,
															}}
														/>
													</div>
												</div>
												<span className="text-right text-sm tabular-nums text-slate-600">
													{pct.toFixed(1)}%
												</span>
											</div>
										);
									})}
							</div>
						</div>
					)}
			</div>

			{/* Explainability metrics - always visible */}
			{showGradCAM && gradcamMetrics && (
				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
					<h2 className="text-sm font-semibold text-slate-800 mb-3">
						Explainability metrics
					</h2>
					<div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
						<p>
							<span className="font-medium">Peak location:</span> (
							{gradcamMetrics.peak_activation_location.x},{" "}
							{gradcamMetrics.peak_activation_location.y})
						</p>
						<p>
							<span className="font-medium">Peak intensity:</span>{" "}
							{(gradcamMetrics.peak_intensity * 100).toFixed(1)}%
						</p>
						<p>
							<span className="font-medium">Mean activation:</span>{" "}
							{(gradcamMetrics.mean_activation * 100).toFixed(1)}%
						</p>
						<p>
							<span className="font-medium">Activation area:</span>{" "}
							{(gradcamMetrics.activation_area * 100).toFixed(1)}% of image
						</p>
					</div>
				</div>
			)}

			{/* REFER alert when applicable */}
			{isRefer && (
				<div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
					<p className="font-semibold">
						REFER: Immediate specialist attention recommended
					</p>
					<p>
						Predicted: {displayName} (Confidence:{" "}
						{formatConfidence(result.confidence)}). Consult with a dermatology
						specialist immediately or schedule an in-person examination.
					</p>
				</div>
			)}

			{/* Actions: Create Consultation (always) + Scan Another */}
			<div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-8">
				{onSaveToConsultations ? (
					<Button
						size="lg"
						disabled={isSaving}
						loading={isSaving}
						onClick={async () => {
							try {
								const consultation =
									await onSaveToConsultations(result);
								onSaveSuccess?.(consultation.consultation_id);
							} catch (err) {
								onSaveError?.(err);
							}
						}}
					>
						<FileText className="mr-2 h-5 w-5" />
						Create Consultation
					</Button>
				) : (
					<Link href="/consultations/new">
						<Button size="lg" variant="outline">
							<FileText className="mr-2 h-5 w-5" />
							Create Consultation
						</Button>
					</Link>
				)}
				<Link href="/">
					<Button variant="ghost" size="lg">
						Scan Another Image
					</Button>
				</Link>
			</div>
		</div>
	);
}
