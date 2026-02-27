"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAppointmentRequest } from "@/hooks/use-appointments";
import { useConsultations } from "@/hooks/use-consultations";
import { useToast } from "@/components/ui/toast";
import { formatConditionName, formatDate } from "@/lib/utils";

// Time options: 00–23 hours, minutes in 10-step intervals (0, 10, 20, 30, 40, 50)
const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

function buildProposedDatetime(date: string, hour: number, minute: number): string {
	const d = new Date(date);
	d.setHours(hour, minute, 0, 0);
	return d.toISOString().slice(0, 19);
}

function isPastDate(dateStr: string): boolean {
	const d = new Date(dateStr);
	const today = new Date();
	d.setHours(0, 0, 0, 0);
	today.setHours(0, 0, 0, 0);
	return d.getTime() < today.getTime();
}

function isPastDateTime(dateStr: string, hour: number, minute: number): boolean {
	const d = new Date(dateStr);
	d.setHours(hour, minute, 0, 0);
	return d.getTime() < Date.now();
}

const bookAppointmentSchema = z
	.object({
		date: z.string().min(1, "Select a date"),
		hour: z.coerce.number().min(0).max(23),
		minute: z.coerce.number().refine((m) => MINUTE_OPTIONS.includes(m), "Invalid minute"),
		notes: z.string().optional(),
		consultationId: z.string().optional(),
	})
	.refine(
		(data) => {
			if (!data.date) return true;
			return !isPastDate(data.date);
		},
		{ message: "Date cannot be in the past", path: ["date"] },
	)
	.refine(
		(data) => {
			if (!data.date) return true;
			return !isPastDateTime(data.date, data.hour, data.minute);
		},
		{ message: "Time cannot be in the past", path: ["hour"] },
	);

type FormValues = z.infer<typeof bookAppointmentSchema>;

const defaultValues: FormValues = {
	date: "",
	hour: 9,
	minute: 0,
	notes: "",
	consultationId: "",
};

interface CreateAppointmentModalProps {
	open: boolean;
	onClose: () => void;
	consultationId?: string;
	specialistId?: string;
	initialNotes?: string;
	onSuccess?: () => void;
}

export function CreateAppointmentModal({
	open,
	onClose,
	consultationId: initialConsultationId,
	specialistId,
	initialNotes = "",
	onSuccess,
}: CreateAppointmentModalProps) {
	const createRequest = useCreateAppointmentRequest();
	const { data: consultations } = useConsultations();
	const { toast } = useToast();

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		defaultValues,
		resolver: zodResolver(bookAppointmentSchema) as Resolver<FormValues>,
	});

	const consultationId = watch("consultationId");

	useEffect(() => {
		if (open) {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			reset({
				date: "",
				hour: 9,
				minute: 0,
				notes: initialNotes,
				consultationId: initialConsultationId ?? "",
			});
		}
		// Only run when modal opens
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const onSubmit = async (data: FormValues) => {
		const effectiveConsultationId = data.consultationId?.trim() || undefined;
		if (!effectiveConsultationId) {
			toast("Please select a consultation", "error");
			return;
		}

		const proposed_datetime = buildProposedDatetime(data.date, data.hour, data.minute);

		try {
			await createRequest.mutateAsync({
				proposed_datetime,
				notes: data.notes?.trim() || undefined,
				consultation_id: effectiveConsultationId,
				specialist_id: specialistId,
			});
			toast("Appointment request sent", "success");
			onClose();
			reset(defaultValues);
			onSuccess?.();
		} catch {
			toast("Failed to create appointment request", "error");
		}
	};

	function handleClose() {
		onClose();
		reset(defaultValues);
	}

	const hasConsultationFromContext = !!initialConsultationId;
	const consultationOptions = consultations ?? [];

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title='Book appointment'
		>
			<form
				onSubmit={handleSubmit((data: FormValues) => onSubmit(data))}
				className='space-y-4'
			>
				{hasConsultationFromContext ? (
					<div className='rounded-lg bg-blue-50 p-3 text-sm text-blue-700'>
						This request will be linked to the current consultation.
					</div>
				) : consultationOptions.length === 0 ? (
					<div className='rounded-lg bg-amber-50 p-3 text-sm text-amber-800'>
						Create a consultation first to book an appointment.{" "}
						<Link
							href='/consultations/new'
							className='font-medium underline'
						>
							New consultation
						</Link>
					</div>
				) : (
					<div className='space-y-2'>
						<label className='block text-sm font-medium text-slate-700'>Consultation (required)</label>
						<select
							{...register("consultationId", { required: true })}
							className='flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
						>
							<option value=''>Select a consultation</option>
							{consultationOptions.map((c) => (
								<option
									key={c.consultation_id}
									value={c.consultation_id}
								>
									{c.final_predicted_condition
										? formatConditionName(c.final_predicted_condition)
										: "Pending"}{" "}
									— {formatDate(c.created_at)}
								</option>
							))}
						</select>
					</div>
				)}

				<div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-start'>
					<div className='min-w-0'>
						<label className='mb-1 block text-xs font-medium text-slate-700'>
							Date <span className='text-red-500'>*</span>
						</label>
						<Input
							type='date'
							{...register("date")}
							min={new Date().toISOString().slice(0, 10)}
							className={`h-9 text-sm ${errors.date ? "border-red-500" : ""}`}
						/>
						{errors.date?.message && <p className='mt-0.5 text-xs text-red-600'>{errors.date.message}</p>}
					</div>
					<div className='grid grid-cols-2 gap-2 min-w-0'>
						<div className='min-w-0'>
							<label className='mb-1 block text-xs font-medium text-slate-700'>
								Hour <span className='text-red-500'>*</span>
							</label>
							<select
								{...register("hour", { valueAsNumber: true })}
								className='flex h-9 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
							>
								{HOUR_OPTIONS.map((h) => (
									<option
										key={h}
										value={h}
									>
										{h.toString().padStart(2, "0")}
									</option>
								))}
							</select>
							{errors.hour?.message && (
								<p className='mt-0.5 text-xs text-red-600'>{errors.hour.message}</p>
							)}
						</div>
						<div className='min-w-0'>
							<label className='mb-1 block text-xs font-medium text-slate-700'>
								Minute <span className='text-red-500'>*</span>
							</label>
							<select
								{...register("minute", { valueAsNumber: true })}
								className='flex h-9 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'
							>
								{MINUTE_OPTIONS.map((m) => (
									<option
										key={m}
										value={m}
									>
										:{m.toString().padStart(2, "0")}
									</option>
								))}
							</select>
							{errors.minute?.message && (
								<p className='mt-0.5 text-xs text-red-600'>{errors.minute.message}</p>
							)}
						</div>
					</div>
				</div>

				<Textarea
					label='Notes (optional)'
					placeholder='Reason for appointment, urgency, specific concerns...'
					{...register("notes")}
					rows={3}
				/>

				<div className='flex gap-2'>
					<Button
						type='button'
						variant='outline'
						onClick={handleClose}
						className='flex-1'
					>
						Cancel
					</Button>
					<Button
						type='submit'
						disabled={
							!watch("date") ||
							(!hasConsultationFromContext && (consultationOptions.length === 0 || !consultationId))
						}
						loading={createRequest.isPending}
						className='flex-1'
					>
						Send Request
					</Button>
				</div>
			</form>
		</Modal>
	);
}
