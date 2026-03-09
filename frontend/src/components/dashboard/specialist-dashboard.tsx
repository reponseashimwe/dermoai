"use client";

import Link from "next/link";
import Image from "next/image";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePractitionerStats } from "@/hooks/use-stats";
import { useUnreviewedImages } from "@/hooks/use-images";
import { useConsultations } from "@/hooks/use-consultations";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners, useUpdateMyStatus } from "@/hooks/use-practitioners";
import {
	usePendingAppointmentCount,
	useIncomingAppointmentRequests,
	type AppointmentRequest,
} from "@/hooks/use-appointments";
import {
	FileText,
	ClipboardCheck,
	AlertTriangle,
	CheckSquare,
	Stethoscope,
	Calendar,
	ScanLine,
	User,
	Video,
} from "lucide-react";
import { SPECIALIST_DASHBOARD_CONFIG } from "@/config/roles";
import { cn, formatDate } from "@/lib/utils";
import type { PractitionerStats } from "@/types/api";

const PREVIEW_IMAGES = 3;

const APPOINTMENT_STATUS_STYLES: Record<AppointmentRequest["status"], string> = {
	PENDING: "bg-amber-100 text-amber-800",
	APPROVED: "bg-green-100 text-green-800",
	REJECTED: "bg-red-100 text-red-800",
	RESCHEDULED: "bg-blue-100 text-blue-800",
};

function AppointmentStatusPill({ status }: { status: AppointmentRequest["status"] }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold",
				APPOINTMENT_STATUS_STYLES[status],
			)}
		>
			{status}
		</span>
	);
}

