"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { LogOut } from "lucide-react";
import { Logo } from "./logo";

export function DashboardHeader() {
	const { user, logout } = useAuth();

	return (
		<header className='sticky top-0 z-20 flex min-h-[60px] items-center justify-between border-b border-slate-200 bg-white font-sans px-4 py-3 sm:min-h-[56px] md:px-6'>
			{/* Mobile logo — hidden on desktop where sidebar shows it */}
			<div className='flex min-h-[44px] min-w-[44px] items-center md:hidden'>
				<Logo size='sm' />
			</div>

			{/* Desktop: just a spacer on the left */}
			<div className='hidden md:block' />

			<div className='flex items-center gap-1 sm:gap-2'>
				<div className='flex min-h-[44px] min-w-[44px] items-center justify-center sm:min-h-0 sm:min-w-0'>
					<NotificationBell />
				</div>

				{user && (
					<Link
						href='/profile'
						className='flex min-h-[44px] items-center gap-2 rounded-xl px-2 py-2 active:bg-slate-100 hover:bg-slate-50 sm:py-1.5'
					>
						<Avatar
							name={user.name}
							size='sm'
							className='h-9 w-9 text-xs sm:h-8 sm:w-8'
						/>
						<div className='hidden sm:block'>
							<p className='text-sm font-medium leading-none text-slate-800'>{user.name}</p>
							<p className='text-[11px] text-slate-400 capitalize'>{user.role.toLowerCase()}</p>
						</div>
					</Link>
				)}

				<button
					type='button'
					onClick={logout}
					className='flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-xl text-slate-400 active:bg-slate-100 hover:bg-slate-50 hover:text-slate-600 sm:min-h-0 sm:min-w-0 sm:p-2'
					title='Sign out'
				>
					<LogOut className='h-5 w-5 sm:h-4 sm:w-4' />
				</button>
			</div>
		</header>
	);
}
