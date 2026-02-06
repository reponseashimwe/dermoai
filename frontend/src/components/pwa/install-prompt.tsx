"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-lg border border-primary-200 bg-white p-4 shadow-lg">
      <Download className="h-5 w-5 text-primary-600" />
      <div>
        <p className="text-sm font-medium text-slate-900">Install DermoAI</p>
        <p className="text-xs text-slate-500">Get the app for quick access</p>
      </div>
      <Button size="sm" onClick={handleInstall}>
        Install
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="rounded p-1 text-slate-400 hover:bg-slate-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
