// Guarded service-worker registration.
//
// The service worker must NEVER register in dev, inside the Lovable preview
// iframe, or on Lovable preview hosts — a stale SW there serves deleted chunks
// and white-screens the editor. It registers only on the real published origin
// in a production build. `?sw=off` force-unregisters as a kill switch.

const SW_URL = "/sw.js";

function isRestrictedHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--"))
    return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com"))
    return true;
  if (
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com")
  )
    return true;
  if (hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev"))
    return true;
  return false;
}

function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

async function unregisterAppServiceWorkers(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => (r.active ?? r.installing ?? r.waiting)?.scriptURL.endsWith(SW_URL))
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const swOff = new URL(window.location.href).searchParams.get("sw") === "off";
  const restricted =
    !import.meta.env.PROD ||
    inIframe() ||
    swOff ||
    isRestrictedHost(window.location.hostname);

  if (restricted) {
    void unregisterAppServiceWorkers();
    return;
  }

  const register = () => {
    navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
      /* registration failures must never break the app */
    });
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
