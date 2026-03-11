"use client";

import Link from "next/link";
import { AlertTriangle, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useAppointmentsForMyConsultations } from "@/hooks/use-appointments";
import { useIncomingTeleconsultations } from "@/hooks/use-teleconsultations";
import { useConsultations } from "@/hooks/use-consultations";
import { usePractitioners } from "@/hooks/use-practitioners";

export default function NotificationsPage() {
	const { user } = useAuth();

	const { data: consultations } = useConsultations();
	const { data: appointments } = useAppointmentsForMyConsultations();
	const isPractitioner = user?.role === "PRACTITIONER";
	const { data: incomingCalls } = useIncomingTeleconsultations(!!user && isPractitioner);
	const { data: practitioners } = usePractitioners();
	const incomingCount = incomingCalls?.length ?? 0;

	const isUser = user?.role === "USER";

	const currentPractitioner = isPractitioner ? practitioners?.find((p) => p.user_id === user?.user_id) : undefined;
	const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";

	const activeReferConsults = consultations?.filter((c) => c.status !== "CLOSED" && c.urgency === "REFER") ?? [];

	const userConsultAlerts = isUser ? activeReferConsults : [];
	const practitionerConsultAlerts = isPractitioner && !isSpecialist ? activeReferConsults : [];

	const upcomingCount = isUser ? (appointments?.length ?? 0) : 0;

	const showUserAlerts = isUser && (userConsultAlerts.length > 0 || upcomingCount > 0);
	const showPractitionerAlerts = isPractitioner && (practitionerConsultAlerts.length > 0 || incomingCount > 0);

	const hasAnyAlerts = showUserAlerts || showPractitionerAlerts;

	return (
		<div className='space-y-6'>
			<PageHeader
				title='Alerts'
				description={
					isUser ? "Referral and appointment alerts" : "Cases to refer and incoming teleconsultations"
				}
			/>

			{showUserAlerts && (
				<div className='flex flex-col gap-3'>
					{userConsultAlerts.map((c) => (
						<Link
							key={c.consultation_id}
							href={`/consultations/${c.consultation_id}`}
						>
							<Alert
								variant='neutral'
								showIcon={false}
								className='cursor-pointer border border-slate-200 bg-white py-4 px-4 transition-colors hover:bg-slate-50'
							>
								<span className='flex flex-wrap items-center justify-between gap-2 font-medium'>
									<span className='flex items-center gap-2'>
										<span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-600'>
											<AlertTriangle className='h-3 w-3' />
										</span>
										<span className='text-slate-800'>
											Consultation{" "}
											<span className='font-mono'>#{c.consultation_id.slice(0, 8)}</span> — REFER
										</span>
									</span>
									<span className='text-primary-600 underline'>Open</span>
								</span>
							</Alert>
						</Link>
					))}

					{upcomingCount > 0 && (
						<Link href='/schedules'>
							<Alert
								variant='neutral'
								showIcon={false}
								className='cursor-pointer border border-slate-200 bg-white py-4 px-4 transition-colors hover:bg-slate-50'
							>
								<span className='flex flex-wrap items-center justify-between gap-2 font-medium'>
									<span className='flex items-center gap-3'>
										<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600'>
											<Phone className='h-5 w-5' />
										</span>
										<span className='text-slate-800'>
											You have {upcomingCount} upcoming appointment
											{upcomingCount !== 1 ? "s" : ""}.
										</span>
									</span>
									<span className='text-primary-600 underline'>View schedules →</span>
								</span>
							</Alert>
						</Link>
					)}
				</div>
			)}

			{showPractitionerAlerts && (
				<div className='flex flex-col gap-3'>
					{practitionerConsultAlerts.map((c) => (
						<Link
							key={c.consultation_id}
							href={`/consultations/${c.consultation_id}`}
						>
							<Alert
								variant='neutral'
								showIcon={false}
								className='cursor-pointer border border-slate-200 bg-white py-4 px-4 transition-colors hover:bg-slate-50'
							>
								<span className='flex flex-wrap items-center justify-between gap-2 font-medium'>
									<span className='flex items-center gap-3'>
										<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-600'>
											<AlertTriangle className='h-5 w-5' />
										</span>
										<span className='text-slate-800'>
											Consultation{" "}
											<span className='font-mono'>#{c.consultation_id.slice(0, 8)}</span> is REFER
											and may need referral.
										</span>
									</span>
									<span className='text-primary-600 underline'>View consultation →</span>
								</span>
							</Alert>
						</Link>
					))}

					{incomingCount > 0 && (
						<Link href='/telemedicine'>
							<Alert
								variant='neutral'
								showIcon={false}
								className='cursor-pointer border border-slate-200 bg-white py-4 px-4 transition-colors hover:bg-slate-50'
							>
								<span className='flex flex-wrap items-center justify-between gap-2 font-medium'>
									<span className='flex items-center gap-3'>
										<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-600'>
											<Phone className='h-5 w-5' />
										</span>
										<span className='text-slate-800'>
											You have {incomingCount} incoming call
											{incomingCount !== 1 ? "s" : ""} waiting for a response.
										</span>
									</span>
									<span className='text-primary-600 underline'>Go to telemedicine →</span>
								</span>
							</Alert>
						</Link>
					)}
				</div>
			)}

			{!hasAnyAlerts && <p className='text-sm text-slate-500'>No active alerts.</p>}
		</div>
	);
}
