import { useEffect, useState } from "react";
import { X, Download, Share, Plus, Smartphone } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
const APP_ICON = "/icons/icon-192.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ase-install-dismissed";
const DISMISS_DAYS = 14;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac; detect touch Macs too.
  const iPadOS = ua.includes("Macintosh") && "ontouchend" in document;
  return iOSDevice || iPadOS;
}

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    // Never nag inside the Lovable preview iframe.
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS never fires beforeinstallprompt — show manual instructions instead.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS()) {
      iosTimer = setTimeout(() => {
        setShowIOS(true);
        setVisible(true);
      }, 2500);
    }

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferred(null);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border bg-card/95 p-4 shadow-pop backdrop-blur">
            <div className="flex items-start gap-3">
              <img
                src={APP_ICON}
                alt="ASE"
                width={44}
                height={44}
                className="size-11 shrink-0 rounded-xl shadow-soft"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-display text-sm font-bold">
                  <Smartphone className="size-4 text-primary" />
                  Instalar o ASE
                </div>
                {showIOS ? (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Toque em{" "}
                    <Share className="inline size-3.5 -translate-y-0.5 text-primary" />{" "}
                    <span className="font-medium text-foreground">Compartilhar</span> e
                    depois em{" "}
                    <Plus className="inline size-3.5 -translate-y-0.5 text-primary" />{" "}
                    <span className="font-medium text-foreground">
                      Adicionar à Tela de Início
                    </span>
                    .
                  </p>
                ) : (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Use como um aplicativo: abertura em tela cheia, mais rápido e
                    funciona mesmo sem internet.
                  </p>
                )}
              </div>
              <button
                onClick={dismiss}
                aria-label="Fechar"
                className="-mr-1 -mt-1 shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {!showIOS && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" onClick={install}>
                  <Download className="size-4" /> Instalar
                </Button>
                <Button size="sm" variant="ghost" onClick={dismiss}>
                  Agora não
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
