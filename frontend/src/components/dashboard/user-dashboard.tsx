"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultationCard } from "@/components/consultations/consultation-card";
import { QuickScanModal } from "@/components/scan/quick-scan-modal";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-stats";
import { useConsultations } from "@/hooks/use-consultations";
import { useAppointmentsForMyConsultations, useStartCallFromAppointment } from "@/hooks/use-appointments";
import { useToast } from "@/components/ui/toast";
import { History, FileText, Clock, Scan, Calendar, Video, User, Hand } from "lucide-react";
import { DASHBOARD_CONFIG } from "@/config/roles";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { UserStats } from "@/types/api";

export function UserDashboard() {
	const router = useRouter();
	const { toast } = useToast();
	const { user } = useAuth();
	const [quickScanOpen, setQuickScanOpen] = useState(false);
	const { data: stats, isLoading } = useUserStats(true);
	const { data: consultations } = useConsultations();
	const { data: appointments } = useAppointmentsForMyConsultations();
	const startCall = useStartCallFromAppointment();

	const recentConsultations = consultations?.slice(0, 3) ?? [];
	const upcomingAppointments = appointments?.slice(0, 3) ?? [];

	async function handleAppointmentCall(requestId: string) {
		try {
			const data = await startCall.mutateAsync(requestId);
			router.push(`/teleconsultations/${data.teleconsultation_id}`);
		} catch {
			toast("Could not start call. Try the Call page if no specialist is assigned.", "error");
		}
	}

	if (isLoading || !stats) {
		return (
			<div className='space-y-6'>
				<Skeleton className='h-10 w-64' />
				<div className='grid grid-cols-2 gap-3 gap-y-4 sm:gap-4 sm:grid-cols-3'>
					{[1, 2, 3].map((i) => (
						<Skeleton
							key={i}
							className='h-24'
						/>
					))}
				</div>
			</div>
		);
	}

	const s = stats as UserStats;

	const config = DASHBOARD_CONFIG.USER;

	return (
		<div className='space-y-8'>
			<PageHeader
				title='Your Health Dashboard'
				description={config.description}
			/>

			<Card className='border-0 bg-primary-600 overflow-hidden'>
				<CardContent className='flex flex-col gap-1 py-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
					<div className='flex items-center gap-3'>
						<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white'>
							<Hand className='h-6 w-6' />
						</div>
						<div>
							<p className='text-xl font-semibold text-white'>Hi, {user?.name ?? "there"}</p>
							<p className='text-sm text-primary-100 mt-0.5'>
								Here’s your overview — check your scans and consultations below.
							</p>
						</div>
					</div>
					<p className='text-sm text-primary-200 shrink-0'>
						{new Date().toLocaleDateString("en-US", {
							weekday: "long",
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					</p>
				</CardContent>
			</Card>

			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				{/* Left: 2 cols — stats, quick actions + schedules */}
				<div className='space-y-6 lg:col-span-2'>
					<div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
						<StatCard
							compact
							label='My Scans'
							value={s.my_scans}
							icon={History}
							color='blue'
							href='/scan-history'
						/>
						<StatCard
							compact
							label='Consultations'
							value={s.my_consultations}
							icon={FileText}
							color='primary'
							href='/consultations'
						/>
						<StatCard
							compact
							label='Pending Results'
							value={s.pending_results}
							icon={Clock}
							color='amber'
							href='/scan-history'
						/>
					</div>

					<div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
						<Card>
							<CardHeader className='pb-4'>
								<h2 className='text-lg font-semibold text-slate-900'>Quick Actions</h2>
								<p className='text-sm text-slate-500 mt-1'>
									Quick scan or start a consultation for specialist review.
								</p>
							</CardHeader>
							<CardContent className='space-y-3 pt-0'>
								<button
									type='button'
									onClick={() => setQuickScanOpen(true)}
									className='flex w-full items-center gap-4 rounded-lg border border-slate-200 p-5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50/30'
								>
									<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600'>
										<Scan className='h-5 w-5' />
									</div>
									<div>
										<p className='text-base font-semibold text-slate-900'>Quick Scan</p>
										<p className='text-sm text-slate-500 mt-0.5'>Upload for instant AI analysis</p>
									</div>
								</button>
								<Link
									href='/consultations/new'
									className='flex items-center gap-4 rounded-lg border border-slate-200 p-5 transition-colors hover:border-primary-300 hover:bg-primary-50/30'
								>
									<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700'>
										<FileText className='h-5 w-5' />
									</div>
									<div>
										<p className='text-base font-semibold text-slate-900'>Start a consultation</p>
										<p className='text-sm text-slate-500 mt-0.5'>
											Create a consultation for specialist review
										</p>
									</div>
								</Link>
							</CardContent>
						</Card>
						<Card id='schedules'>
							<CardHeader className='flex flex-row items-center justify-between pb-4'>
								<h2 className='text-lg font-semibold text-slate-900'>Schedules</h2>
								<Link
									href='/schedules'
									className='text-sm font-medium text-primary-600 hover:underline'
								>
									View all
								</Link>
							</CardHeader>
							<CardContent className='pt-0'>
								{upcomingAppointments.length === 0 ? (
									<div className='py-8 text-center'>
										<Calendar className='mx-auto h-12 w-12 text-slate-300' />
										<p className='mt-3 text-base text-slate-500'>No scheduled appointments yet</p>
										<p className='mt-1 text-sm text-slate-400'>
											Appointments linked to your consultations appear here.
										</p>
										<Link
											href='/schedules'
											className='mt-3 inline-block text-sm font-medium text-primary-600 hover:underline'
										>
											View schedules
										</Link>
									</div>
								) : (
									<div className='space-y-3'>
										{upcomingAppointments.map((apt) => (
											<div
												key={apt.request_id}
												className='rounded-lg border border-slate-200 p-4'
											>
												<div className='flex items-center justify-between gap-2'>
													<div className='min-w-0 flex-1'>
														<p className='text-base font-medium text-slate-900'>
															{formatDate(apt.proposed_datetime)}
														</p>
														{apt.specialist_name && (
															<p className='flex items-center gap-1.5 mt-1 text-sm text-slate-600'>
																<User className='h-3.5 w-3.5 shrink-0' />
																{apt.specialist_name}
															</p>
														)}
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
														)}
													>
														{apt.status}
													</span>
												</div>
												<div className='mt-3 flex flex-wrap items-center gap-2'>
													{apt.consultation_id && (
														<>
															<Link
																href={`/consultations/${apt.consultation_id}`}
																className='text-sm text-primary-600 hover:underline'
															>
																Consultation
															</Link>
															<Button
																size='sm'
																variant='outline'
																className='h-9 w-9 shrink-0 p-0'
																onClick={() => handleAppointmentCall(apt.request_id)}
																loading={startCall.isPending}
																title='Video call'
															>
																<Video className='h-4 w-4' />
															</Button>
														</>
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

				{/* Right: 1 col — Recent Consultations */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-4'>
						<h2 className='text-lg font-semibold text-slate-900'>Recent Consultations</h2>
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
									Create your first consultation
								</Link>
							</div>
						) : (
							<div className='space-y-4 grid'>
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

			<QuickScanModal
				open={quickScanOpen}
				onClose={() => setQuickScanOpen(false)}
			/>
		</div>
	);
}
