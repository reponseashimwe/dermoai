"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfidenceCircle } from "@/components/scan/confidence-circle";
import { UrgencyBadge } from "@/components/scan/urgency-badge";
import { Eye, Sparkles, Info, CheckSquare, ArrowUpRight, Save, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import { formatConditionName } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CONDITION_INFO } from "@/lib/constants/conditions";
import type { Image, QuickScanResponse } from "@/types/api";

/** Minimal shape for the detail view; satisfied by both Image and QuickScanResponse. */
export type ImageDetailData = Image | QuickScanResponse;

export interface ImageDetailContentProps {
	image: ImageDetailData;
	className?: string;
	/** Optional: show "Save Consultation" / "Create consultation" button (e.g. for quick scan REFER). */
	onSaveConsultation?: () => void;
	/** Button label when onSaveConsultation is provided; default "Save Consultation". Use "Create consultation" for quick scan. */
	saveConsultationLabel?: string;
	/** Optional: show "Refer Specialist" button. */
	onReferSpecialist?: () => void;
	isSaving?: boolean;
	/** When true, hide action buttons (e.g. when viewing image inside a consultation). */
	hideActions?: boolean;
	/** When true, hide the "About condition" info block. */
	hideAboutCondition?: boolean;
	/** When true, hide the "Recommended action" details section. */
	hideRecommendedAction?: boolean;
	/** 'visible' = show expanded, 'disclosure' = in a collapsed <details>, 'hidden' = do not show. */
	explainabilityMetrics?: "visible" | "disclosure" | "hidden";
}

