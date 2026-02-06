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

const loginSchema = z.object({
	email: z.string().email("Enter a valid email"),
	password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const { login } = useAuth();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
	});

	async function onSubmit(data: LoginForm) {
		setError(null);
		try {
			await login(data.email, data.password);
			router.push("/");
		} catch (err) {
			if (isApiError(err)) {
				setError(err.detail);
			} else {
				setError("Something went wrong. Please try again.");
			}
		}
	}

	return (
		<div className='max-sm:h-[70vh] flex flex-col items-center justify-center'>
			<div className='w-full'>
				<h1 className='text-2xl font-bold text-slate-900'>Get started</h1>
				<p className='mt-1 text-sm text-slate-500'>Welcome to DermoAI — Let&apos;s sign in to your account</p>

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
					className='mt-8 space-y-5'
				>
					<div className='space-y-1.5'>
						<label
							htmlFor='email'
							className='block text-sm font-medium text-slate-700'
						>
							Email
						</label>
						<input
							id='email'
							type='email'
							placeholder='you@example.com'
							className='flex h-11 w-full rounded-lg border-0 bg-slate-100 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30'
							{...register("email")}
						/>
						{errors.email && <p className='text-sm text-red-600'>{errors.email.message}</p>}
					</div>

					<div className='space-y-1.5'>
						<label
							htmlFor='password'
							className='block text-sm font-medium text-slate-700'
						>
							Password
						</label>
						<div className='relative'>
							<input
								id='password'
								type={showPassword ? "text" : "password"}
								placeholder='Enter your password'
								className='flex h-11 w-full rounded-lg border-0 bg-slate-100 px-3.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30'
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

					<Button
						type='submit'
						className='h-11 w-full'
						loading={isSubmitting}
					>
						Sign in
					</Button>
				</form>

				<p className='mt-8 text-center text-sm text-slate-500'>
					Don&apos;t have an account?{" "}
					<Link
						href='/register'
						className='font-medium text-primary-500 hover:text-primary-600'
					>
						Create one
					</Link>
				</p>
			</div>
		</div>
	);
}