export function SpecialistDashboard() {
	const { user } = useAuth();
	const { data: practitioners } = usePractitioners();
	const { data: stats, isLoading } = usePractitionerStats(true);
	const { data: unreviewedData } = useUnreviewedImages({ skip: 0, limit: Math.max(PREVIEW_IMAGES, 10) });
	const { data: consultations } = useConsultations();
	const { data: pendingAppointmentCount } = usePendingAppointmentCount();
	const { data: appointmentRequests } = useIncomingAppointmentRequests();
	const updateStatus = useUpdateMyStatus();

	const currentPractitioner = user ? practitioners?.find((p) => p.user_id === user.user_id) : undefined;
	const isOnline = updateStatus.data?.is_online ?? currentPractitioner?.is_online ?? false;

	const pendingReviewCount = unreviewedData?.total ?? 0;
	const unreviewedItems = unreviewedData?.items ?? [];
	const previewImages = unreviewedItems
		.slice()
		.sort(() => Math.random() - 0.5)
		.slice(0, PREVIEW_IMAGES);
	const recentConsultations = consultations?.slice(0, 5) ?? [];
	const pendingAppointments = appointmentRequests?.slice(0, 3) ?? [];
	const s = stats as PractitionerStats;

	if (isLoading || !stats) {
		return (
			<div className='space-y-4'>
				<Skeleton className='h-10 w-64' />
				<div className='grid gap-5 grid-cols-2 md:grid-cols-4'>
					{[1, 2, 3, 4].map((i) => (
						<Skeleton
							key={i}
							className='h-20'
						/>
					))}
				</div>
			</div>
		);
	}

	const config = SPECIALIST_DASHBOARD_CONFIG;

	return (
		<div className='flex min-h-0 flex-col gap-6 pb-6'>
			<div className='flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-xl font-bold text-slate-900 sm:text-2xl'>Specialist Dashboard</h1>
					<p className='text-sm text-slate-600'>{config.description}</p>
				</div>
				<div className='flex items-center gap-3'>
					<span className='text-sm font-medium text-slate-700'>{isOnline ? "Online" : "Offline"}</span>
					<button
						type='button'
						onClick={() => updateStatus.mutate({ is_online: !isOnline })}
						className='rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'
					>
						Go {isOnline ? "Offline" : "Online"}
					</button>
				</div>
			</div>

			{/* Stats: Pending Consults, Appointments, Consultations to Refer, My Reviews */}
			<div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
				<StatCard
					compact
					label='Pending Consults'
					value={s.pending_consultations}
					icon={FileText}
					color='amber'
					href='/consultations'
				/>
				<StatCard
					compact
					label='Appointments'
					value={pendingAppointmentCount ?? 0}
					icon={Calendar}
					color='purple'
					subtext='Requests'
					href='/appointments'
				/>
				<StatCard
					compact
					label='Consultations'
					value={s.urgent_cases}
					icon={AlertTriangle}
					color='amber'
					href='/consultations?filter=refer'
				/>
				<StatCard
					compact
					label='My Reviews'
					value={s.my_reviews}
					icon={ClipboardCheck}
					color='primary'
					href='/review-queue'
				/>
			</div>

			{/* Three columns: Quick actions, Consultations to Refer, Review preview + Schedules */}
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				<Card className='border border-slate-200'>
					<CardHeader className='pb-4'>
						<h2 className='text-lg font-semibold text-slate-900'>Quick actions</h2>
					</CardHeader>
					<CardContent className='space-y-3 pt-0'>
						<Link
							href='/scan-history'
							className='block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30'
						>
							<div className='flex items-center gap-3'>
								<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700'>
									<ScanLine className='h-4 w-4' />
								</div>
								<div>
									<p className='text-sm font-semibold text-slate-900'>Quick Scan</p>
									<p className='text-xs text-slate-500'>Upload for instant AI analysis</p>
								</div>
							</div>
						</Link>
						<Link
							href='/consultations/new'
							className='block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30'
						>
							<div className='flex items-center gap-3'>
								<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700'>
									<FileText className='h-4 w-4' />
								</div>
								<div>
									<p className='text-sm font-semibold text-slate-900'>New Consultation</p>
									<p className='text-xs text-slate-500'>Start a new case</p>
								</div>
							</div>
						</Link>
						<Link
							href='/review-queue'
							className='block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30'
						>
							<div className='flex items-center gap-3'>
								<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700'>
									<Stethoscope className='h-4 w-4' />
								</div>
								<div>
									<p className='text-sm font-semibold text-slate-900'>Review Queue</p>
									<p className='text-xs text-slate-500'>Classify images</p>
								</div>
							</div>
						</Link>
						<Link
							href='/appointments'
							className='block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30'
						>
							<div className='flex items-center gap-3'>
								<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700'>
									<Calendar className='h-4 w-4' />
								</div>
								<div>
									<p className='text-sm font-semibold text-slate-900'>Appointments</p>
									<p className='text-xs text-slate-500'>View requests and schedules</p>
								</div>
							</div>
						</Link>
					</CardContent>
				</Card>

				<Card className='border border-slate-200'>
					<CardHeader className='flex flex-row items-center justify-between pb-4'>
						<h2 className='text-lg font-semibold text-slate-900'>My recent consultations</h2>
						<Link
							href='/consultations'
							className='text-sm font-medium text-primary-600 hover:underline'
						>
							View all
						</Link>
					</CardHeader>
					<CardContent className='pt-0'>
						{recentConsultations.length === 0 ? (
							<div className='py-8 text-center'>
								<p className='text-base text-slate-500'>No consultations yet.</p>
								<Link
									href='/consultations/new'
									className='mt-3 inline-block text-sm font-medium text-primary-600 hover:underline'
								>
									New consultation
								</Link>
							</div>
						) : (
							<div className='space-y-5 grid'>
								{recentConsultations.map((c) => (
									<ConsultationCard
										key={c.consultation_id}
										consultation={c}
										compact
									/>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<div className='space-y-6'>
					<Card className='border border-slate-200'>
						<CardHeader className='flex flex-row items-center justify-between pb-3'>
							<h2 className='text-lg font-semibold text-slate-900'>Review Queue</h2>
							<Link
								href='/review-queue'
								className='text-sm font-medium text-primary-600 hover:underline'
							>
								View all
							</Link>
						</CardHeader>
						<CardContent className='pt-0'>
							{previewImages.length === 0 ? (
								<p className='py-6 text-center text-sm text-slate-500'>
									No images waiting for classification
								</p>
							) : (
								<div className='flex gap-2'>
									{previewImages.map((img) => (
										<Link
											key={img.image_id}
											href='/review-queue'
											className='relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100'
										>
											<Image
												src={img.image_url}
												alt=''
												fill
												className='object-cover'
												sizes='64px'
											/>
										</Link>
									))}
								</div>
							)}
							{pendingReviewCount > 0 && (
								<p className='mt-2 text-xs text-slate-500'>
									{pendingReviewCount} image{pendingReviewCount !== 1 ? "s" : ""} awaiting
								</p>
							)}
						</CardContent>
					</Card>
					<Card className='border border-slate-200'>
						<CardHeader className='flex flex-row items-center justify-between pb-3'>
							<h2 className='text-lg font-semibold text-slate-900'>Appointments</h2>
							<Link
								href='/appointments'
								className='text-sm font-medium text-primary-600 hover:underline'
							>
								View all
							</Link>
						</CardHeader>
						<CardContent className='pt-0'>
							{pendingAppointments.length === 0 ? (
								<p className='py-4 text-center text-sm text-slate-500'>No pending requests</p>
							) : (
								<div className='space-y-3'>
									{pendingAppointments.slice(0, 2).map((req) => (
										<div
											key={req.request_id}
											className='rounded-2xl border border-slate-200 bg-white px-3 py-3'
										>
											<div className='flex items-start justify-between gap-3'>
												<div className='min-w-0'>
													<p className='text-sm font-semibold text-slate-900'>
														{formatDate(req.proposed_datetime)}
													</p>
													{req.requester_name && (
														<div className='mt-1 flex items-center gap-1.5 text-xs text-slate-600'>
															<User className='h-3.5 w-3.5 text-slate-400' />
															<span className='font-medium text-slate-800'>
																{req.requester_name}
															</span>
														</div>
													)}
												</div>
												<AppointmentStatusPill status={req.status} />
											</div>
											<div className='mt-3 flex items-center justify-between gap-3'>
												<Link
													href={
														req.consultation_id
															? `/consultations/${req.consultation_id}`
															: "/appointments"
													}
													className='text-sm font-medium text-primary-600 hover:text-primary-700'
												>
													Consultation
												</Link>
												<div className='flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50'>
													<Video className='h-4 w-4 text-slate-500' />
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
