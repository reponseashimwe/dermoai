import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
	className?: string;
	size?: "sm" | "md" | "lg";
	iconOnly?: boolean;
}

const sizeMap = {
	sm: "text-lg",
	md: "text-xl",
	lg: "text-2xl",
};

const iconSizeMap = {
	sm: { class: "h-12 w-12", width: 28, height: 28 },
	md: { class: "h-16 w-16", width: 32, height: 32 },
	lg: { class: "h-20 w-20", width: 36, height: 36 },
};

export function Logo({ className, size = "md", iconOnly = false }: LogoProps) {
	return (
		<Link
			href='/'
			className={cn("flex items-center gap-2", className)}
		>
			<span
				className={cn("inline-flex shrink-0 rounded-md overflow-hidden", iconSizeMap[size].class)}
				aria-hidden
			>
				<img
					src='/logo.svg'
					alt=''
					width={iconSizeMap[size].width}
					height={iconSizeMap[size].height}
					className='h-full w-full object-contain'
				/>
			</span>
			{!iconOnly && (
				<span className={cn("font-bold tracking-tight text-slate-900", sizeMap[size])}>
					Dermo<span className='text-primary-500'>AI</span>
				</span>
			)}
		</Link>
	);
}
