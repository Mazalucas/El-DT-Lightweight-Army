export const CLAY_PALETTE = {
  skin: "#f4c4a0",
  shirt: "#5b8def",
  pants: "#334155",
  accent: "#fbbf24",
  shadow: "#1e293b",
} as const;

export type ClayVariant = "idle" | "wave" | "point";

export type ClayCharacterProps = {
  variant?: ClayVariant;
  scale?: number;
  shirtColor?: string;
  accentColor?: string;
};