export function ImageDetailContent({
	image,
	className,
	onSaveConsultation,
	saveConsultationLabel = "Save Consultation",
	onReferSpecialist,
	isSaving = false,
	hideActions = false,
	hideAboutCondition = false,
	hideRecommendedAction = false,
	explainabilityMetrics = "visible",
}: ImageDetailContentProps) {
	const [showGradCAM, setShowGradCAM] = useState(explainabilityMetrics !== "disclosure");
	const hasGradCAM = !!image.gradcam_base64;
	const rawKey = (image.predicted_condition ?? "").trim();
	const conditionKey = rawKey ? rawKey.toLowerCase().replace(/\s+/g, "_") : "other";
	const conditionInfo = CONDITION_INFO[conditionKey] || CONDITION_INFO.other;
	const urgency =
		"urgency" in image && image.urgency
			? image.urgency
			: image.confidence != null && image.confidence < 0.45
				? "REFER"
				: "MANAGE LOCALLY";
	const showActionButtons = !hideActions && (onReferSpecialist || onSaveConsultation);

	return (
		<div className={cn("grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start", className)}>
			{/* Left: Image + Explainability */}
			<div className='space-y-5'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div className='flex gap-1 rounded-full bg-slate-100 p-0.5'>
						{hasGradCAM ? (
							<>
								<Button
									size='sm'
									variant='ghost'
									onClick={() => setShowGradCAM(false)}
									className={cn(
										"rounded-full text-xs font-medium",
										!showGradCAM &&
											"bg-white text-primary-600 shadow-sm hover:bg-white hover:text-primary-700",
									)}
								>
									<Eye className='mr-1.5 h-3.5 w-3.5' />
									Original
								</Button>
								<Button
									size='sm'
									variant='ghost'
									onClick={() => setShowGradCAM(true)}
									className={cn(
										"rounded-full text-xs font-medium",
										showGradCAM &&
											"bg-white text-primary-600 shadow-sm hover:bg-white hover:text-primary-700",
									)}
								>
									<Sparkles className='mr-1.5 h-3.5 w-3.5' />
									Explainability
								</Button>
							</>
						) : (
							<p className='px-3 py-1.5 text-xs text-slate-500'>Explainability unavailable</p>
						)}
					</div>
				</div>

				<div className='relative flex aspect-[4/3] max-h-[320px] items-center justify-center overflow-hidden rounded-xl bg-slate-100'>
					<img
						src={showGradCAM && hasGradCAM ? image.gradcam_base64! : image.image_url}
						alt={showGradCAM && hasGradCAM ? "GradCAM heatmap" : "Original"}
						className='max-h-full w-full object-contain'
					/>
					{showGradCAM && hasGradCAM && (
						<div className='absolute top-2 right-2 flex items-center gap-1.5 rounded bg-white/90 px-2 py-1 shadow-sm'>
							<div className='h-2 w-12 rounded-full bg-gradient-to-r from-blue-500 via-green-400 via-yellow-400 to-red-500' />
							<span className='text-[10px] font-medium text-slate-600'>Low → High</span>
						</div>
					)}
				</div>

				{showGradCAM &&
					image.gradcam_metrics &&
					explainabilityMetrics !== "hidden" &&
					(explainabilityMetrics === "disclosure" ? (
						<details className='group rounded-lg border border-slate-200 bg-slate-50/80'>
							<summary className='flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 [&::-webkit-details-marker]:hidden'>
								<span className='shrink-0 text-slate-400 transition-transform group-open:rotate-90'>
									<ChevronDown className='h-4 w-4' />
								</span>
								Explainability metrics
							</summary>
							<div className='border-t border-slate-200 px-4 pb-4 pt-3'>
								<div className='grid grid-cols-2 gap-3'>
									<div className='rounded-lg bg-slate-100/80 p-3'>
										<p className='text-xs font-medium uppercase text-slate-500'>Peak</p>
										<p className='mt-0.5 font-semibold text-slate-900'>
											({image.gradcam_metrics.peak_activation_location.x},{" "}
											{image.gradcam_metrics.peak_activation_location.y})
										</p>
										<p className='text-xs text-slate-500'>Hotspot coord</p>
									</div>
									<div className='rounded-lg bg-slate-100/80 p-3'>
										<p className='text-xs font-medium uppercase text-slate-500'>Intensity</p>
										<p className='mt-0.5 font-semibold text-slate-900'>
											{(image.gradcam_metrics.peak_intensity * 100).toFixed(1)}%
										</p>
										<p className='text-xs text-slate-500'>Max activation</p>
									</div>
									<div className='rounded-lg bg-slate-100/80 p-3'>
										<p className='text-xs font-medium uppercase text-slate-500'>Mean</p>
										<p className='mt-0.5 font-semibold text-slate-900'>
											{(image.gradcam_metrics.mean_activation * 100).toFixed(1)}%
										</p>
										<p className='text-xs text-slate-500'>Avg saliency</p>
									</div>
									<div className='rounded-lg bg-slate-100/80 p-3'>
										<p className='text-xs font-medium uppercase text-slate-500'>Area</p>
										<p className='mt-0.5 font-semibold text-slate-900'>
											{(image.gradcam_metrics.activation_area * 100).toFixed(1)}%
										</p>
										<p className='text-xs text-slate-500'>Region covered</p>
									</div>
								</div>
							</div>
						</details>
					) : (
						<div className='space-y-3'>
							<h3 className='text-xs font-medium uppercase tracking-wide text-slate-400'>
								Explainability metrics
							</h3>
							<div className='grid grid-cols-2 gap-3'>
								<div className='rounded-lg bg-slate-100/80 p-3'>
									<p className='text-xs font-medium uppercase text-slate-500'>Peak</p>
									<p className='mt-0.5 font-semibold text-slate-900'>
										({image.gradcam_metrics.peak_activation_location.x},{" "}
										{image.gradcam_metrics.peak_activation_location.y})
									</p>
									<p className='text-xs text-slate-500'>Hotspot coord</p>
								</div>
								<div className='rounded-lg bg-slate-100/80 p-3'>
									<p className='text-xs font-medium uppercase text-slate-500'>Intensity</p>
									<p className='mt-0.5 font-semibold text-slate-900'>
										{(image.gradcam_metrics.peak_intensity * 100).toFixed(1)}%
									</p>
									<p className='text-xs text-slate-500'>Max activation</p>
								</div>
								<div className='rounded-lg bg-slate-100/80 p-3'>
									<p className='text-xs font-medium uppercase text-slate-500'>Mean</p>
									<p className='mt-0.5 font-semibold text-slate-900'>
										{(image.gradcam_metrics.mean_activation * 100).toFixed(1)}%
									</p>
									<p className='text-xs text-slate-500'>Avg saliency</p>
								</div>
								<div className='rounded-lg bg-slate-100/80 p-3'>
									<p className='text-xs font-medium uppercase text-slate-500'>Area</p>
									<p className='mt-0.5 font-semibold text-slate-900'>
										{(image.gradcam_metrics.activation_area * 100).toFixed(1)}%
									</p>
									<p className='text-xs text-slate-500'>Region covered</p>
								</div>
							</div>
						</div>
					))}
			</div>

			{/* Right: Prediction + Top conditions + About + Actions */}
			<div className='space-y-6'>
				<div>
					<h3 className='text-xs font-medium uppercase tracking-wide text-slate-400 mb-4'>AI prediction</h3>
					{image.predicted_condition ? (
						<div className='flex flex-wrap items-center gap-6 sm:gap-8'>
							<div className='flex items-center gap-5 sm:gap-6'>
								<div className='flex flex-col items-center'>
									<ConfidenceCircle
										value={image.confidence ?? 0}
										urgency={urgency}
										size={72}
										strokeWidth={6}
									/>
									<span className='mt-0.5 text-[10px] font-medium text-slate-500'>CONF.</span>
								</div>
								<div>
									<p className='text-xl font-bold text-slate-900'>
										{formatConditionName(image.predicted_condition)}
									</p>
									<UrgencyBadge
										urgency={urgency}
										size='sm'
										className='mt-1'
									/>
								</div>
							</div>
						</div>
					) : (
						<p className='text-slate-500'>No prediction available</p>
					)}
				</div>

				{"reviewed_label" in image && image.reviewed_label && (
					<div className='rounded-lg border border-primary-200 bg-primary-50/60 p-4'>
						<div className='flex items-start gap-3'>
							<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100'>
								<UserCheck className='h-4 w-4 text-primary-600' />
							</div>
							<div>
								<p className='text-xs font-medium uppercase tracking-wide text-primary-700'>
									Specialist review
								</p>
								<p className='mt-0.5 text-sm font-semibold text-slate-900'>
									{formatConditionName(image.reviewed_label)}
								</p>
								{image.reviewed_by_name && (
									<p className='mt-0.5 text-xs text-slate-500'>
										Reviewed by {image.reviewed_by_name}
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				{image.all_probabilities && Object.keys(image.all_probabilities).length > 0 && (
					<div>
						<h3 className='text-xs font-medium uppercase tracking-wide text-slate-400 mb-3'>
							Top conditions
						</h3>
						<ol className='space-y-3'>
							{Object.entries(image.all_probabilities)
								.sort(([, a], [, b]) => b - a)
								.slice(0, 5)
								.map(([condition, prob], index) => {
									const isTop = condition === image.predicted_condition;
									return (
										<li
											key={condition}
											className='flex items-center gap-3 text-sm'
										>
											<span className='w-4 shrink-0 text-slate-400'>{index + 1}.</span>
											<span
												className={cn(
													"min-w-0 flex-1 truncate",
													isTop ? "font-semibold text-slate-900" : "text-slate-600",
												)}
											>
												{formatConditionName(condition)}
											</span>
											<div className='h-1.5 w-20 shrink-0 rounded-full bg-slate-200 overflow-hidden'>
												<div
													className={cn(
														"h-full rounded-full",
														isTop ? "bg-primary-700" : "bg-slate-400",
													)}
													style={{ width: `${Math.min(100, prob * 100)}%` }}
												/>
											</div>
											<span className='w-10 shrink-0 text-right text-sm tabular-nums text-slate-600'>
												{(prob * 100).toFixed(1)}%
											</span>
										</li>
									);
								})}
						</ol>
					</div>
				)}

				{!hideAboutCondition && (
					<div className='rounded-lg border border-slate-200 bg-slate-50/50 p-5'>
						<div className='flex gap-4'>
							<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100'>
								<Info className='h-4 w-4 text-primary-600' />
							</div>
							<div>
								<h3 className='text-sm font-semibold text-slate-900'>
									About {conditionInfo.displayName}
								</h3>
								<p className='mt-2 text-sm text-slate-700 leading-relaxed'>
									{conditionInfo.description}
								</p>
							</div>
						</div>
					</div>
				)}

				{!hideRecommendedAction && (
					<details className='group rounded-lg border border-slate-200 bg-slate-50/50'>
						<summary className='flex cursor-pointer list-none items-center gap-4 p-5 [&::-webkit-details-marker]:hidden'>
							<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100'>
								<CheckSquare className='h-4 w-4 text-primary-600' />
							</div>
							<span className='text-sm font-semibold text-slate-900'>Recommended action</span>
							<span className='ml-auto shrink-0 text-slate-400 group-open:hidden'>
								<ChevronDown className='h-4 w-4' />
							</span>
							<span className='ml-auto shrink-0 text-slate-400 hidden group-open:inline'>
								<ChevronUp className='h-4 w-4' />
							</span>
						</summary>
						<div className='border-t border-slate-200 px-5 pb-5 pt-2'>
							<p className='text-sm text-slate-700 leading-relaxed'>{conditionInfo.recommendedAction}</p>
						</div>
					</details>
				)}

				{showActionButtons && (
					<div className='flex flex-wrap gap-3 pt-2'>
						{onReferSpecialist && (
							<Button
								variant='outline'
								size='sm'
								onClick={onReferSpecialist}
							>
								<ArrowUpRight className='mr-2 h-4 w-4' />
								Refer Specialist
							</Button>
						)}
						{onSaveConsultation && (
							<Button
								size='sm'
								onClick={onSaveConsultation}
								disabled={isSaving}
								loading={isSaving}
							>
								<Save className='mr-2 h-4 w-4' />
								{saveConsultationLabel}
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
