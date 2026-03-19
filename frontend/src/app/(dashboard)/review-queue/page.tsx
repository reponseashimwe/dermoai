"use client";

import { useState } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConditionSelect } from "@/components/clinical-review/condition-select";
import { Badge } from "@/components/ui/badge";
import { ImageDetailModal } from "@/components/images/image-detail-modal";
import { Pagination } from "@/components/ui/pagination";
import { useUnreviewedImages, useReviewedImages, useUpdateImageReview } from "@/hooks/use-images";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import { useConditions } from "@/hooks/use-conditions";
import { useToast } from "@/components/ui/toast";
import { formatConfidence, formatDate } from "@/lib/utils";
import { CheckCircle, CheckSquare, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Image as ImageType } from "@/types/api";

const PAGE_SIZE = 12;
type Tab = "pending" | "reviewed";

function PendingReviewCard({ image, onClick }: { image: ImageType; onClick: () => void }) {
	const urgency = image.urgency ?? "REFER";
	return (
		<Card
			className='cursor-pointer overflow-hidden transition-shadow hover:shadow-md'
			onClick={onClick}
		>
			<CardContent className='p-0'>
				<div className='relative h-[140px] w-full overflow-hidden bg-slate-100'>
					<Image
						src={image.image_url}
						alt='Skin condition'
						fill
						className='object-cover'
						sizes='(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw'
					/>
				</div>
				<div className='p-3'>
					<p className='truncate text-sm font-medium text-slate-900'>
						{image.predicted_condition ? image.predicted_condition.replace(/_/g, " ") : "—"}
					</p>
					<p className='text-xs text-slate-500'>{formatDate(image.uploaded_at)}</p>
					{image.confidence != null && (
						<div className='mt-2 flex items-center gap-2'>
							<div className='h-1.5 w-14 overflow-hidden rounded-full bg-slate-200'>
								<div
									className={cn(
										"h-full rounded-full transition-[width]",
										urgency === "REFER" ? "bg-amber-500" : "bg-primary-600",
									)}
									style={{ width: `${Math.round(image.confidence * 100)}%` }}
								/>
							</div>
							<span className='text-xs font-medium tabular-nums text-slate-600'>
								{formatConfidence(image.confidence)}
							</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function ReviewedCard({ image, onClick }: { image: ImageType; onClick: () => void }) {
	const urgency = image.urgency ?? "REFER";
	return (
		<Card
			className='cursor-pointer overflow-hidden transition-shadow hover:shadow-md'
			onClick={onClick}
		>
			<CardContent className='p-0'>
				<div className='relative h-[140px] w-full overflow-hidden bg-slate-100'>
					<Image
						src={image.image_url}
						alt='Skin condition'
						fill
						className='object-cover'
						sizes='(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw'
					/>
					<div className='absolute left-2 top-2'>
						<Badge
							variant={image.reviewed_as_final ? "safe" : "info"}
							className='text-xs'
						>
							{image.reviewed_as_final ? "Final" : "Doctor"}
						</Badge>
					</div>
				</div>
				<div className='p-3'>
					{image.reviewed_label && (
						<div className='flex items-center gap-1.5'>
							<CheckCircle
								className='h-4 w-4 shrink-0 text-primary-600'
								aria-hidden
							/>
							<p className='truncate text-sm font-bold text-slate-900'>
								{image.reviewed_label.replace(/_/g, " ")}
							</p>
						</div>
					)}
					<p className='text-xs text-slate-500 mt-0.5'>
						AI: {image.predicted_condition ? image.predicted_condition.replace(/_/g, " ") : "—"}
					</p>
					<p className='text-xs text-slate-500'>{formatDate(image.uploaded_at)}</p>
					{image.confidence != null && (
						<div className='mt-2 flex items-center gap-2'>
							<div className='h-1.5 w-14 overflow-hidden rounded-full bg-slate-200'>
								<div
									className={cn(
										"h-full rounded-full transition-[width]",
										urgency === "REFER" ? "bg-amber-500" : "bg-primary-600",
									)}
									style={{ width: `${Math.round(image.confidence * 100)}%` }}
								/>
							</div>
							<span className='text-xs font-medium tabular-nums text-slate-600'>
								{formatConfidence(image.confidence)}
							</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

export default function ReviewQueuePage() {
	const { user } = useAuth();
	const { data: practitioners } = usePractitioners();
	const currentPractitioner = practitioners?.find((p) => p.user_id === user?.user_id);
	const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";

	// Hard guard: only specialists can access this page
	if (!user || user.role !== "PRACTITIONER" || !isSpecialist) {
		return (
			<div className='space-y-4'>
				<PageHeader
					title='Image Review Queue'
					description='Only specialist doctors can access the review queue.'
				/>
				<Card>
					<CardContent className='py-6 text-sm text-slate-600'>
						You do not have access to this page.
					</CardContent>
				</Card>
			</div>
		);
	}
	const [tab, setTab] = useState<Tab>("pending");
	const [skip, setSkip] = useState(0);
	const [reviewedSkip, setReviewedSkip] = useState(0);
	const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
	const [reviewMode, setReviewMode] = useState(false);
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
	const reviewedItems = reviewedData?.items ?? [];
	const reviewedTotal = reviewedData?.total ?? 0;

	function handleSubmitReview() {
		if (!selectedImageId || !selectedConditionId) return;
		const condition = conditions?.find((c) => c.condition_id === selectedConditionId);
		const reviewedLabel = condition?.condition_name ?? selectedConditionId;
		updateReview.mutate(
			{ imageId: selectedImageId, reviewedLabel },
			{
				onSuccess: () => {
					toast("Review submitted", "success");
					setSelectedImageId(null);
					setReviewMode(false);
					setSelectedConditionId("");
				},
				onError: () => toast("Failed to submit review", "error"),
			},
		);
	}

	function closeModal() {
		setSelectedImageId(null);
		setReviewMode(false);
		setSelectedConditionId("");
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
						<div className='grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
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
							<div className='grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
								{items.map((img) => (
									<PendingReviewCard
										key={img.image_id}
										image={img}
										onClick={() => {
											setSelectedImageId(img.image_id);
											setReviewMode(true);
											setSelectedConditionId("");
										}}
									/>
								))}
							</div>
							<Pagination
								skip={skip}
								pageSize={PAGE_SIZE}
								total={total}
								onPageChange={setSkip}
								className='mt-6'
							/>
						</>
					)}
				</>
			)}

			{tab === "reviewed" && (
				<>
					{reviewedLoading ? (
						<div className='grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
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
							<div className='grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
								{reviewedItems.map((img) => (
									<ReviewedCard
										key={img.image_id}
										image={img}
										onClick={() => {
											setSelectedImageId(img.image_id);
											setReviewMode(false);
										}}
									/>
								))}
							</div>
							<Pagination
								skip={reviewedSkip}
								pageSize={PAGE_SIZE}
								total={reviewedTotal}
								onPageChange={setReviewedSkip}
								className='mt-6'
							/>
						</>
					)}
				</>
			)}

			<ImageDetailModal
				imageId={selectedImageId}
				open={selectedImageId !== null}
				onClose={closeModal}
				hideActions
				hideConditionInfo={reviewMode}
				reviewMode={reviewMode}
				footer={
					reviewMode ? (
						<div className='space-y-4'>
							<ConditionSelect
								value={selectedConditionId}
								onChange={setSelectedConditionId}
								allowCustom={true}
							/>
							<div className='flex justify-end gap-2'>
								<Button
									variant='outline'
									onClick={closeModal}
								>
									Cancel
								</Button>
								<Button
									onClick={handleSubmitReview}
									disabled={!selectedConditionId}
									loading={updateReview.isPending}
								>
									Submit review
								</Button>
							</div>
						</div>
					) : undefined
				}
			/>
		</div>
	);
}
