import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FileText, Lock, Mail, Calendar, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Legal — DermoAI",
	description: "End-User Licence Agreement and Privacy Policy for the DermoAI clinical decision-support system.",
};

const LAST_UPDATED = "March 2026";
const CONTACT_EMAIL = "researchethics@alueducation.com";

const tocSections = [
	{
		id: "eula",
		label: "Licence Agreement",
		icon: FileText,
		clauses: [
			{ id: "eula-1", label: "Scope of Use" },
			{ id: "eula-2", label: "No Liability" },
			{ id: "eula-3", label: "Restrictions" },
		],
	},
	{
		id: "privacy",
		label: "Privacy Policy",
		icon: Lock,
		clauses: [
			{ id: "privacy-1", label: "Data Collection" },
			{ id: "privacy-2", label: "Consent & Model Reuse" },
			{ id: "privacy-3", label: "Storage & Security" },
			{ id: "privacy-4", label: "Contact & Queries" },
		],
	},
];

export default function LegalPage() {
	return (
		<div className='flex min-h-screen flex-col bg-slate-50'>
			<Header />

			<main className='flex-1'>
				{/* ── Page hero ── */}
				<div className='border-b border-slate-200 bg-white'>
					<div className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
						<nav className='mb-4 flex items-center gap-1.5 text-xs text-slate-400 print:hidden'>
							<Link
								href='/'
								className='transition-colors hover:text-slate-600'
							>
								Home
							</Link>
							<ChevronRight className='h-3 w-3' />
							<span className='text-slate-600'>Legal</span>
						</nav>

						<h1 className='text-3xl font-bold text-slate-900'>Legal</h1>
						<p className='mt-2 max-w-2xl text-sm leading-relaxed text-slate-500'>
							The following documents govern your use of the DermoAI clinical decision-support system and
							describe how patient data is handled within the platform. This policy applies to health
							workers using DermoAI, the patients whose images are submitted through the platform, and
							the specialist dermatologists assigned to review cases.
						</p>

						<div className='mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500'>
							<span className='flex items-center gap-1.5'>
								<Calendar className='h-3.5 w-3.5 shrink-0' />
								Last updated: {LAST_UPDATED}
							</span>
							<span className='hidden text-slate-300 sm:inline'>·</span>
							<span className='flex items-center gap-1.5'>
								<Mail className='h-3.5 w-3.5 shrink-0' />
								Questions?{" "}
								<a
									href={`mailto:${CONTACT_EMAIL}`}
									className='font-medium text-primary-600 hover:underline'
								>
									{CONTACT_EMAIL}
								</a>
							</span>
						</div>
					</div>
				</div>

				{/* ── Two-column layout: sticky ToC + content ── */}
				<div className='mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8'>
					<div className='lg:grid lg:grid-cols-[220px_1fr] lg:gap-14 xl:grid-cols-[260px_1fr]'>
						{/* ── Sticky sidebar — hidden below lg ── */}
						<aside className='hidden lg:block print:hidden'>
							<div className='sticky top-8 space-y-7'>
								<p className='text-[10px] font-semibold uppercase tracking-widest text-slate-400'>
									On this page
								</p>

								{tocSections.map((section) => (
									<div
										key={section.id}
										className='space-y-1.5'
									>
										<a
											href={`#${section.id}`}
											className='flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-primary-600'
										>
											<section.icon className='h-3.5 w-3.5 shrink-0 text-primary-400' />
											{section.label}
										</a>
										<ul className='ml-5 space-y-1 border-l border-slate-200 pl-3'>
											{section.clauses.map((clause) => (
												<li key={clause.id}>
													<a
														href={`#${clause.id}`}
														className='block py-0.5 text-xs text-slate-500 transition-colors hover:text-primary-600'
													>
														{clause.label}
													</a>
												</li>
											))}
										</ul>
									</div>
								))}
							</div>
						</aside>

						{/* ── Main legal content ── */}
						<div className='space-y-14 print:space-y-10'>
							{/* ════ EULA ════ */}
							<section
								id='eula'
								className='scroll-mt-6'
							>
								<div className='mb-8 flex items-center gap-3'>
									<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50'>
										<FileText className='h-5 w-5 text-primary-600' />
									</div>
									<div>
										<h2 className='text-xl font-bold text-slate-900'>End-User Licence Agreement</h2>
										<p className='text-sm text-slate-500'>
											Governs authorised access to and use of the DermoAI system
										</p>
									</div>
								</div>

								<div className='space-y-6'>
									{/* EULA 1 */}
									<div
										id='eula-1'
										className='scroll-mt-6 rounded-xl border border-slate-200 bg-white'
									>
										<div className='border-b border-slate-100 px-5 py-4'>
											<h3 className='text-sm font-semibold text-slate-900'>
												<span className='mr-2 font-bold text-primary-500'>1.</span>
												Scope of Use
											</h3>
										</div>
										<div className='space-y-3 px-5 py-5 text-sm leading-relaxed text-slate-700'>
											<p>
												DermoAI is a clinical decision-support tool designed exclusively for use
												by trained health workers, including general practitioners and nurses,
												in a professional clinical capacity. Outputs produced by the system are
												risk assessments and triage recommendations, not medical diagnoses.
											</p>
											<p>
												The system must not be used by patients or members of the general public
												to self-diagnose or make independent treatment decisions. Any
												interpretation of system outputs must be performed by a qualified health
												worker who retains full clinical authority over the consultation.
											</p>
										</div>
									</div>

									{/* EULA 2 */}
									<div
										id='eula-2'
										className='scroll-mt-6 rounded-xl border border-slate-200 bg-white'
									>
										<div className='border-b border-slate-100 px-5 py-4'>
											<h3 className='text-sm font-semibold text-slate-900'>
												<span className='mr-2 font-bold text-primary-500'>2.</span>
												No Liability for Clinical Outcomes
											</h3>
										</div>
										<div className='space-y-3 px-5 py-5 text-sm leading-relaxed text-slate-700'>
											<p>
												DermoAI does not replace clinical judgement. The health worker retains
												full authority and professional responsibility for all clinical
												decisions made in relation to a patient. Errors in AI triage outputs do
												not transfer liability to the system or its developers.
											</p>
											<p>
												The system is a research prototype that has not received medical device
												certification from the Rwanda Food and Drugs Authority or any equivalent
												regulatory body. It must not be used as the sole basis for any clinical
												decision.
											</p>
										</div>
									</div>

									{/* EULA 3 */}
									<div
										id='eula-3'
										className='scroll-mt-6 rounded-xl border border-slate-200 bg-white'
									>
										<div className='border-b border-slate-100 px-5 py-4'>
											<h3 className='text-sm font-semibold text-slate-900'>
												<span className='mr-2 font-bold text-primary-500'>3.</span>
												Permitted Use and Restrictions
											</h3>
										</div>
										<div className='space-y-3 px-5 py-5 text-sm leading-relaxed text-slate-700'>
											<p>
												Users may not attempt to reverse engineer, modify, or redistribute the
												system or its underlying model. Access is restricted to verified
												healthcare professionals approved by a system administrator.
											</p>
											<p>
												The system may not be used outside the clinical triage workflow for
												which it was designed. Any use of system outputs for purposes other than
												direct patient triage, including commercial, research, or training
												purposes, requires explicit written approval.
											</p>
										</div>
									</div>
								</div>
							</section>

							<hr className='border-slate-200' />

							{/* ════ Privacy Policy ════ */}
							<section
								id='privacy'
								className='scroll-mt-6'
							>
								<div className='mb-8 flex items-center gap-3'>
									<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50'>
										<Lock className='h-5 w-5 text-primary-600' />
									</div>
									<div>
										<h2 className='text-xl font-bold text-slate-900'>Privacy Policy</h2>
										<p className='text-sm text-slate-500'>
											Patient data handling within the DermoAI platform
										</p>
									</div>
								</div>

								<div className='space-y-6'>
									{/* Privacy 1 */}
									<div
										id='privacy-1'
										className='scroll-mt-6 rounded-xl border border-slate-200 bg-white'
									>
										<div className='border-b border-slate-100 px-5 py-4'>
											<h3 className='text-sm font-semibold text-slate-900'>
												<span className='mr-2 font-bold text-primary-500'>1.</span>
												Data Collection and Purpose
											</h3>
										</div>
										<div className='space-y-3 px-5 py-5 text-sm leading-relaxed text-slate-700'>
											<p>
												DermoAI collects patient skin lesion images submitted through the triage
												interface solely for the purpose of generating a clinical triage
												recommendation. The system operates across two access contexts.
											</p>
											<p>
												Images submitted through the public quick scan interface on the homepage
												are processed for triage and stored without any link to a user identity,
												account, or consultation record. They cannot be connected to any individual
												and are not accessible through any part of the platform interface.
											</p>
											<p>
												Images submitted within a practitioner dashboard consultation are stored
												and visible exclusively to the submitting practitioner within their own
												account. No other practitioner, administrator, or user can view another
												practitioner&apos;s consultation images unless formally assigned to the
												case as a reviewing specialist.
											</p>
										</div>
									</div>

									{/* Privacy 2 */}
									<div
										id='privacy-2'
										className='scroll-mt-6 rounded-xl border border-slate-200 bg-white'
									>
										<div className='border-b border-slate-100 px-5 py-4'>
											<h3 className='text-sm font-semibold text-slate-900'>
												<span className='mr-2 font-bold text-primary-500'>2.</span>
												Consent and Model Reuse
											</h3>
										</div>
										<div className='space-y-3 px-5 py-5 text-sm leading-relaxed text-slate-700'>
											<p>
												By default, patient images within consultations are accessible only to
												the treating health worker and any specialist formally assigned to
												review the case. Consent for images to be used for specialist review and
												future model improvement is disabled by default and requires affirmative
												opt-in from the patient.
											</p>
											<p>
												Where a practitioner wishes to enable consent, a PIN is generated and
												sent to the patient&apos;s registered mobile phone. The practitioner
												enters this PIN only after the patient provides it, ensuring the
												decision to share data remains with the patient. Patients who do not
												provide their PIN retain full privacy with no images shared beyond the
												treating practitioner.
											</p>
											<p>
												Consented images are anonymised at the point of display and surfaced to
												specialists through a review queue. The specialist sees only the image
												and its AI-predicted condition. No patient identity, uploader reference,
												or consultation record is displayed. The specialist assigns a condition
												label. For model improvement, only the image and the specialist-assigned
												label are used. No patient information or consultation metadata is
												included in the model improvement pipeline.
											</p>
										</div>
									</div>

									{/* Privacy 3 */}
									<div
										id='privacy-3'
										className='scroll-mt-6 rounded-xl border border-slate-200 bg-white'
									>
										<div className='border-b border-slate-100 px-5 py-4'>
											<h3 className='text-sm font-semibold text-slate-900'>
												<span className='mr-2 font-bold text-primary-500'>3.</span>
												Data Storage and Security
											</h3>
										</div>
										<div className='space-y-3 px-5 py-5 text-sm leading-relaxed text-slate-700'>
											<p>
												Consultation metadata, user account records, and personally identifiable
												information are stored in a PostgreSQL database. Patient images are
												stored separately in a dedicated image storage service. Data residency
												configuration will be formalised before any production deployment.
											</p>
											<p>
												Access to consultation records is enforced through role-based access
												control at both API and frontend routing levels. Practitioners access
												only their own consultations. Specialists access only the consented
												images surfaced through the review queue. Administrators have access
												to consented images only, through a dedicated interface, for model
												oversight and system maintenance. Non-consented images are not
												accessible to any role other than the practitioner who submitted them.
											</p>
											<p>
												All data transmission occurs over HTTPS. Authentication is managed
												through short-lived JWT access tokens, valid for 30 minutes, paired
												with longer-lived refresh tokens to maintain session continuity without
												requiring frequent re-authentication.
											</p>
										</div>
									</div>

									{/* Privacy 4 */}
									<div
										id='privacy-4'
										className='scroll-mt-6 rounded-xl border border-slate-200 bg-white'
									>
										<div className='border-b border-slate-100 px-5 py-4'>
											<h3 className='text-sm font-semibold text-slate-900'>
												<span className='mr-2 font-bold text-primary-500'>4.</span>
												Contact and Queries
											</h3>
										</div>
										<div className='space-y-3 px-5 py-5 text-sm leading-relaxed text-slate-700'>
											<p>
												DermoAI operates under ethics approval from the African Leadership
												University Research Ethics Committee, approval code{" "}
												<span className='font-medium text-slate-900'>J26BSE068</span>, issued 6
												February 2026.
											</p>
											<p>
												For questions about how patient data is handled, patients and
												practitioners should contact the health facility administrator in the
												first instance. For research ethics queries related to the system&apos;s
												development and validation, contact the ALU research ethics team at{" "}
												<a
													href={`mailto:${CONTACT_EMAIL}`}
													className='font-medium text-primary-600 hover:underline'
												>
													{CONTACT_EMAIL}
												</a>
												. The team aims to respond within five working days.
											</p>
										</div>
									</div>
								</div>
							</section>

							{/* ── Contact card ── */}
							<div className='rounded-xl border border-primary-100 bg-primary-50 p-5 print:border-slate-200 print:bg-white'>
								<p className='text-sm font-semibold text-slate-900'>Questions or concerns?</p>
								<p className='mt-1.5 text-sm text-slate-600'>
									Contact our research ethics team at{" "}
									<a
										href={`mailto:${CONTACT_EMAIL}`}
										className='font-medium text-primary-600 hover:underline'
									>
										{CONTACT_EMAIL}
									</a>
									. We aim to respond within five working days.
								</p>
							</div>
						</div>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
