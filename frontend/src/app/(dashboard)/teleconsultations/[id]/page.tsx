"use client";

import { use } from "react";
import Link from "next/link";
import { CallInterface } from "@/components/telemedicine/call-interface";
import { ChevronLeft } from "lucide-react";

export default function TeleconsultationPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);

	return (
		<div className='flex h-[calc(100vh-3.5rem)] flex-col -mx-4 -my-6 -mb-20 md:-mx-6 md:-mb-6'>
			{/* Bar with back: header/sidebar stay visible */}
			<div className='flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 md:px-6'>
				<Link
					href='/telemedicine'
					className='inline-flex h-8 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100'
				>
					<ChevronLeft className='h-4 w-4' />
					Back
				</Link>
				<span className='text-sm text-slate-500'>Video call</span>
			</div>
			{/* Full remaining height for call — flex-1 + min-h-0 so it fills */}
			<div className='min-h-0 flex-1 w-full'>
				<CallInterface teleconsultationId={id} />
			</div>
		</div>
	);
}
