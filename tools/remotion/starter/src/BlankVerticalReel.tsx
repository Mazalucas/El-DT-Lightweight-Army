import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT } from "./theme";

export type BlankVerticalReelProps = {
  title: string;
  subtitle: string;
};

export const blankVerticalReelDefaultProps: BlankVerticalReelProps = {
  title: "Your title",
  subtitle: "Your subtitle",
};

export const BlankVerticalReel: React.FC<BlankVerticalReelProps> = ({
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 20], [24, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.background} 0%, ${COLORS.surface} 100%)`,
        fontFamily: FONT,
        color: COLORS.text,
        justifyContent: "center",
        alignItems: "center",
        padding: 64,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 36,
            color: COLORS.muted,
            marginTop: 24,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
