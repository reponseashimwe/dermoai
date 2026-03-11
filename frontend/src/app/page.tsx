"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { ScanUploadForm, type ScanUploadFormHandle } from "@/components/scan/scan-upload-form";
import { ImageDetailContent } from "@/components/images/image-detail-content";
import { Avatar } from "@/components/ui/avatar";
import { Shield, Zap, Video, Scan, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSaveQuickScanToConsultation } from "@/hooks/use-save-quick-scan-to-consultation";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";
import { useState } from "react";
import type { QuickScanResponse } from "@/types/api";

const features = [
	{
		icon: Zap,
		title: "Instant Analysis",
		desc: "AI-powered triage in under 5 seconds.",
	},
	{
		icon: Shield,
		title: "Privacy First",
		desc: "Never stored without patient consent.",
	},
	{
		icon: Video,
		title: "Telemedicine Ready",
		desc: "Connect urgent cases to a dermatologist.",
	},
];

export default function HomePage() {
	const { user, isLoading } = useAuth();
	const router = useRouter();
	const { toast } = useToast();
	const [scanResult, setScanResult] = useState<QuickScanResponse | null>(null);
	const scanFormRef = useRef<ScanUploadFormHandle>(null);
	const resultSectionRef = useRef<HTMLDivElement>(null);
	const saveToConsultation = useSaveQuickScanToConsultation();

	useEffect(() => {
		if (!isLoading && user && !scanResult) {
			router.replace("/dashboard");
		}
	}, [isLoading, user, scanResult, router]);

	function handleScanAgain() {
		setScanResult(null);
		scanFormRef.current?.reset();
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}

	async function handleCreateConsultation() {
		if (!scanResult) return;
		if (!user) {
			router.push("/login");
			toast("Sign in to create a consultation from this scan.", "info");
			return;
		}
		try {
			const consultation = await saveToConsultation.mutateAsync({
				imageId: scanResult.image_id,
			});
			router.push(`/consultations/${consultation.consultation_id}`);
			toast("Consultation created. Your scan has been saved.", "success");
		} catch (err) {
			toast(isApiError(err) ? err.detail : "Failed to create consultation. Please try again.", "error");
		}
	}

	if (!isLoading && user && !scanResult) {
		return null;
	}

	// Result view — full page, replaces hero
	if (scanResult) {
		return (
			<div className='flex h-screen flex-col bg-white'>
				<header className='flex shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8'>
					<Logo size='sm' />
					<div className='flex flex-wrap items-center justify-end gap-2'>
						<Button
							size='sm'
							onClick={handleCreateConsultation}
							disabled={saveToConsultation.isPending}
							loading={saveToConsultation.isPending}
						>
							Create consultation
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={handleScanAgain}
						>
							<Scan className='mr-2 h-4 w-4' />
							Scan again
						</Button>
					</div>
				</header>
				<div
					ref={resultSectionRef}
					className='min-h-0 flex-1 overflow-y-auto'
				>
					<div className='mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10'>
						<ImageDetailContent image={scanResult} />
						<div className='mt-8 flex flex-wrap justify-center gap-3 pb-8'>
							<Button
								onClick={handleCreateConsultation}
								disabled={saveToConsultation.isPending}
								loading={saveToConsultation.isPending}
							>
								Create consultation
							</Button>
							<Button
								variant='outline'
								onClick={handleScanAgain}
								className='min-w-[180px]'
							>
								<Scan className='mr-2 h-4 w-4' />
								Scan again
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			{/* ── Phone layout (< sm) ─────────────────────────────────── */}
			<div
				className='relative flex min-h-screen flex-col overflow-hidden sm:hidden'
				style={{
					backgroundImage:
						"linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-700) 45%, var(--color-primary-500) 100%)",
				}}
			>
				{/* Grid pattern overlay */}
				<div
					className='pointer-events-none absolute inset-0'
					style={{
						backgroundImage:
							"linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
						backgroundSize: "32px 32px",
					}}
				/>

				{/* Header */}
				<header className='relative z-10 flex items-center justify-between px-4 pb-2 pt-5'>
					<Logo
						size='sm'
						light
					/>
					{!isLoading && !user && (
						<Link href='/login'>
							<Button
								variant='ghost'
								size='sm'
								className='rounded-full border border-white/30 px-4 text-white hover:bg-white/10'
							>
								Sign in
							</Button>
						</Link>
					)}
					{!isLoading && user && (
						<Link href='/dashboard'>
							<Button
								size='sm'
								className='rounded-full'
							>
								Dashboard
							</Button>
						</Link>
					)}
				</header>

				{/* Hero copy */}
				<div className='relative z-10 px-4 pb-10 pt-5'>
					<span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90'>
						<span className='h-1.5 w-1.5 rounded-full bg-white/60' />
						Made for Africa · Fitzpatrick V–VI
					</span>
					<h1 className='mt-3 text-[1.75rem] font-bold leading-snug text-white'>
						AI Skin Triage <span className='text-primary-50'>for Dark Skin.</span>
					</h1>
					<p className='mt-2 text-sm leading-relaxed text-white/75'>
						Instant dermatological analysis powered by deep learning — optimised for darker skin tones and
						built for resource-limited clinics.
					</p>

					{/* Features row */}
					<div className='mt-4 rounded-2xl border border-white/15 bg-white/5 py-3 hidden'>
						<div className='grid grid-cols-3 text-center text-xs font-medium text-white/85'>
							{features.map((f, i) => (
								<div
									key={i}
									className='flex flex-col items-center gap-1.5 px-2'
								>
									<div className='flex h-9 w-9 items-center justify-center rounded-full bg-white/10'>
										<f.icon className='h-4 w-4 text-primary-50' />
									</div>
									<span className='text-xs'>{f.title}</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* White bottom sheet */}
				<div className='relative z-10 flex-1 rounded-t-3xl bg-white px-8 pb-8 pt-3 shadow-2xl'>
					<div className='mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200' />

					<h2 className='text-xl font-bold text-slate-900'>Quick Skin Scan</h2>
					<div className='mt-1 flex items-center gap-2'>
						<span className='text-xs text-slate-500'>Free · No login required</span>
						<span className='rounded-full border border-emerald-500 px-2 py-0.5 text-[10px] font-bold text-emerald-600'>
							FREE
						</span>
					</div>

					<div className='mt-4'>
						<ScanUploadForm
							ref={scanFormRef}
							resultDisplay='fullPage'
							onResultReady={setScanResult}
							onScanAgain={handleScanAgain}
							showSampleResult
						/>
					</div>

					<div className='mt-4 flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500'>
						<Info className='mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400' />
						<p>
							<span className='font-semibold text-slate-700'>Triage support only.</span> For confirmed
							diagnosis or treatment, connect with a specialist via DermoAI teleconsultation.
						</p>
					</div>
				</div>
			</div>

			{/* ── Tablet layout (sm – lg) ─────────────────────────────────── */}
			<div className='hidden min-h-screen flex-col bg-white sm:flex lg:hidden'>
				{/* Header */}
				<header className='shrink-0 bg-white py-4 font-sans sm:py-5'>
					<div className='mx-auto flex max-w-7xl items-center justify-between px-6'>
						<Link
							href='/'
							className='flex items-center gap-2'
						>
							<Logo size='sm' />
						</Link>
						<div className='flex items-center gap-3'>
							{!isLoading && !user && (
								<>
									<Link href='/login'>
										<Button
											variant='ghost'
											size='sm'
											className='h-8 px-3 text-sm font-medium text-slate-700'
										>
											Sign in
										</Button>
									</Link>
									<Link href='/register'>
										<Button
											size='sm'
											className='h-8 px-3 text-sm font-medium'
										>
											Get Started
										</Button>
									</Link>
								</>
							)}
						</div>
					</div>
				</header>

				<main className='flex w-full flex-1 flex-col px-6 pb-8 pt-6'>
					<div className='mx-auto flex w-full max-w-xl flex-1 flex-col'>
						{/* Hero card */}
						<section className='mb-6'>
							<div
								className='relative overflow-hidden rounded-2xl px-5 py-6'
								style={{
									backgroundImage:
										"linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-700) 45%, var(--color-primary-500) 100%)",
								}}
							>
								<div
									className='pointer-events-none absolute inset-0'
									style={{
										backgroundImage:
											"linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
										backgroundSize: "32px 32px",
									}}
								/>
								<div className='relative z-10'>
									<span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90'>
										<span className='h-1.5 w-1.5 rounded-full bg-white/60' />
										Made for Africa · Fitzpatrick V–VI
									</span>
									<h1 className='mt-3 text-2xl font-bold leading-snug text-white'>
										AI Skin Triage <span className='text-primary-50'>for Dark Skin.</span>
									</h1>
									<p className='mt-2 text-sm leading-relaxed text-white/75'>
										Instant dermatological analysis powered by deep learning — optimised for darker
										skin tones and built for resource-limited clinics.
									</p>
									<div className='mt-4 rounded-2xl border border-white/15 bg-white/5 px-2 py-3'>
										<div className='grid grid-cols-3 text-center text-xs font-medium text-white/85'>
											{features.map((f, i) => (
												<div
													key={i}
													className='flex flex-col items-center gap-1 px-2'
												>
													<div className='flex h-9 w-9 items-center justify-center rounded-full bg-white/10'>
														<f.icon className='h-4 w-4 text-primary-50' />
													</div>
													<span className='text-xs'>{f.title}</span>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</section>

						{/* Scan form */}
						<div className='flex flex-1 flex-col'>
							<h2 className='mb-1 text-base font-semibold text-slate-900'>Quick Skin Scan</h2>
							<p className='mb-4 text-xs font-medium text-emerald-700'>Free · No login required</p>
							<ScanUploadForm
								ref={scanFormRef}
								resultDisplay='fullPage'
								onResultReady={setScanResult}
								onScanAgain={handleScanAgain}
								showSampleResult
							/>
							<p className='mt-4 text-center text-xs text-slate-500'>
								No account required. Results support triage only — for diagnosis or treatment, connect
								with a clinician via teleconsultation inside DermoAI.
							</p>
						</div>
					</div>
				</main>
			</div>

			{/* ── Desktop layout (≥ lg) ─────────────────────────────────── */}
			<div className='relative hidden h-screen w-full overflow-hidden lg:block bg-white'>
				<div
					className='absolute w-1/2 h-full'
					style={{
						backgroundImage:
							"linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary-700) 45%, var(--color-primary-500) 100%)",
					}}
				>
					{/* Grid overlay */}
					<div
						className='pointer-events-none absolute inset-0'
						style={{
							backgroundImage:
								"linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
							backgroundSize: "40px 40px",
						}}
					/>
				</div>
				<div className='mx-auto flex h-full max-w-[90vw]'>
					{/* ── Left panel (brand / hero) ── */}
					<div className='relative flex w-1/2 flex-col overflow-hidden'>
						<div className='relative z-10 flex h-full flex-col px-8 py-7 lg:px-10 lg:py-8'>
							{/* Logo */}
							<Logo
								size='sm'
								light
							/>

							{/* Hero copy */}
							<div className='flex flex-1 flex-col justify-center items-center max-w-lg'>
								<div className='max-w-xl '>
									<span className='inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90'>
										<span className='h-1.5 w-1.5 rounded-full bg-white/60' />
										Made for Africa · Fitzpatrick V–VI
									</span>

									<h1 className='mt-5 text-4xl font-bold leading-tight text-white xl:text-5xl'>
										AI Skin Triage
										<br />
										for Dark Skin.
									</h1>

									<p className='mt-4 text-sm leading-relaxed text-white/75'>
										Instant dermatological analysis powered by deep learning — optimised for darker
										skin tones and built for resource-limited clinics across Sub-Saharan Africa.
									</p>

									{/* Feature cards */}
									<div className='mt-8 space-y-3'>
										{features.map((f, i) => (
											<div
												key={i}
												className='flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm'
											>
												<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10'>
													<f.icon className='h-4 w-4 text-white/80' />
												</div>
												<div>
													<p className='text-sm font-semibold text-white'>{f.title}</p>
													<p className='text-xs text-white/60'>{f.desc}</p>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* ── Right panel (form) ── */}
					<div className='flex w-1/2 flex-col overflow-y-auto'>
						{/* Header */}
						<header className='flex shrink-0 items-center justify-end gap-3 px-8 py-5 lg:px-10 lg:py-6'>
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
									<Link href='/dashboard'>
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
						</header>

						{/* Form content */}
						<div className='flex flex-1 flex-col items-center justify-center px-8 pb-10 lg:px-14 mx-auto max-w-lg'>
							<div className='w-full max-w-md'>
								<h2
									id='quick-scan'
									className='text-lg font-bold text-slate-900'
								>
									Quick Skin Scan
								</h2>
								<div className='mt-1.5 flex items-center gap-2'>
									<span className='text-xs text-slate-500'>Free · No login required</span>
								</div>

								<div className='mt-12'>
									<ScanUploadForm
										ref={scanFormRef}
										resultDisplay='fullPage'
										onResultReady={setScanResult}
										onScanAgain={handleScanAgain}
										showSampleResult
									/>
								</div>

								{/* Disclaimer */}
								<p className='mt-10 flex gap-1.5 text-xs text-slate-500'>
									<Info className='mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400' />
									<span>
										<span className='font-semibold text-slate-700'>Triage support only.</span> For
										confirmed diagnosis or treatment, connect with a specialist via DermoAI
										teleconsultation.
									</span>
								</p>

								{/* Footer checks */}
								<div className='mt-5 flex items-center justify-center gap-3 text-xs font-medium text-primary-600'>
									<span>✓ No account required</span>
									<span className='text-slate-200'>·</span>
									<span>✓ Educational purposes</span>
									<span className='text-slate-200'>·</span>
									<span>✓ 10 MB max</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
