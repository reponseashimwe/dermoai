import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
        <Logo size="sm" />
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} DermoAI. AI-assisted dermatological triage for Rwanda.
        </p>
      </div>
    </footer>
  );
}
