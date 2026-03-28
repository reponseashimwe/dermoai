import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <Logo size="sm" />
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
          <Link
            href="/legal"
            className="text-sm text-slate-500 hover:text-primary-600 transition-colors"
          >
            Legal &amp; Privacy
          </Link>
          <span className="hidden text-slate-300 sm:inline">·</span>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} DermoAI. AI-assisted dermatological triage for Rwanda.
          </p>
        </div>
      </div>
    </footer>
  );
}
