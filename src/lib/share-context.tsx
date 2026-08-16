import { createContext, useContext } from "react";
import type { DashInsights } from "./dashboard-types";
import type { GroupAction } from "./group-plan-store";

// Optional read-only layer for shared reports. When present, dashboards render
// exactly the same UI but disable every mutation (no editing, no new
// assessments, no AI regeneration) and route member navigation through the
// shared link instead of the local store.

export interface ShareContextValue {
  readOnly: boolean;
  /** Encoded token of the current shared report, used to build member links. */
  token: string;
  /** Group plan actions carried inside the shared link (read-only). */
  planActions: GroupAction[];
  /** AI insights per member carried inside the shared link. */
  insightsByMember: Record<string, DashInsights>;
}

const ShareContext = createContext<ShareContextValue | null>(null);

export const ShareProvider = ShareContext.Provider;

export function useShare(): ShareContextValue | null {
  return useContext(ShareContext);
}
