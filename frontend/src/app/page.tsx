"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Logo } from "@/components/layout/logo";
import { ScanUploadForm, type ScanUploadFormHandle } from "@/components/scan/scan-upload-form";
import { ImageDetailContent } from "@/components/images/image-detail-content";
import { Avatar } from "@/components/ui/avatar";
import { Shield, Zap, Stethoscope, ArrowRight, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSaveQuickScanToConsultation } from "@/hooks/use-save-quick-scan-to-consultation";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";
import type { QuickScanResponse } from "@/types/api";

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
	const { toast } = useToast();
	const [scanResult, setScanResult] = useState<QuickScanResponse | null>(null);
	const scanFormRef = useRef<ScanUploadFormHandle>(null);
	const resultSectionRef = useRef<HTMLDivElement>(null);
	const saveToConsultation = useSaveQuickScanToConsultation();

	// Redirect logged-in users to dashboard only when they have no scan result (so they can complete a quick scan first)
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
			toast(
				isApiError(err) ? err.detail : "Failed to create consultation. Please try again.",
				"error"
			);
		}
	}

	if (!isLoading && user && !scanResult) {
		return null;
	}

	// When we have a result, show only the result (no hero) — one viewport, scroll inside content
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
						<Button variant='outline' size='sm' onClick={handleScanAgain}>
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
							<Button variant='outline' onClick={handleScanAgain} className='min-w-[180px]'>
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
			{/* Mobile to md: single-column, full-width whole screen */}
			<div className='flex min-h-screen flex-col bg-white lg:hidden'>
				<Header />
				<main className='flex flex-1 w-full flex-col overflow-hidden px-4 pt-6 pb-8 sm:px-6 sm:pt-8'>
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
								AI Skin Triage <span className='text-primary-600'>for Everyone.</span>
							</h1>
							<p className='mt-1 text-sm text-slate-500'>
								Instant dermatological analysis powered by deep learning — optimised for darker skin tones
								and low-resource clinics.
							</p>
						</div>
						<div className='w-full max-w-md'>
							<h2 className='mb-1 text-center text-base font-semibold text-slate-900'>Quick Skin Scan</h2>
							<p className='mb-4 text-center text-xs font-medium text-emerald-700'>
								Free · No login required
							</p>
							<ScanUploadForm
								ref={scanFormRef}
								resultDisplay="fullPage"
								onResultReady={setScanResult}
								onScanAgain={handleScanAgain}
							/>
							<p className='mt-4 text-center text-xs text-slate-500'>
								No account required. Results support triage only — for diagnosis or treatment, connect
								with a clinician via teleconsultation inside DermoAI.
							</p>
						</div>
					</div>
				</main>
			</div>

			{/* Desktop: hero + form only (no result section; result replaces whole page) */}
			<div className='relative hidden min-h-screen w-full lg:block'>
				<div
					className='absolute inset-0 z-0 flex flex-row pointer-events-none'
					aria-hidden
				>
					<div className='absolute left-0 top-0 h-full w-1/2 bg-slate-100' />
					<div
						className='absolute right-0 top-0 h-full w-1/2 bg-white'
					/>
				</div>
				<div className='relative z-10 flex min-h-screen justify-center'>
					<div className='flex w-full max-w-7xl flex-row'>
						<div className='flex w-1/2 flex-col'>
							<header className='flex min-h-[72px] shrink-0 items-center px-6 py-5 lg:min-h-[80px] lg:px-8 lg:py-6'>
								<Logo size='sm' />
							</header>
							<div className='flex flex-1 flex-col justify-center overflow-auto px-6 pr-12 lg:px-8 lg:pr-16'>
								<div>
									<span className='inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700'>
										<span className='h-1.5 w-1.5 rounded-full bg-primary-500' />
										Made for Africa · Fitzpatrick V–VI
									</span>
									<h1 className='mt-4 text-4xl font-bold leading-tight text-slate-900 xl:text-5xl'>
										AI Skin Triage
										<br />
										<span className='text-primary-600'>for Everyone.</span>
									</h1>
									<p className='mt-4 max-w-md text-slate-500'>
										Instant dermatological analysis powered by deep learning — optimised for darker
										skin tones and built for resource-limited clinics across Sub-Saharan Africa.
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

						<div className='flex w-1/2 flex-col'>
							<header className='flex min-h-[72px] shrink-0 items-center justify-end px-6 py-5 lg:min-h-[80px] lg:px-8 lg:py-6'>
								<div className='flex items-center gap-4'>
									{!isLoading && !user && (
										<>
											<Link href='/login'>
												<Button variant='ghost' size='sm'>Sign in</Button>
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
											<Link href='/profile' className='flex items-center' aria-label='Profile'>
												<Avatar name={user.name} size='md' />
											</Link>
										</>
									)}
								</div>
							</header>
							<div className='flex flex-1 flex-col items-center justify-center overflow-auto pl-12 lg:pl-16'>
								<div className='w-full max-w-md px-6 lg:px-8'>
									<h2 className='mb-1 text-base font-semibold text-slate-900'>Quick Skin Scan</h2>
									<p className='mb-4 text-xs font-medium text-emerald-700'>Free · No login required</p>
									<ScanUploadForm
										ref={scanFormRef}
										resultDisplay="fullPage"
										onResultReady={setScanResult}
										onScanAgain={handleScanAgain}
									/>
									<p className='mt-4 text-xs text-slate-500'>
										No account required. Results support triage only — for diagnosis or treatment,
										you can connect with a specialist through teleconsultation in DermoAI.
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
