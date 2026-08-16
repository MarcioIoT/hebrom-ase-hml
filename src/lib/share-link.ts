import LZString from "lz-string";
import type { Assessment } from "./ase-types";
import type { DashInsights } from "./dashboard-types";
import type { GroupAction } from "./group-plan-store";

// ---------------------------------------------------------------------------
// Read-only share links. The entire report is encoded (compressed) into the
// URL itself, so a supervisor can open it WITHOUT logging in and WITHOUT any
// backend — the payload travels in the link. Reuses the existing Matrix
// assessment as the single source of truth; individual dashboards are derived
// from it exactly like in the normal (editable) view.
// ---------------------------------------------------------------------------

export interface SharePayload {
  v: 1;
  a: Assessment;
  /** Group development plan actions, so the supervisor sees the same list. */
  plan?: GroupAction[];
  /** AI insights already generated per member (keyed by memberId). */
  insights?: Record<string, DashInsights>;
}

export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeSharePayload(token: string): SharePayload | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(token);
    if (!json) return null;
    const parsed = JSON.parse(json) as SharePayload;
    if (!parsed || !parsed.a || !Array.isArray(parsed.a.members)) return null;
    return parsed;
  } catch {
    return null;
  }
}
