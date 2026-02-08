"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Logo } from "@/components/layout/logo";
import { ScanUploadForm } from "@/components/scan/scan-upload-form";
import { Avatar } from "@/components/ui/avatar";
import { Shield, Zap, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const features = [
	{
		icon: Zap,
		title: "Instant Analysis",
		desc: "Upload a photo and get AI-powered results in seconds.",
	},
	{
		icon: Shield,
		title: "Privacy First",
		desc: "Your images are processed securely and never shared.",
	},
	{
		icon: Stethoscope,
		title: "Clinical-Grade",
		desc: "Optimized for Fitzpatrick Skin Types V-VI.",
	},
];

export default function HomePage() {
	const { user, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && user) {
			router.replace("/dashboard");
		}
	}, [isLoading, user, router]);

	if (!isLoading && user) {
		return null;
	}

	return (
		<>
			{/* Mobile: full-width header + content */}
			<div className='flex h-screen flex-col overflow-hidden bg-white lg:hidden relative'>
				<div
					className='absolute inset-0 flex flex-row pointer-events-none'
					aria-hidden
				>
					<div className='absolute left-0 top-0 h-full w-1/2 bg-slate-50' />
					<div
						className='absolute right-0 top-0 h-full w-1/2'
						style={{ backgroundColor: "#ffffff" }}
					/>
				</div>
				<Header />
				<main className='mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden px-6 pt-8'>
					<div className='mb-6 flex justify-center gap-6'>
						{features.map((f, i) => (
							<div
								key={i}
								className='flex flex-col items-center gap-1 text-center'
							>
								<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50'>
									<f.icon className='h-5 w-5 text-primary-500' />
								</div>
								<span className='text-xs font-medium text-slate-700'>{f.title}</span>
							</div>
						))}
					</div>
					<div className='flex min-h-0 flex-1 flex-col items-center justify-center'>
						<div className='mb-4 text-center'>
							<h1 className='text-2xl font-bold text-slate-900'>
								AI Skin <span className='text-primary-500'>Triage</span>
							</h1>
							<p className='mt-1 text-sm text-slate-500'>Upload an image for instant analysis</p>
						</div>
						<div className='w-full max-w-md'>
							<h2 className='mb-5 text-center text-base font-semibold text-slate-800'>Quick Skin Scan</h2>
							<ScanUploadForm />
							<p className='mt-4 text-center text-xs text-slate-400'>
								No account required. Results are for educational purposes only.
							</p>
						</div>
					</div>
				</main>
			</div>

			{/* Desktop: relative wrapper + absolute full-viewport backgrounds (left gray, right white), content in max-w-7xl above */}
			<div className='relative hidden min-h-screen w-full lg:block'>
				{/* Absolute backgrounds — full viewport, not affected by max-w-7xl inner content */}
				<div
					className='absolute inset-0 flex flex-row pointer-events-none'
					aria-hidden
				>
					<div className='absolute left-0 top-0 h-full w-1/2 bg-slate-50' />
					<div
						className='absolute right-0 top-0 h-full w-1/2'
						style={{ backgroundColor: "#ffffff" }}
					/>
				</div>
				{/* Content layer — max-w-7xl only affects this, backgrounds already full bleed */}
				<div className='relative z-10 flex min-h-screen justify-center'>
					<div className='flex w-full max-w-7xl flex-row'>
						{/* Left column — no bg here, absolute handles it */}
						<div className='flex w-1/2 flex-col'>
							<header className='flex min-h-[72px] shrink-0 items-center px-6 py-5 lg:min-h-[80px] lg:px-8 lg:py-6'>
								<Logo size='sm' />
							</header>
							<div className='flex flex-1 flex-col justify-center overflow-auto px-6 pr-12 lg:px-8 lg:pr-16'>
								<div>
									<span className='inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600'>
										Made for Africa
									</span>
									<h1 className='mt-4 text-4xl font-bold leading-tight text-slate-900 xl:text-5xl'>
										AI Skin Triage
										<br />
										<span className='text-primary-500'>for Everyone</span>
									</h1>
									<p className='mt-4 max-w-md text-slate-500'>
										Get instant dermatological analysis powered by AI — optimized for darker skin
										tones, designed for resource-limited settings.
									</p>
								</div>
								<div className='mt-10 space-y-4'>
									{features.map((f, i) => (
										<div
											key={i}
											className='flex items-start gap-3'
										>
											<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50'>
												<f.icon className='h-4 w-4 text-primary-500' />
											</div>
											<div>
												<p className='text-sm font-semibold text-slate-800'>{f.title}</p>
												<p className='text-sm text-slate-400'>{f.desc}</p>
											</div>
										</div>
									))}
								</div>
								{!user && (
									<div className='mt-10 flex gap-3'>
										<Link href='/register'>
											<Button>
												Get Started
												<ArrowRight className='h-4 w-4' />
											</Button>
										</Link>
										<Link href='/login'>
											<Button variant='ghost'>Sign in</Button>
										</Link>
									</div>
								)}
							</div>
						</div>

						{/* Right column — no bg here, absolute handles it */}
						<div className='flex w-1/2 flex-col'>
							<header className='flex min-h-[72px] shrink-0 items-center justify-end px-6 py-5 lg:min-h-[80px] lg:px-8 lg:py-6'>
								<div className='flex items-center gap-4'>
									{!isLoading && !user && (
										<>
											<Link href='/login'>
												<Button
													variant='ghost'
													size='sm'
												>
													Sign in
												</Button>
											</Link>
											<Link href='/register'>
												<Button size='sm'>Get Started</Button>
											</Link>
										</>
									)}
									{!isLoading && user && (
										<>
											<Link href='/consultations'>
												<Button size='sm'>Dashboard</Button>
											</Link>
											<Link
												href='/profile'
												className='flex items-center'
												aria-label='Profile'
											>
												<Avatar
													name={user.name}
													size='md'
												/>
											</Link>
										</>
									)}
								</div>
							</header>
							<div className='flex flex-1 flex-col items-center justify-center overflow-auto pl-12 lg:pl-16'>
								<div className='w-full max-w-md px-6 lg:px-8'>
									<h2 className='mb-5 text-base font-semibold text-slate-800'>Quick Skin Scan</h2>
									<ScanUploadForm />
									<p className='mt-4 text-xs text-slate-400'>
										No account required. Results are for educational purposes only.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
