import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Already running as an installed app? Don't show anything.
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    if (isIOS) {
      setShowIOSHint((prev) => !prev);
      return;
    }
  }

  // Nothing to offer: not iOS, and browser hasn't fired beforeinstallprompt yet.
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors"
      >
        <Download className="w-4 h-4" />
        Pakua App
      </button>

      {showIOSHint && (
        <p className="text-xs text-white/60 flex items-center gap-1 max-w-xs text-center">
          <Share className="w-3.5 h-3.5 shrink-0" />
          Bonyeza "Share" kisha "Add to Home Screen" kwenye Safari.
        </p>
      )}
    </div>
  );
}