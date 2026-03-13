"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailablePractitioners } from "@/hooks/use-practitioners";
import { useRequestTeleconsultation } from "@/hooks/use-teleconsultations";
import { useAuth } from "@/hooks/use-auth";
import {
	useAppointmentsForMyConsultations,
	useUpcomingAppointments,
	useStartCallFromAppointment,
} from "@/hooks/use-appointments";
import { CreateAppointmentModal } from "@/components/appointments/create-appointment-modal";
import { Avatar } from "@/components/ui/avatar";
import { Video, Circle, Calendar, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { AppointmentRequest } from "@/hooks/use-appointments";

function nextUpcoming(requests: AppointmentRequest[]): AppointmentRequest | null {
	const pending = requests.filter(
		(r) => r.status === "PENDING" || r.status === "APPROVED" || r.status === "RESCHEDULED",
	);
	if (pending.length === 0) return null;
	const sorted = [...pending].sort(
		(a, b) => new Date(a.proposed_datetime).getTime() - new Date(b.proposed_datetime).getTime(),
	);
	const future = sorted.filter((r) => new Date(r.proposed_datetime) > new Date());
	return future[0] ?? sorted[0];
}

export default function TelemedicinePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const consultationIdFromUrl = searchParams.get("consultationId") ?? undefined;
	const { user } = useAuth();
	const [filter, setFilter] = useState<"all" | "online">("online");
	const [bookModalOpen, setBookModalOpen] = useState(false);
	const [bookSpecialistId, setBookSpecialistId] = useState<string | undefined>(undefined);
	const { data: practitioners, isLoading } = useAvailablePractitioners({
		online_only: filter === "online",
	});
	const requestCall = useRequestTeleconsultation();
	const startCallFromAppointment = useStartCallFromAppointment();
	const isPractitioner = user?.role === "PRACTITIONER";
	const { data: myConsultationAppointments } = useAppointmentsForMyConsultations();
	const { data: upcomingAppointments } = useUpcomingAppointments();
	const pendingForUser = isPractitioner ? upcomingAppointments : myConsultationAppointments;
	const nextAppointment = pendingForUser ? nextUpcoming(pendingForUser) : null;

	const openBookModal = (specialistId?: string) => {
		setBookSpecialistId(specialistId);
		setBookModalOpen(true);
	};

	return (
		<div className='space-y-6'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<PageHeader
					title='Telemedicine Consultation'
					description='Connect with available practitioners via video call'
				/>
				<div className='flex flex-wrap items-center gap-2 sm:ml-auto'>
					{nextAppointment && nextAppointment.status !== "REJECTED" && (
						<div className='flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700'>
							<span>
								Next: <strong>{formatDate(nextAppointment.proposed_datetime)}</strong>
							</span>
							{nextAppointment.consultation_id && (
								<>
									<Link
										href={`/consultations/${nextAppointment.consultation_id}`}
										className='font-medium text-primary-600 hover:underline'
									>
										Consultation
									</Link>
									<Button
										size='sm'
										variant='outline'
										loading={startCallFromAppointment.isPending}
										onClick={async () => {
											try {
												const data = await startCallFromAppointment.mutateAsync(
													nextAppointment.request_id,
												);
												router.push(
													`/teleconsultations/${data.teleconsultation_id}?appointmentId=${nextAppointment.request_id}`,
												);
											} catch {
												// Ignore; flow is also available from consultation detail / Call page
											}
										}}
									>
										{startCallFromAppointment.isPending ? (
											"Connecting…"
										) : (
											<>
												<Phone className='h-3 w-3' />
												Join
											</>
										)}
									</Button>
								</>
							)}
						</div>
					)}
				</div>
			</div>

			<div className='flex gap-2'>
				<Button
					variant={filter === "online" ? "primary" : "outline"}
					size='sm'
					onClick={() => setFilter("online")}
				>
					Online now
				</Button>
				<Button
					variant={filter === "all" ? "primary" : "outline"}
					size='sm'
					onClick={() => setFilter("all")}
				>
					All practitioners
				</Button>
			</div>

			<Card>
				<CardHeader>
					<h2 className='text-lg font-semibold text-slate-900'>Available Practitioners</h2>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<Skeleton key={i} className='h-36 rounded-xl' />
							))}
						</div>
					) : !practitioners?.length ? (
						<div className='py-12 text-center text-slate-500'>
							<Video className='mx-auto h-12 w-12 text-slate-300' />
							<p className='mt-2 font-medium'>No practitioners available</p>
							<p className='text-sm'>
								{filter === "online"
									? "No one is online right now. Try viewing all practitioners."
									: "No practitioners are registered yet."}
							</p>
						</div>
					) : (
						<div className='grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
							{practitioners.map((p) => (
								<Card key={p.practitioner_id} className="overflow-hidden">
									<CardContent className='p-5'>
										<div className='flex gap-4'>
											<div className="relative shrink-0">
												<Avatar
													name={p.name}
													className="h-14 w-14 text-lg sm:h-20 sm:w-20 sm:text-xl"
												/>
												<span
													className={cn(
														"absolute top-0 right-0 block h-3 w-3 rounded-full border-2 border-white sm:h-4 sm:w-4",
														p.is_online ? "bg-green-500" : "bg-slate-400"
													)}
													title={p.is_online ? "Online" : "Offline"}
												/>
											</div>
											<div className='min-w-0 flex-1'>
												<p className='font-semibold text-slate-900'>{p.name}</p>
												<p className='text-sm text-slate-500'>
													{p.practitioner_type === "SPECIALIST"
														? "Specialist: Dermatology"
														: "General Practitioner"}
													{p.expertise ? ` · ${p.expertise}` : ""}
												</p>
												<span
													className={cn(
														"mt-2 inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium",
														p.is_online
															? "bg-green-100 text-green-800"
															: "bg-slate-100 text-slate-600"
													)}
												>
													{p.is_online ? "Online" : "Offline"}
												</span>
											</div>
										</div>
										<div className='mt-4 flex flex-wrap gap-2'>
											<Button
												size='sm'
												variant='outline'
												onClick={() => openBookModal(p.practitioner_id)}
											>
												<Calendar className='mr-1.5 h-4 w-4' />
												Book
											</Button>
											<Button
												size='sm'
												variant={p.is_online ? "outline" : "ghost"}
												disabled={!p.is_online}
												loading={requestCall.isPending}
												title={p.is_online ? "Start call" : "Practitioner is offline"}
												onClick={() => {
													if (!p.is_online) return;
													requestCall.mutate(
														{ specialist_id: p.practitioner_id },
														{
															onSuccess: (data) => {
																router.push(
																	`/teleconsultations/${data.teleconsultation_id}`,
																);
															},
														},
													);
												}}
												className={cn(!p.is_online && "opacity-60")}
											>
												<Video className='mr-1.5 h-4 w-4' />
												{p.is_online ? "Call" : "Offline"}
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<CreateAppointmentModal
				open={bookModalOpen}
				onClose={() => {
					setBookModalOpen(false);
					setBookSpecialistId(undefined);
				}}
				consultationId={consultationIdFromUrl}
				specialistId={bookSpecialistId}
				onSuccess={() => setBookModalOpen(false)}
			/>
		</div>
	);
}
