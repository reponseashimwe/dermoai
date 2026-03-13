"use client";

import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePractitionerStats } from "@/hooks/use-stats";
import { useConsultations } from "@/hooks/use-consultations";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners, useUpdateMyStatus } from "@/hooks/use-practitioners";
import { useIncomingTeleconsultations, useAcceptTeleconsultation } from "@/hooks/use-teleconsultations";
import { useAppointmentsForMyConsultations } from "@/hooks/use-appointments";
import { FileText, ClipboardCheck, AlertTriangle, Users, Phone, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { DASHBOARD_CONFIG } from "@/config/roles";
import { formatDate } from "@/lib/utils";
import type { PractitionerStats } from "@/types/api";

export function PractitionerDashboard() {
	const router = useRouter();
	const { user } = useAuth();
	const { data: practitioners } = usePractitioners();
	const { data: stats, isLoading } = usePractitionerStats(true);
	const { data: consultations } = useConsultations();
	const { data: incomingCalls, refetch: refetchIncoming } = useIncomingTeleconsultations(true);
	const { data: appointments } = useAppointmentsForMyConsultations();
	const acceptCall = useAcceptTeleconsultation();
	const updateStatus = useUpdateMyStatus();

	const currentPractitioner = user ? practitioners?.find((p) => p.user_id === user.user_id) : undefined;
	const isOnline = updateStatus.data?.is_online ?? currentPractitioner?.is_online ?? false;

	const nextAppointments = appointments?.slice(0, 3) ?? [];
	const recentConsultations = consultations?.slice(0, 3) ?? [];

	if (isLoading || !stats) {
		return (
			<div className='space-y-4'>
				<Skeleton className='h-10 w-64' />
				<div className='grid gap-3 grid-cols-4'>
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

	const s = stats as PractitionerStats;

	return (
		<div className='flex min-h-0 flex-col gap-6 pb-6'>
			<div className='flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-xl font-bold text-slate-900 sm:text-2xl'>General Practice</h1>
					<p className='text-sm text-slate-600'>{DASHBOARD_CONFIG.PRACTITIONER.description}</p>
				</div>
				<div className='flex items-center gap-3'>
					<span className='text-sm font-medium text-slate-700'>{isOnline ? "🟢 Online" : "⚫ Offline"}</span>
					<Button
						variant='outline'
						size='sm'
						onClick={() => updateStatus.mutate({ is_online: !isOnline })}
						loading={updateStatus.isPending}
					>
						Go {isOnline ? "Offline" : "Online"}
					</Button>
				</div>
			</div>

			{/* Row 1: Stat cards on their own */}
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
					label='Schedules'
					value={appointments?.length ?? 0}
					icon={Calendar}
					color='purple'
					subtext='Upcoming'
					href='/appointments'
				/>
				<StatCard
					compact
					label='Consultations'
					value={s.urgent_cases}
					icon={AlertTriangle}
					color='amber'
					href='/consultations'
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

			{/* Row 2: Three-column grid — Quick actions, Schedules, My recent consultations (last) */}
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				<Card>
					<CardHeader className='pb-4'>
						<h2 className='text-lg font-semibold text-slate-900'>Quick actions</h2>
					</CardHeader>
					<CardContent className='space-y-3 pt-0'>
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
							href='/patients'
							className='block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30'
						>
							<div className='flex items-center gap-3'>
								<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700'>
									<Users className='h-4 w-4' />
								</div>
								<div>
									<p className='text-sm font-semibold text-slate-900'>My Patients</p>
									<p className='text-xs text-slate-500'>View patient list</p>
								</div>
							</div>
						</Link>
						<Link
							href='/telemedicine'
							className='block rounded-lg border border-slate-200 p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/30'
						>
							<div className='flex items-center gap-3'>
								<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700'>
									<Phone className='h-4 w-4' />
								</div>
								<div>
									<p className='text-sm font-semibold text-slate-900'>Request Teleconsult</p>
									<p className='text-xs text-slate-500'>Connect with specialist</p>
								</div>
							</div>
						</Link>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<h2 className='text-lg font-semibold text-slate-900'>Schedules</h2>
							<Link
								href='/appointments'
								className='text-sm text-primary-600 hover:underline'
							>
								View all
							</Link>
						</div>
					</CardHeader>
					<CardContent className='pt-0'>
						{nextAppointments.length > 0 && (
							<div className='space-y-3'>
								{nextAppointments.slice(0, 3).map((apt) => (
									<div
										key={apt.request_id}
										className='rounded-lg border border-slate-200 p-4'
									>
										<div className='flex items-center justify-between gap-2'>
											<div className='min-w-0 flex-1'>
												<p className='text-base font-medium text-slate-900'>
													{formatDate(apt.proposed_datetime)}
												</p>
												{(() => {
													const isRequester = apt.requested_by_user_id === user?.user_id;
													const otherName = isRequester
														? apt.specialist_name ?? apt.requester_name
														: apt.requester_name ?? apt.specialist_name;
													return otherName ? (
														<p className='mt-1 text-sm text-slate-600'>
															With {otherName}
														</p>
													) : null;
												})()}
												{apt.notes && (
													<p className='mt-1 text-sm text-slate-500'>{apt.notes}</p>
												)}
											</div>
											<span
												className={cn(
													"shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
													apt.status === "APPROVED" && "bg-green-100 text-green-800",
													apt.status === "PENDING" && "bg-amber-100 text-amber-800",
													apt.status === "REJECTED" && "bg-red-100 text-red-800",
													apt.status === "RESCHEDULED" && "bg-blue-100 text-blue-800",
													apt.status === "COMPLETED" && "bg-emerald-100 text-emerald-800",
												)}
											>
												{apt.status}
											</span>
										</div>
										<div className='mt-3 flex items-center justify-between gap-3'>
											{apt.consultation_id && (
												<Link
													href={`/consultations/${apt.consultation_id}`}
													className='text-xs font-medium text-primary-600 hover:text-primary-700'
												>
													Consultation
												</Link>
											)}
											<div className='flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50'>
												<Calendar className='h-4 w-4 text-slate-500' />
											</div>
										</div>
									</div>
								))}
							</div>
						)}
						{incomingCalls && incomingCalls.length > 0 && (
							<div className='space-y-2 border-t border-slate-200 pt-3'>
								<p className='text-xs font-medium text-slate-600'>
									Incoming calls ({incomingCalls.length})
								</p>
								{incomingCalls.slice(0, 2).map((tc) => (
									<div
										key={tc.teleconsultation_id}
										className='flex items-center justify-between rounded border border-primary-200 bg-primary-50/50 p-2'
									>
										<span className='text-xs text-slate-600'>Request</span>
										<Button
											size='sm'
											onClick={async () => {
												try {
													await acceptCall.mutateAsync(tc.teleconsultation_id);
													refetchIncoming();
													router.push(`/teleconsultations/${tc.teleconsultation_id}`);
												} catch {
													refetchIncoming();
												}
											}}
											disabled={acceptCall.isPending}
										>
											Accept
										</Button>
									</div>
								))}
							</div>
						)}
						{nextAppointments.length === 0 && (!incomingCalls || incomingCalls.length === 0) && (
							<p className='py-6 text-center text-sm text-slate-500'>No upcoming appointments</p>
						)}
					</CardContent>
				</Card>

				<Card>
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
			</div>
		</div>
	);
}
