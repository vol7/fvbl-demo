import { createContext, useContext } from "react";

/**
 * Which version of the cut: Canada-first or US-first. The picture and the
 * marks are shared; the hero figure, the agency names in the voice, the takes
 * and the final mix are per version (lines.ts, Demo.tsx `HEROES`).
 */
export type Audience = "ca" | "us";

export const AudienceContext = createContext<Audience>("ca");

export const useAudience = () => useContext(AudienceContext);
