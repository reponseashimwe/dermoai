"use client";

import { useState } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { ConditionSelect } from "@/components/clinical-review/condition-select";
import { Badge } from "@/components/ui/badge";
import { useUnreviewedImages, useReviewedImages, useUpdateImageReview } from "@/hooks/use-images";
import { useConditions } from "@/hooks/use-conditions";
import { useToast } from "@/components/ui/toast";
import { formatConfidence } from "@/lib/utils";
import { CheckSquare, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Image as ImageType } from "@/types/api";

const PAGE_SIZE = 12;
type Tab = "pending" | "reviewed";

function PendingReviewCard({ image, onReview }: { image: ImageType; onReview: (img: ImageType) => void }) {
	return (
		<Card className='overflow-hidden'>
			<CardContent className='p-0'>
				<div className='relative h-24 w-full overflow-hidden bg-slate-100'>
					<Image
						src={image.image_url}
						alt='Skin condition'
						fill
						className='object-cover'
						sizes='(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw'
					/>
				</div>
				<div className='flex items-center justify-between gap-1.5 p-2'>
					<div className='min-w-0 flex-1'>
						<p className='truncate text-xs font-medium text-slate-900'>
							{image.predicted_condition ? image.predicted_condition.replace(/_/g, " ") : "—"}
						</p>
						{image.confidence != null && (
							<p className='truncate text-[10px] text-slate-500'>{formatConfidence(image.confidence)}</p>
						)}
					</div>
					<Button
						size='sm'
						className='h-7 px-2 text-xs shrink-0'
						onClick={() => onReview(image)}
						aria-label='Review image'
					>
						<CheckSquare className='h-3 w-3' />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function ReviewedCard({ image }: { image: ImageType }) {
	return (
		<Card className='overflow-hidden'>
			<CardContent className='p-0'>
				<div className='relative h-24 w-full overflow-hidden bg-slate-100'>
					<Image
						src={image.image_url}
						alt='Skin condition'
						fill
						className='object-cover'
						sizes='(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw'
					/>
					<div className='absolute right-1 top-1'>
						<Badge
							variant={image.reviewed_as_final ? "safe" : "info"}
							className='text-[10px]'
						>
							{image.reviewed_as_final ? "Final (Specialist)" : "Doctor"}
						</Badge>
					</div>
				</div>
				<div className='space-y-1 p-2'>
					<p className='text-xs font-medium text-slate-700'>Reviewed condition</p>
					<p className='truncate text-xs font-medium text-slate-900'>{image.reviewed_label ?? "—"}</p>
					<p className='truncate text-[10px] text-slate-500'>
						AI: {image.predicted_condition ? image.predicted_condition.replace(/_/g, " ") : "—"}
						{image.confidence != null && ` (${formatConfidence(image.confidence)})`}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

export default function ReviewQueuePage() {
	const [tab, setTab] = useState<Tab>("pending");
	const [skip, setSkip] = useState(0);
	const [reviewedSkip, setReviewedSkip] = useState(0);
	const [reviewing, setReviewing] = useState<ImageType | null>(null);
	const [selectedConditionId, setSelectedConditionId] = useState("");
	const { data, isLoading } = useUnreviewedImages({
		skip: tab === "pending" ? skip : 0,
		limit: PAGE_SIZE,
	});
	const { data: reviewedData, isLoading: reviewedLoading } = useReviewedImages({
		skip: tab === "reviewed" ? reviewedSkip : 0,
		limit: PAGE_SIZE,
	});
	const { data: conditions } = useConditions();
	const updateReview = useUpdateImageReview();
	const { toast } = useToast();

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const hasMore = skip + items.length < total;
	const reviewedItems = reviewedData?.items ?? [];
	const reviewedTotal = reviewedData?.total ?? 0;
	const reviewedHasMore = reviewedSkip + reviewedItems.length < reviewedTotal;

	function handleSubmitReview() {
		if (!reviewing || !selectedConditionId) return;
		const condition = conditions?.find((c) => c.condition_id === selectedConditionId);
		const reviewedLabel = condition?.condition_name ?? selectedConditionId;
		updateReview.mutate(
			{ imageId: reviewing.image_id, reviewedLabel },
			{
				onSuccess: () => {
					toast("Review submitted", "success");
					setReviewing(null);
					setSelectedConditionId("");
				},
				onError: () => toast("Failed to submit review", "error"),
			},
		);
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Image Review Queue'
				description='Review and classify images for consultations'
			/>

			<div className='flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1'>
				<button
					type='button'
					onClick={() => setTab("pending")}
					className={cn(
						"flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
						tab === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
					)}
				>
					<CheckSquare className='h-4 w-4' />
					Pending review
					{total > 0 && (
						<Badge
							variant='warning'
							className='text-xs'
						>
							{total}
						</Badge>
					)}
				</button>
				<button
					type='button'
					onClick={() => setTab("reviewed")}
					className={cn(
						"flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
						tab === "reviewed"
							? "bg-white text-slate-900 shadow-sm"
							: "text-slate-600 hover:text-slate-900",
					)}
				>
					<Stethoscope className='h-4 w-4' />
					Reviewed
					{reviewedTotal > 0 && <span className='text-xs text-slate-500'>({reviewedTotal})</span>}
				</button>
			</div>

			{tab === "pending" && (
				<>
					{isLoading ? (
						<div className='grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
								<Skeleton
									key={i}
									className='h-[7.5rem] rounded-lg'
								/>
							))}
						</div>
					) : items.length === 0 ? (
						<div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-4 px-4 text-sm text-slate-500'>
							<CheckSquare className='h-5 w-5 shrink-0 text-slate-400' />
							<span>
								No images to review. Upload or attach images to a consultation to see them here.
							</span>
						</div>
					) : (
						<>
							<div className='grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
								{items.map((img) => (
									<PendingReviewCard
										key={img.image_id}
										image={img}
										onReview={setReviewing}
									/>
								))}
							</div>
							{hasMore && (
								<div className='flex justify-center'>
									<Button
										variant='outline'
										onClick={() => setSkip((s) => s + PAGE_SIZE)}
									>
										Load more
									</Button>
								</div>
							)}
						</>
					)}
				</>
			)}

			{tab === "reviewed" && (
				<>
					{reviewedLoading ? (
						<div className='grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
								<Skeleton
									key={i}
									className='h-[7.5rem] rounded-lg'
								/>
							))}
						</div>
					) : reviewedItems.length === 0 ? (
						<div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-4 px-4 text-sm text-slate-500'>
							<Stethoscope className='h-5 w-5 shrink-0 text-slate-400' />
							<span>No reviewed images yet. Classify images in Pending review to see them here.</span>
						</div>
					) : (
						<>
							<div className='grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
								{reviewedItems.map((img) => (
									<ReviewedCard
										key={img.image_id}
										image={img}
									/>
								))}
							</div>
							{reviewedHasMore && (
								<div className='flex justify-center'>
									<Button
										variant='outline'
										onClick={() => setReviewedSkip((s) => s + PAGE_SIZE)}
									>
										Load more
									</Button>
								</div>
							)}
						</>
					)}
				</>
			)}

			<Modal
				open={reviewing != null}
				onClose={() => {
					setReviewing(null);
					setSelectedConditionId("");
				}}
				title='Set review label'
			>
				{reviewing && (
					<div className='space-y-4'>
						<div className='relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100'>
							<Image
								src={reviewing.image_url}
								alt='Review'
								fill
								className='object-contain'
							/>
						</div>
						<p className='text-sm text-slate-600'>
							AI prediction:{" "}
							{reviewing.predicted_condition ? reviewing.predicted_condition.replace(/_/g, " ") : "—"} (
							{reviewing.confidence != null ? formatConfidence(reviewing.confidence) : "—"})
						</p>
						<label className='block text-sm font-medium text-slate-700'>Your classification</label>
						<ConditionSelect
							value={selectedConditionId}
							onChange={setSelectedConditionId}
							allowCustom={true}
						/>
						<div className='flex justify-end gap-2'>
							<Button
								variant='outline'
								onClick={() => {
									setReviewing(null);
									setSelectedConditionId("");
								}}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSubmitReview}
								disabled={!selectedConditionId}
								loading={updateReview.isPending}
							>
								Submit
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
