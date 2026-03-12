"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { usePractitioners } from "@/hooks/use-practitioners";
import { getVisibleNavItems, type AppRole } from "@/config/roles";

/** Build bottom nav from role config. Scans is primary (middle). */
function getBottomNavItems(role: AppRole | undefined, isSpecialist: boolean) {
	const visible = getVisibleNavItems(role, isSpecialist);
	const primaryHref = "/scan-history";
	const allowedHrefs = [
		"/dashboard",
		"/consultations",
		"/scan-history",
		"/telemedicine",
		"/review-queue",
		"/notifications",
		"/schedules",
		"/appointments",
	];
	const filtered = visible.filter((item) => allowedHrefs.includes(item.href)).slice(0, 5);
	const scanIndex = filtered.findIndex((item) => item.href === primaryHref);
	const sorted =
		scanIndex >= 0 && filtered.length >= 3
			? [
					...filtered.filter((_, i) => i !== scanIndex).slice(0, 2),
					filtered[scanIndex],
					...filtered.filter((_, i) => i !== scanIndex).slice(2),
				]
			: filtered;
	return sorted.map((item) => ({
		...item,
		primary: item.href === primaryHref,
	}));
}

export function BottomNav() {
	const pathname = usePathname();
	const { user } = useAuth();
	const { data: practitioners } = usePractitioners();
	const currentPractitioner = user ? practitioners?.find((p) => p.user_id === user.user_id) : undefined;
	const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";
	const items = getBottomNavItems(user?.role as AppRole | undefined, !!isSpecialist);

	return (
		<nav className='fixed inset-x-0 bottom-0 z-30 border-t border-primary-700 bg-primary-700 pb-[env(safe-area-inset-bottom)] md:hidden'>
			<div className='flex h-14 items-center justify-around'>
				{items.map((item) => {
					const active =
						pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

					if (item.primary) {
						return (
							<Link
								key={item.href}
								href={item.href}
								className='flex -mt-10 flex-col items-center justify-center gap-0.5 rounded-full bg-primary-700 px-4 py-2.5 text-white shadow-xl shadow-black/30 min-h-[2.75rem] ring-2 ring-white/30'
							>
								<item.icon className='h-5 w-5' />
								<span className='text-[10px] font-medium'>{item.label}</span>
							</Link>
						);
					}

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors",
								active ? "text-white" : "text-primary-100",
							)}
						>
							<item.icon className='h-5 w-5' />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
