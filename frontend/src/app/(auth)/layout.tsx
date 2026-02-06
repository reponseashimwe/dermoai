import { Logo } from "@/components/layout/logo";
import { Shield, Stethoscope, Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* ── Mobile: full-screen white, native feel ── */}
      <div className="flex min-h-screen flex-col bg-white md:hidden">
        <div className="px-6 pt-12 pb-4">
          <Logo size="md" />
        </div>
        <div className="flex-1 px-6 pt-8 pb-10">{children}</div>
      </div>

      {/* ── md+: centered card with split layout ── */}
      <div className="hidden min-h-screen items-center justify-center bg-slate-100 p-6 md:flex">
        <div className="flex w-full max-w-[960px] overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Left — Form */}
          <div className="flex w-[55%] flex-col px-12 py-12 lg:px-16">
            <Logo size="sm" />
            <div className="mt-10 flex-1">{children}</div>
          </div>

          {/* Right — Brand panel */}
          <div className="flex w-[45%] flex-col justify-between rounded-l-3xl bg-primary-500 p-10 lg:p-12">
            <div />
            <div>
              <h2 className="text-3xl font-bold leading-tight text-white">
                AI-Powered Skin
                <br />
                Triage for Africa
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                Instant dermatological analysis optimized for darker skin tones,
                designed for resource-limited settings.
              </p>
            </div>
            <div className="flex gap-6 text-white/70">
              <div className="flex items-center gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5" />
                <span>Instant</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>Private</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Clinical</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
