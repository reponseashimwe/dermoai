"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { isApiError } from "@/lib/api/errors";

const registerSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		email: z.string().email("Enter a valid email"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string(),
		phone_number: z.string().optional(),
		role: z.enum(["USER", "PRACTITIONER"]),
		practitioner_type: z.string().optional(),
		expertise: z.string().optional(),
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	})
	.refine((d) => d.role !== "PRACTITIONER" || (d.practitioner_type && d.practitioner_type.length > 0), {
		message: "Please select a practitioner type",
		path: ["practitioner_type"],
	});

type RegisterForm = z.infer<typeof registerSchema>;

const inputClass =
	"flex h-11 w-full rounded-lg border-0 bg-slate-100 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30";
const selectClass =
	"flex h-11 w-full rounded-lg border-0 bg-slate-100 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export default function RegisterPage() {
	const { register: registerUser } = useAuth();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<RegisterForm>({
		resolver: zodResolver(registerSchema),
		defaultValues: { role: "USER" },
	});

	const role = watch("role");

	async function onSubmit(data: RegisterForm) {
		setError(null);
		try {
			await registerUser({
				name: data.name,
				email: data.email,
				password: data.password,
				phone_number: data.phone_number,
				role: data.role,
				practitioner_type: data.role === "PRACTITIONER" ? data.practitioner_type : undefined,
				expertise: data.role === "PRACTITIONER" ? data.expertise : undefined,
			});
			router.push("/login?registered=true");
		} catch (err) {
			if (isApiError(err)) {
				setError(err.detail);
			} else {
				setError("Something went wrong. Please try again.");
			}
		}
	}

	return (
		<div>
			<h1 className='text-2xl font-bold text-slate-900'>Create an account</h1>
			<p className='mt-1 text-sm text-slate-500'>Join DermoAI for AI-powered skin triage</p>

			{error && (
				<Alert
					variant='error'
					className='mt-4'
				>
					{error}
				</Alert>
			)}

			<form
				onSubmit={handleSubmit(onSubmit)}
				className='mt-6 space-y-4'
			>
				<div className='grid gap-4 sm:grid-cols-2'>
					<div className='space-y-1.5'>
						<label className='block text-sm font-medium text-slate-700'>Full Name</label>
						<input
							placeholder='Your full name'
							className={inputClass}
							{...register("name")}
						/>
						{errors.name && <p className='text-sm text-red-600'>{errors.name.message}</p>}
					</div>
					<div className='space-y-1.5'>
						<label className='block text-sm font-medium text-slate-700'>Phone Number</label>
						<input
							type='tel'
							placeholder='+250 XXX XXX XXX'
							className={inputClass}
							{...register("phone_number")}
						/>
					</div>
				</div>

				<div className='space-y-1.5'>
					<label className='block text-sm font-medium text-slate-700'>Email</label>
					<input
						type='email'
						placeholder='you@example.com'
						className={inputClass}
						{...register("email")}
					/>
					{errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
				</div>

				<div className='grid gap-4 sm:grid-cols-2'>
					<div className='space-y-1.5'>
						<label className='block text-sm font-medium text-slate-700'>Password</label>
						<div className='relative'>
							<input
								type={showPassword ? "text" : "password"}
								placeholder='At least 8 characters'
								className={`${inputClass} pr-10`}
								{...register("password")}
							/>
							<button
								type='button'
								onClick={() => setShowPassword(!showPassword)}
								className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
							>
								{showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
							</button>
						</div>
						{errors.password && <p className='text-sm text-red-600'>{errors.password.message}</p>}
					</div>
					<div className='space-y-1.5'>
						<label className='block text-sm font-medium text-slate-700'>Confirm Password</label>
						<input
							type='password'
							placeholder='Repeat password'
							className={inputClass}
							{...register("confirmPassword")}
						/>
						{errors.confirmPassword && (
							<p className='text-sm text-red-600'>{errors.confirmPassword.message}</p>
						)}
					</div>
				</div>

				<div className='space-y-1.5'>
					<label className='block text-sm font-medium text-slate-700'>I am a...</label>
					<select
						className={selectClass}
						{...register("role")}
					>
						<option value='USER'>Patient / User</option>
						<option value='PRACTITIONER'>Healthcare Practitioner</option>
					</select>
				</div>

				{role === "PRACTITIONER" && (
					<div className='grid gap-4 sm:grid-cols-2'>
						<div className='space-y-1.5'>
							<label className='block text-sm font-medium text-slate-700'>Practitioner Type</label>
							<select
								className={selectClass}
								{...register("practitioner_type")}
							>
								<option value=''>Select type</option>
								<option value='GENERAL'>General Practitioner</option>
								<option value='SPECIALIST'>Specialist (Dermatologist)</option>
							</select>
							{errors.practitioner_type && (
								<p className='text-sm text-red-600'>{errors.practitioner_type.message}</p>
							)}
						</div>
						<div className='space-y-1.5'>
							<label className='block text-sm font-medium text-slate-700'>Expertise</label>
							<input
								placeholder='e.g., Dermatology'
								className={inputClass}
								{...register("expertise")}
							/>
						</div>
					</div>
				)}

				<Button
					type='submit'
					className='h-11 w-full'
					loading={isSubmitting}
				>
					Create Account
				</Button>
			</form>

			<p className='mt-6 text-center text-sm text-slate-500'>
				Already have an account?{" "}
				<Link
					href='/login'
					className='font-medium text-primary-500 hover:text-primary-600'
				>
					Sign in
				</Link>
			</p>
		</div>
	);
}
