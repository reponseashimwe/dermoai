"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, ScanLine, Bell, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

/** 5 items for all users: 2 left, Scans (primary) in middle, 2 right */
const items = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/consultations", label: "Consults", icon: ClipboardList },
	{ href: "/scan-history", label: "Scans", icon: ScanLine, primary: true },
	{ href: "/review-queue", label: "Review", icon: CheckSquare },
	{ href: "/notifications", label: "Alerts", icon: Bell },
];

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className='fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden'>
			<div className='flex h-14 items-center justify-around'>
				{items.map((item) => {
					const active =
						pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

					if (item.primary) {
						return (
							<Link
								key={item.href}
								href={item.href}
								className='flex -mt-10 flex-col items-center justify-center gap-0.5 rounded-full bg-primary-500 px-4 py-2.5 text-white shadow-lg min-h-[2.75rem]'
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
								active ? "text-primary-500" : "text-slate-400",
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
