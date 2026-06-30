import "./index.css";
import { Composition } from "remotion";
import {
  BlankVerticalReel,
  blankVerticalReelDefaultProps,
} from "./BlankVerticalReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BlankVerticalReel"
        component={BlankVerticalReel}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={blankVerticalReelDefaultProps}
      />
    </>
  );
};
