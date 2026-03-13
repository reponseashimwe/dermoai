"use client";

import { useState } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageDetailModal } from "@/components/images/image-detail-modal";
import { Pagination } from "@/components/ui/pagination";
import { useAllImages } from "@/hooks/use-images";
import { formatConditionName, formatConfidence, formatDate } from "@/lib/utils";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Image as ImageType } from "@/types/api";

const PAGE_SIZE = 24;

export default function AdminImagesPage() {
	const [skip, setSkip] = useState(0);
	const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
	const { data, isLoading } = useAllImages({
		skip,
		limit: PAGE_SIZE,
		consent_to_reuse: true,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;

	if (isLoading) {
		return (
			<div className='space-y-6'>
				<PageHeader
					title='Images'
					description='Images that have patient consent for reuse in model improvement.'
				/>
				<div className='grid gap-4 grid-cols-1'>
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Skeleton
							key={i}
							className='h-32 w-full rounded-xl'
						/>
					))}
				</div>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className='space-y-6'>
				<PageHeader
					title='Images'
					description='Images that have patient consent for reuse in model improvement.'
				/>
				<EmptyState
					icon={<ImageIcon className='h-12 w-12' />}
					title='No images yet'
					description='Images will appear here as users upload and attach scans.'
				/>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Images'
				description='Images that have patient consent for reuse in model improvement.'
			/>

			<div className='grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8'>
				{items.map((img) => {
					const urgency = img.predicted_condition === "UNCERTAIN" || (img.confidence ?? 0) < 0.35 ? "REFER" : "MANAGE LOCALLY";
					return (
						<Card
							key={img.image_id}
							className='cursor-pointer overflow-hidden transition-shadow hover:shadow-md'
							onClick={() => setSelectedImageId(img.image_id)}
						>
							<CardContent className='p-0'>
								<div className='relative h-[140px] w-full overflow-hidden bg-slate-100'>
									<Image
										src={img.image_url}
										alt='Scan'
										fill
										className='object-cover'
										sizes='(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw'
									/>
								</div>
								<div className='p-3'>
									<p className='truncate text-sm font-medium text-slate-900'>
										{img.predicted_condition
											? formatConditionName(img.predicted_condition)
											: "Pending"}
									</p>
									{img.reviewed_label && (
										<p className='mt-0.5 truncate text-xs text-primary-600'>
											Verified: {formatConditionName(img.reviewed_label)}
										</p>
									)}
									<p className='mt-0.5 text-xs text-slate-500'>{formatDate(img.uploaded_at)}</p>
									{img.confidence != null && (
										<div className='mt-2 flex items-center gap-2'>
											<div className='h-1.5 w-14 overflow-hidden rounded-full bg-slate-200'>
												<div
													className={cn(
														"h-full rounded-full transition-[width]",
														urgency === "REFER" ? "bg-amber-500" : "bg-primary-600",
													)}
													style={{ width: `${Math.round((img.confidence ?? 0) * 100)}%` }}
												/>
											</div>
											<span className='text-xs font-medium tabular-nums text-slate-600'>
												{formatConfidence(img.confidence)}
											</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<Pagination
				skip={skip}
				pageSize={PAGE_SIZE}
				total={total}
				onPageChange={setSkip}
				className='mt-6'
			/>

			<ImageDetailModal
				imageId={selectedImageId}
				open={selectedImageId !== null}
				onClose={() => setSelectedImageId(null)}
				hideActions
			/>
		</div>
	);
}
