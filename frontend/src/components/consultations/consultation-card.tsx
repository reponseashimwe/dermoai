import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ConsultationStatusBadge } from "./consultation-status-badge";
import { UrgencyBadge } from "@/components/scan/urgency-badge";
import { formatConditionName, formatConfidence, formatDate } from "@/lib/utils";
import { FileText, Calendar } from "lucide-react";
import type { Consultation } from "@/types/api";

interface ConsultationCardProps {
	consultation: Consultation;
	/** Compact layout for dashboard lists */
	compact?: boolean;
}

export function ConsultationCard({ consultation, compact }: ConsultationCardProps) {
	const isRefer = consultation.urgency === "REFER";
	const conditionName = consultation.final_predicted_condition
		? formatConditionName(consultation.final_predicted_condition)
		: "Pending Analysis";

	if (compact) {
		const confidence = consultation.final_confidence ?? 0;
		const confidencePct = Math.round(confidence * 100);
		const barColor = isRefer ? "bg-amber-500" : "bg-primary-500";
		return (
			<Link href={`/consultations/${consultation.consultation_id}`}>
				<Card className='cursor-pointer transition-shadow hover:shadow-md min-w-0 overflow-hidden'>
					<CardContent className='p-5'>
						<div className='flex items-center justify-between gap-2'>
							<div className='flex items-center gap-3 min-w-0 flex-1'>
								<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100'>
									<FileText className='h-4 w-4 text-primary-600' />
								</div>
								<div className='min-w-0'>
									<p className='font-semibold text-slate-900 truncate text-base'>{conditionName}</p>
									<p className='text-sm text-slate-500 mt-0.5'>{formatDate(consultation.created_at)}</p>
								</div>
							</div>
							<ConsultationStatusBadge status={consultation.status} />
						</div>
						<div className='mt-4 flex flex-wrap items-center gap-2'>
							{consultation.final_confidence !== null && (
								<div className='flex items-center gap-2 shrink-0'>
									<div className='h-1.5 w-14 overflow-hidden rounded-full bg-slate-200'>
										<div
											className={`h-full rounded-full ${barColor} transition-all`}
											style={{ width: `${Math.min(100, Math.max(0, confidencePct))}%` }}
										/>
									</div>
									<span className='text-xs font-medium text-slate-600 tabular-nums'>
										{formatConfidence(consultation.final_confidence)}
									</span>
								</div>
							)}
							{consultation.urgency && (
								<UrgencyBadge
									urgency={consultation.urgency}
									size='sm'
								/>
							)}
							{consultation.has_appointments && (
								<span className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800'>
									<Calendar className='h-3 w-3' />
									Appointment
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			</Link>
		);
	}

	return (
		<Link href={`/consultations/${consultation.consultation_id}`}>
			<Card
				className={`cursor-pointer transition-shadow hover:shadow-md min-w-0 overflow-hidden ${
					isRefer ? "border-l-4 border-l-amber-500" : ""
				}`}
			>
				<CardContent className='p-5'>
					<div className='flex items-start justify-between gap-2 mb-3'>
						<div className='flex items-center gap-2 min-w-0'>
							<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50'>
								<FileText className='h-5 w-5 text-primary-600' />
							</div>
							<p className='font-semibold text-slate-900 truncate'>{conditionName}</p>
						</div>
						<ConsultationStatusBadge status={consultation.status} />
					</div>
					<p className='text-sm text-slate-500 mb-4'>{formatDate(consultation.created_at)}</p>
					<div className='grid grid-cols-2 gap-4 mb-4'>
						<div>
							<p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Confidence</p>
							<div className='mt-1 flex items-center gap-2'>
								{consultation.final_confidence !== null ? (
									<>
										<div className='h-1.5 w-14 overflow-hidden rounded-full bg-slate-200'>
											<div
												className={`h-full rounded-full transition-all ${isRefer ? "bg-amber-500" : "bg-primary-500"}`}
												style={{ width: `${Math.min(100, Math.round(consultation.final_confidence * 100))}%` }}
											/>
										</div>
										<span className='text-sm font-semibold tabular-nums text-slate-900'>
											{formatConfidence(consultation.final_confidence)}
										</span>
									</>
								) : (
									<span className='text-slate-500'>—</span>
								)}
							</div>
						</div>
						<div>
							<p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Severity</p>
							<div className='mt-1 flex items-center gap-1.5'>
								{consultation.urgency ? (
									<UrgencyBadge
										urgency={consultation.urgency}
										size='sm'
									/>
								) : (
									<span className='text-slate-500'>—</span>
								)}
							</div>
						</div>
					</div>
					<div className='flex flex-wrap gap-2'>
						{consultation.has_appointments && (
							<span className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800'>
								<Calendar className='h-3 w-3' />
								Has appointment
							</span>
						)}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
