"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { usePractitioners } from "@/hooks/use-practitioners";
import { useAlertCount } from "@/hooks/use-alert-count";
import { NAV_ITEMS, ADMIN_NAV_ITEMS, getVisibleNavItems, getVisibleAdminItems, type AppRole } from "@/config/roles";
import type { User } from "@/types/api";

export function Sidebar({ user }: { user: User | null }) {
	const pathname = usePathname();
	const { data: practitioners } = usePractitioners();
	const alertCount = useAlertCount();
	const currentPractitioner = practitioners?.find((p) => p.user_id === user?.user_id);
	const isSpecialist = currentPractitioner?.practitioner_type === "SPECIALIST";

	const visibleNav = getVisibleNavItems(user?.role as AppRole | undefined, !!isSpecialist);
	const visibleAdmin = getVisibleAdminItems(user?.role as AppRole | undefined);

	return (
		<aside className='fixed left-0 top-0 z-30 hidden h-screen w-[100px] flex-col border-r border-primary-700 bg-primary-700 md:flex'>
			{/* Prominent logo at top */}
			<div className='flex shrink-0 flex-col items-center gap-2 border-b border-primary-500 px-3 py-4'>
				<Logo
					size='sm'
					iconOnly
				/>
			</div>

			<nav className='flex flex-1 flex-col items-center gap-0.5 overflow-y-auto px-2 py-5'>
				{visibleNav.map((item) => {
					const active =
						pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"group relative flex w-full flex-col items-center gap-2 rounded-xl px-2 py-4 text-xs font-medium transition-colors",
								active
									? "bg-primary-600 text-white"
									: "text-primary-100 hover:bg-primary-600/70 hover:text-white",
							)}
						>
							<span className='relative inline-flex'>
								<item.icon className={cn("h-7 w-7", active ? "text-white" : "text-primary-100")} />
								{item.href === "/notifications" && alertCount > 0 && (
									<span className='absolute -right-1.5 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white'>
										{alertCount > 99 ? "99+" : alertCount}
									</span>
								)}
							</span>
							<span className='leading-tight'>{item.label}</span>
						</Link>
					);
				})}

				{visibleAdmin.length > 0 && (
					<>
						<div className='my-3 h-px w-10 bg-slate-200' />
						{visibleAdmin.map((item) => {
							const active = pathname === item.href || pathname.startsWith(item.href + "/");
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"group flex w-full flex-col items-center gap-2 rounded-xl px-2 py-4 text-xs font-medium transition-colors",
										active
											? "bg-primary-600 text-white"
											: "text-primary-100 hover:bg-primary-600/70 hover:text-white",
									)}
								>
									<item.icon className={cn("h-7 w-7", active ? "text-white" : "text-primary-100")} />
									<span className='leading-tight'>{item.label}</span>
								</Link>
							);
						})}
					</>
				)}
			</nav>

			{/* Primary action — reference: prominent button at bottom */}
			<div className='flex shrink-0 items-center justify-center border-t border-primary-500 px-3 py-5'>
				<Link
					href='/scan-history'
					className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm transition-colors hover:bg-primary-400'
					title='New scan'
				>
					<ScanLine className='h-6 w-6' />
				</Link>
			</div>
		</aside>
	);
}
