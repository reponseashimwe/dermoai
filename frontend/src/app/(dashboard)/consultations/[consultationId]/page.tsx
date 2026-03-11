"use client";

import { use, useState } from "react";
import { ConsultationDetail } from "@/components/consultations/consultation-detail";
import { ReviewList } from "@/components/clinical-reviews/review-list";
import { ClinicalReviewModal } from "@/components/consultations/clinical-review-modal";
import { EditReviewModal } from "@/components/clinical-reviews/edit-review-modal";
import { ReferConsultationModal } from "@/components/consultations/refer-consultation-modal";
import { RoleGate } from "@/components/auth/role-gate";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import { useQueryClient } from "@tanstack/react-query";
import { FileEdit } from "lucide-react";
import type { ClinicalReview } from "@/types/api";

function ReviewSection({ consultationId, hasImages }: { consultationId: string; hasImages: boolean }) {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const { data: practitioners } = usePractitioners();
	const [reviewModalOpen, setReviewModalOpen] = useState(false);
	const [editReview, setEditReview] = useState<ClinicalReview | null>(null);
	const [referModalOpen, setReferModalOpen] = useState(false);

	const currentPractitioner = practitioners?.find((p) => p.user_id === user?.user_id);
	const isApprovedPractitioner = currentPractitioner?.approval_status === "APPROVED";
	const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";
	const isClosed = queryClient.getQueryData<any>(["consultations", consultationId])?.status === "CLOSED";
	const showAddReview = hasImages && isApprovedPractitioner && user?.role === "PRACTITIONER" && !isClosed;

	return (
		<div className='space-y-4'>
			{/* Clinical Reviews */}
			<Card className='border border-slate-200 bg-white shadow-sm'>
				<CardHeader>
					<div className='flex items-center justify-between gap-2'>
						<h2 className='text-base font-semibold text-slate-900'>Clinical Reviews</h2>
						<RoleGate roles={["PRACTITIONER"]}>
							<div className='flex items-center gap-2'>
								{showAddReview && (
									<Button
										variant='outline'
										size='sm'
										onClick={() => setReviewModalOpen(true)}
									>
										<FileEdit className='h-4 w-4' />
										Add
									</Button>
								)}
								{isApprovedPractitioner && !isClosed && showAddReview && (
									<Button
										variant='outline'
										size='sm'
										onClick={() => setReferModalOpen(true)}
									>
										Refer
									</Button>
								)}
							</div>
						</RoleGate>
					</div>
				</CardHeader>
				<CardContent className='space-y-3'>
					<ReviewList
						consultationId={consultationId}
						currentPractitioner={currentPractitioner}
						onEditReview={setEditReview}
					/>
				</CardContent>
			</Card>

			<ClinicalReviewModal
				open={reviewModalOpen}
				onClose={() => setReviewModalOpen(false)}
				consultationId={consultationId}
				canMarkFinal={!!isSpecialist}
				onSuccess={() => {
					queryClient.invalidateQueries({
						queryKey: ["clinical-reviews", consultationId],
					});
					queryClient.invalidateQueries({
						queryKey: ["consultations", consultationId],
					});
				}}
			/>

			<EditReviewModal
				open={editReview !== null}
				onClose={() => setEditReview(null)}
				review={editReview}
				onSuccess={() => {
					setEditReview(null);
					queryClient.invalidateQueries({
						queryKey: ["clinical-reviews", consultationId],
					});
				}}
			/>

			<ReferConsultationModal
				open={referModalOpen}
				onClose={() => setReferModalOpen(false)}
				consultationId={consultationId}
				onSuccess={() => {
					queryClient.invalidateQueries({
						queryKey: ["consultations", consultationId],
					});
				}}
			/>
		</div>
	);
}

export default function ConsultationDetailPage({ params }: { params: Promise<{ consultationId: string }> }) {
	const { consultationId } = use(params);

	return (
		<ConsultationDetail
			consultationId={consultationId}
			reviewSection={(hasImages) => (
				<ReviewSection
					consultationId={consultationId}
					hasImages={hasImages}
				/>
			)}
		/>
	);
}
