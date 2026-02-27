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
} from "@/hooks/use-appointments";
import { CreateAppointmentModal } from "@/components/appointments/create-appointment-modal";
import { Video, Circle, Calendar, Phone } from "lucide-react";
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
					{nextAppointment && (
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
									<Link
										href={`/telemedicine?consultationId=${nextAppointment.consultation_id}`}
									>
										<Button size='sm' variant='outline'>
											<Phone className='mr-1 h-3 w-3' />
											Call
										</Button>
									</Link>
								</>
							)}
						</div>
					)}
					<Button onClick={() => openBookModal()} size='sm'>
						<Calendar className='mr-2 h-4 w-4' />
						Book appointment
					</Button>
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
						<div className='space-y-3'>
							{[1, 2, 3].map((i) => (
								<Skeleton
									key={i}
									className='h-20 w-full'
								/>
							))}
						</div>
					) : !practitioners?.length ? (
						<div className='py-8 text-center text-slate-500'>
							<Video className='mx-auto h-12 w-12 text-slate-300' />
							<p className='mt-2 font-medium'>No practitioners available</p>
							<p className='text-sm'>
								{filter === "online"
									? "No one is online right now. Try viewing all practitioners."
									: "No practitioners are registered yet."}
							</p>
						</div>
					) : (
						<ul className='space-y-3'>
							{practitioners.map((p) => (
								<li key={p.practitioner_id}>
									<Card>
										<CardContent className='flex flex-row items-center justify-between py-4'>
											<div className='flex items-center gap-3'>
												<div
													className={`flex h-10 w-10 items-center justify-center rounded-full ${
														p.is_online ? "bg-green-100" : "bg-slate-100"
													}`}
												>
													{p.is_online ? (
														<Circle className='h-3 w-3 fill-green-600 text-green-600' />
													) : (
														<Circle className='h-3 w-3 fill-slate-400 text-slate-400' />
													)}
												</div>
												<div>
													<p className='font-medium text-slate-900'>{p.name}</p>
													<p className='text-sm text-slate-500'>
														{p.practitioner_type === "SPECIALIST"
															? "Specialist"
															: "General"}{" "}
														{p.expertise ? `· ${p.expertise}` : ""}
													</p>
													{!p.is_online && p.last_active && (
														<p className='text-xs text-slate-400'>
															Last active: {formatDate(p.last_active)}
														</p>
													)}
												</div>
											</div>
											<div className='flex items-center gap-2'>
												<Button
													size='sm'
													variant='outline'
													onClick={() => openBookModal(p.practitioner_id)}
												>
													<Calendar className='mr-1 h-4 w-4' />
													Book
												</Button>
												<Button
													size='sm'
													disabled={!p.is_online}
													loading={requestCall.isPending}
													title={p.is_online ? "Call" : "Practitioner is offline"}
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
												>
													<Video className='mr-1 h-4 w-4' />
													{p.is_online ? "Call" : "Offline"}
												</Button>
											</div>
										</CardContent>
									</Card>
								</li>
							))}
						</ul>
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
