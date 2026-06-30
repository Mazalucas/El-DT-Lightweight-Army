import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT } from "../theme";

export type CaptionPanelProps = {
  lines: [string, string?, string?];
  delay?: number;
};

export const CaptionPanel: React.FC<CaptionPanelProps> = ({
  lines,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const visibleLines = lines.filter(Boolean) as string[];

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 48,
        right: 48,
        opacity,
        background: COLORS.panel,
        borderRadius: 20,
        padding: "20px 28px",
        fontFamily: FONT,
        backdropFilter: "blur(8px)",
      }}
    >
      {visibleLines.map((line, index) => (
        <p
          key={`${index}-${line.slice(0, 12)}`}
          style={{
            margin: index === 0 ? 0 : "8px 0 0",
            fontSize: index === 0 ? 32 : 26,
            fontWeight: index === 0 ? 700 : 500,
            color: index === 0 ? COLORS.text : COLORS.muted,
            lineHeight: 1.3,
          }}
        >
          {line}
        </p>
      ))}
    </div>
  );
};
