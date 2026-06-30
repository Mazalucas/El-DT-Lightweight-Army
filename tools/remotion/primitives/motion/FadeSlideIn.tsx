import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT } from "../theme";

type FadeSlideInProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  style?: React.CSSProperties;
};

export const FadeSlideIn: React.FC<FadeSlideInProps> = ({
  children,
  delay = 0,
  duration = 18,
  y = 36,
  style,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * y}px)`,
        fontFamily: FONT,
        color: COLORS.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
