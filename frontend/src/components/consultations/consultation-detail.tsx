"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	useConsultation,
	useSetConsultationImagesConsent,
	useCloseConsultation,
	useReopenConsultation,
} from "@/hooks/use-consultations";
import { useConsultationImages } from "@/hooks/use-images";
import { usePatient } from "@/hooks/use-patients";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import { useConsultationReviews } from "@/hooks/use-clinical-reviews";
import {
	useAppointmentsByConsultation,
	useStartCallFromAppointment,
	useDeleteAppointmentRequest,
} from "@/hooks/use-appointments";
import { useTeleconsultationsByConsultation } from "@/hooks/use-teleconsultations";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultationStatusBadge } from "./consultation-status-badge";
import { ConsentPinModal } from "./consent-pin-modal";
import { Switch } from "@/components/ui/switch";
import { AggregatedResultCard } from "@/components/images/aggregated-result-card";
import { TreatmentOutcomeCard } from "@/components/consultations/treatment-outcome-card";
import { ImageGallery } from "@/components/images/image-gallery";
import { ImageUploadZone } from "@/components/images/image-upload-zone";
import { AttachScanModal } from "@/components/images/attach-scan-modal";
import { UrgentConsultationBanner } from "@/components/telemedicine/urgent-consultation-banner";
import { CreateAppointmentModal } from "@/components/appointments/create-appointment-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import {
	Paperclip,
	User,
	ArrowLeft,
	ShieldCheck,
	ShieldX,
	Calendar,
	Clock,
	Trash2,
	Phone,
	XCircle,
	RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsultationDetailProps {
	consultationId: string;
	/** Receives hasImages so review/book actions can be disabled when no images */
	reviewSection?: (hasImages: boolean) => React.ReactNode;
}

export function ConsultationDetail({ consultationId, reviewSection }: ConsultationDetailProps) {
	const { user } = useAuth();
	const { data: practitioners } = usePractitioners();
	const { data: consultation, isLoading } = useConsultation(consultationId);
	const { data: patient } = usePatient(consultation?.patient_id || "");
	const { data: images, refetch: refetchImages } = useConsultationImages(consultationId);
	const { data: reviews } = useConsultationReviews(consultationId);
	const router = useRouter();
	const { toast } = useToast();
	const { data: appointments, refetch: refetchAppointments } = useAppointmentsByConsultation(consultationId);
	const { data: teleconsultations } = useTeleconsultationsByConsultation(consultationId);
	const startCall = useStartCallFromAppointment();
	const deleteAppointment = useDeleteAppointmentRequest();
	const setConsentMutation = useSetConsultationImagesConsent();
	const closeConsultation = useCloseConsultation();
	const reopenConsultation = useReopenConsultation();
	const [attachOpen, setAttachOpen] = useState(false);
	const [consentPinOpen, setConsentPinOpen] = useState(false);
	const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [openDetailImageId, setOpenDetailImageId] = useState<string | null>(null);

	async function handleAppointmentCall(requestId: string) {
		try {
			const data = await startCall.mutateAsync(requestId);
			router.push(`/teleconsultations/${data.teleconsultation_id}`);
		} catch {
			toast("Could not start call. Try the Call page if no specialist is assigned.", "error");
		}
	}

	async function handleConfirmDelete() {
		if (!deleteTargetId) return;
		try {
			await deleteAppointment.mutateAsync(deleteTargetId);
			toast("Appointment deleted", "success");
			setDeleteTargetId(null);
		} catch {
			toast("Could not delete appointment", "error");
		}
	}

	const isPractitioner = user?.role === "PRACTITIONER";
	const isPatient = consultation?.created_by === user?.user_id;
	const currentPractitioner = practitioners?.find((p) => p.user_id === user?.user_id);
	const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";
	const canChangeConsent = isPatient;
	const isClosed = consultation?.status === "CLOSED";
	/** For appointment cards: show the other party (never the current user). Specialist sees requester; patient/GP sees specialist. */
	const getAppointmentOtherParty = (apt: { specialist_name?: string | null; requester_name?: string | null }) =>
		isSpecialist ? apt.requester_name : apt.specialist_name;

	/** Latest appointment that is not rejected and not done (PENDING, APPROVED, RESCHEDULED); prefer next upcoming by date. */
	const latestActiveAppointment = (() => {
		const active = (appointments ?? []).filter((a) => a.status !== "REJECTED");
		if (active.length === 0) return null;
		const sorted = [...active].sort(
			(a, b) => new Date(b.proposed_datetime).getTime() - new Date(a.proposed_datetime).getTime(),
		);
		return sorted[0];
	})();

	const hasImages = (images?.length ?? 0) > 0;
	const allConsented = hasImages && images!.every((img) => img.consent_to_reuse);

	if (isLoading) {
		return (
			<div className='space-y-4'>
				<Skeleton className='h-12 w-full' />
				<Skeleton className='h-48 w-full' />
				<Skeleton className='h-64 w-full' />
			</div>
		);
	}

	if (!consultation) return null;

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<Link
					href='/consultations'
					className='inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900'
				>
					<ArrowLeft className='h-4 w-4' />
					Back
				</Link>
				<div className='flex items-center gap-2'>
					{latestActiveAppointment && (
						<div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700'>
							<Clock className='h-3 w-3 shrink-0 text-slate-400' />
							<span>
								Next:{" "}
								<strong>
									{formatDate(
										latestActiveAppointment.status === "RESCHEDULED" &&
											latestActiveAppointment.specialist_proposed_datetime
											? latestActiveAppointment.specialist_proposed_datetime
											: latestActiveAppointment.proposed_datetime,
									)}
								</strong>
							</span>
							{latestActiveAppointment.status === "APPROVED" && (
								<Button
									size='sm'
									variant='outline'
									onClick={() => handleAppointmentCall(latestActiveAppointment.request_id)}
									loading={startCall.isPending}
									className='h-7 text-xs'
								>
									<Phone className='h-3 w-3' />
									Call
								</Button>
							)}
						</div>
					)}
					{isClosed ? (
						<Button
							variant='outline'
							size='sm'
							onClick={() => reopenConsultation.mutate(consultationId)}
							loading={reopenConsultation.isPending}
						>
							<RotateCcw className='h-4 w-4' />
							Reopen
						</Button>
					) : (
						<Button
							variant='outline'
							size='sm'
							onClick={() => closeConsultation.mutate(consultationId)}
							loading={closeConsultation.isPending}
							className='text-slate-600 hover:text-red-700 hover:border-red-200'
						>
							<XCircle className='h-4 w-4' />
							Close
						</Button>
					)}
				</div>
			</div>

			<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-2xl font-bold text-slate-900'>Consultation</h1>
					<p className='text-sm text-slate-500'>Created {formatDate(consultation.created_at)}</p>
				</div>
				<ConsultationStatusBadge status={consultation.status} />
			</div>

			{consultation.urgency === "REFER" &&
				consultation.status !== "CLOSED" &&
				!consultation.has_appointments &&
				!consultation.has_teleconsultation && (
				<UrgentConsultationBanner consultationId={consultation.consultation_id} />
			)}

			{/* Main grid: left = patient + practitioner + images, right = result + reviews */}
			<div className='grid gap-4 lg:grid-cols-[1fr_1.2fr]'>
				{/* Left column */}
				<div className='space-y-4'>
					{/* Patient + Practitioner cards side by side */}
					<div className='grid gap-4 sm:grid-cols-2'>
						{patient && (
							<Card className='border border-slate-200 bg-[#f7f5f3] overflow-hidden'>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 border-b border-slate-200/80'>
									<h2 className='text-xs font-semibold uppercase tracking-wider text-slate-600'>Patient</h2>
									<span className='text-xs text-slate-500'>{consultation && formatDate(consultation.created_at)}</span>
								</CardHeader>
								<CardContent className='flex items-center gap-3 pt-4'>
									<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white'>
										{patient.name
											.split(" ")
											.map((s) => s[0])
											.filter(Boolean)
											.slice(0, 2)
											.join("")
											.toUpperCase()}
									</div>
									<div className='min-w-0 flex-1'>
										<p className='font-semibold text-slate-900'>{patient.name}</p>
										{patient.phone_number && (
											<p className='text-xs text-slate-600'>{patient.phone_number}</p>
										)}
										<p className='text-xs text-slate-500 mt-0.5'>
											Consultation #{consultation?.consultation_id?.slice(0, 8) ?? "—"}
										</p>
									</div>
								</CardContent>
							</Card>
						)}
						{(() => {
							const fromReviews = [...new Set((reviews ?? []).map((r) => r.practitioner_name).filter(Boolean))] as string[];
							const fromAppointments = [...new Set((appointments ?? []).map((a) => (a as { specialist_name?: string | null }).specialist_name).filter(Boolean))] as string[];
							const allNames = [...new Set([...fromReviews, ...fromAppointments])];
							const treatingReview = reviews?.length
								? [...reviews].sort((a, b) => {
										if (a.is_final && !b.is_final) return -1;
										if (!a.is_final && b.is_final) return 1;
										return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
								  })[0]
								: null;
							const practitionerName = treatingReview?.practitioner_name ?? allNames[0] ?? null;
							const creatorPractitioner = consultation?.created_by
								? practitioners?.find((p) => p.user_id === consultation.created_by)
								: null;
							const displayName = practitionerName ?? creatorPractitioner?.name ?? null;
							const displaySubtext =
								treatingReview
									? 'Treating clinician'
									: fromAppointments.length
										? 'Scheduled for call'
										: fromReviews.length
											? 'From review'
											: creatorPractitioner
												? 'Consultation creator'
												: null;
							if (!displayName && allNames.length === 0) {
								return (
									<Card className='border border-slate-200 bg-[#f7f5f3] overflow-hidden'>
										<CardHeader className='pb-2 border-b border-slate-200/80'>
											<h2 className='text-xs font-semibold uppercase tracking-wider text-slate-600'>Practitioner</h2>
										</CardHeader>
										<CardContent className='pt-4'>
											<p className='text-sm text-slate-500'>No review assigned yet</p>
										</CardContent>
									</Card>
								);
							}
							const nameToShow = displayName ?? allNames[0];
							const initials = nameToShow.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
							return (
								<Card className='border border-slate-200 bg-[#f7f5f3] overflow-hidden'>
									<CardHeader className='pb-2 border-b border-slate-200/80'>
										<h2 className='text-xs font-semibold uppercase tracking-wider text-slate-600'>Practitioner</h2>
									</CardHeader>
									<CardContent className='pt-4 space-y-2'>
										<div className='flex items-center gap-3'>
											<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white'>
												{initials}
											</div>
											<div className='min-w-0 flex-1'>
												<p className='font-semibold text-slate-900'>{nameToShow}</p>
												{displaySubtext && (
													<p className='text-xs text-slate-500'>{displaySubtext}</p>
												)}
											</div>
										</div>
										{allNames.length > 1 && (
											<p className='text-xs text-slate-500 border-t border-slate-200/80 pt-2'>
												Involved: {allNames.join(', ')}
											</p>
										)}
									</CardContent>
								</Card>
							);
						})()}
					</div>

					{/* Images */}
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between gap-2'>
								<h2 className='text-base font-semibold text-slate-900'>Images</h2>
								<div className='flex gap-1.5'>
									<ImageUploadZone
									consultationId={consultationId}
									compact
									onUploadSuccess={setOpenDetailImageId}
								/>
									<Button variant='outline' size='sm' onClick={() => setAttachOpen(true)}>
										<Paperclip className='h-4 w-4' />
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className='space-y-3'>
							{hasImages && (
								<div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2'>
									<div className='flex items-center gap-2 min-w-0 flex-1'>
										{allConsented ? (
											<ShieldCheck className='h-4 w-4 shrink-0 text-green-600' />
										) : (
											<ShieldX className='h-4 w-4 shrink-0 text-slate-400' />
										)}
										<span className='text-xs text-slate-700 truncate'>
											{allConsented
												? "Consent granted for reuse in model improvement"
												: "Consent for model improvement"}
										</span>
									</div>
									<div className='flex items-center gap-2 shrink-0'>
										<Switch
											checked={allConsented}
											onCheckedChange={(checked) =>
												setConsentMutation.mutate({ consultationId, consentToReuse: checked })
											}
											disabled={!canChangeConsent || setConsentMutation.isPending}
										/>
										{isPractitioner && !allConsented && (
											<Button
												onClick={() => setConsentPinOpen(true)}
												size='sm'
												variant='outline'
												className='h-7 text-xs'
											>
												Request SMS
											</Button>
										)}
									</div>
								</div>
							)}

							<ImageGallery
								consultationId={consultationId}
								showConsentCheckboxes={false}
								openDetailImageId={openDetailImageId}
								onCloseDetail={() => setOpenDetailImageId(null)}
							/>
						</CardContent>
					</Card>

					{/* Appointments and Teleconsultations side by side */}
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<div className='flex items-center justify-between gap-2'>
									<h2 className='text-base font-semibold text-slate-900'>Appointments</h2>
									{isPractitioner && hasImages && (
										<Button size='sm' onClick={() => setAppointmentModalOpen(true)}>
											<Calendar className='h-4 w-4' />
											Book
										</Button>
									)}
								</div>
							</CardHeader>
							<CardContent>
								{!appointments || appointments.length === 0 ? (
									<p className='py-3 text-center text-sm text-slate-500'>No appointments yet</p>
								) : (
									<div className='space-y-2'>
										{appointments.map((apt) => (
											<div
												key={apt.request_id}
												className='flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5'
											>
												<div className='flex items-center gap-2 min-w-0 flex-1'>
													<Clock className='h-3.5 w-3.5 shrink-0 text-slate-400' />
													<div className='min-w-0'>
														<p className='text-sm font-medium text-slate-900'>
															{formatDate(apt.proposed_datetime)}
														</p>
														{getAppointmentOtherParty(apt) && (
															<p className='text-xs text-slate-500'>
																{isSpecialist ? "By: " : "With: "}
																{getAppointmentOtherParty(apt)}
															</p>
														)}
													</div>
												</div>
												<div className='flex items-center gap-1.5'>
													<span
														className={cn(
															"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
															apt.status === "APPROVED" && "bg-green-100 text-green-800",
															apt.status === "PENDING" && "bg-amber-100 text-amber-800",
															apt.status === "REJECTED" && "bg-red-100 text-red-800",
															apt.status === "RESCHEDULED" && "bg-blue-100 text-blue-800",
														)}
													>
														{apt.status}
													</span>
													{user?.user_id === apt.requested_by_user_id && (
														<Button
															size='sm'
															variant='outline'
															className='h-7 w-7 p-0 text-red-600 hover:bg-red-50'
															onClick={() => setDeleteTargetId(apt.request_id)}
														>
															<Trash2 className='h-3.5 w-3.5' />
														</Button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<h2 className='text-base font-semibold text-slate-900'>Teleconsultations</h2>
							</CardHeader>
							<CardContent>
								{!teleconsultations || teleconsultations.length === 0 ? (
									<p className='py-3 text-center text-sm text-slate-500'>No calls yet</p>
								) : (
									<div className='space-y-2'>
										{teleconsultations.map((tc) => (
											<div
												key={tc.teleconsultation_id}
												className='flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2.5'
											>
												<div className='flex items-center gap-2 min-w-0 flex-1'>
													<Phone className='h-3.5 w-3.5 shrink-0 text-slate-400' />
													<div className='min-w-0'>
														<p className='text-sm font-medium text-slate-900'>
															{formatDate(tc.created_at)}
														</p>
														{tc.started_at && (
															<p className='text-xs text-slate-500'>
																Started {formatDate(tc.started_at)}
																{tc.ended_at && ` • Ended ${formatDate(tc.ended_at)}`}
															</p>
														)}
													</div>
												</div>
												<div className='flex items-center gap-1.5'>
													<span
														className={cn(
															"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
															tc.status === "ACTIVE" && "bg-green-100 text-green-800",
															tc.status === "PENDING" && "bg-amber-100 text-amber-800",
															(tc.status === "ENDED" || !["ACTIVE", "PENDING"].includes(tc.status)) && "bg-slate-100 text-slate-700",
														)}
													>
														{tc.status}
													</span>
													{(tc.status === "ACTIVE" || tc.status === "PENDING") && (
														<Button
															size='sm'
															onClick={() => router.push(`/teleconsultations/${tc.teleconsultation_id}`)}
															className='h-7 text-xs'
														>
															<Phone className='h-3 w-3' />
															Join
														</Button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Right column: Result + Treatment grid, then Reviews */}
				<div className='space-y-4'>
					<div className='grid gap-4 sm:grid-cols-2'>
						<AggregatedResultCard consultation={consultation} images={images ?? undefined} />
						<TreatmentOutcomeCard consultation={consultation} />
					</div>
					{reviewSection?.(hasImages)}
				</div>
			</div>

			<AttachScanModal
				open={attachOpen}
				onClose={() => setAttachOpen(false)}
				consultationId={consultationId}
				onAttachSuccess={setOpenDetailImageId}
			/>

			<ConsentPinModal
				open={consentPinOpen}
				onClose={() => setConsentPinOpen(false)}
				consultationId={consultationId}
				onSuccess={() => {
					refetchImages();
				}}
			/>

			<CreateAppointmentModal
				open={appointmentModalOpen}
				onClose={() => setAppointmentModalOpen(false)}
				consultationId={consultationId}
				onSuccess={() => {
					refetchAppointments();
				}}
			/>

			<ConfirmDialog
				open={deleteTargetId !== null}
				onClose={() => setDeleteTargetId(null)}
				title='Delete appointment'
				description='This appointment will be removed. You can create a new one from this consultation if needed.'
				confirmLabel='Delete'
				cancelLabel='Cancel'
				variant='destructive'
				onConfirm={handleConfirmDelete}
				loading={deleteAppointment.isPending}
			/>
		</div>
	);
}
