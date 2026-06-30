import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  CLAY_PALETTE,
  ClayCharacterProps,
  ClayVariant,
} from "./clay-theme";

const ClayMaterial: React.FC<{ color: string }> = ({ color }) => (
  <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
);

const Arm: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}> = ({ position, rotation, color }) => (
  <mesh position={position} rotation={rotation}>
    <capsuleGeometry args={[0.12, 0.5, 8, 16]} />
    <ClayMaterial color={color} />
  </mesh>
);

const getArmRotation = (variant: ClayVariant, frame: number): number => {
  if (variant === "wave") {
    return Math.sin(frame / 8) * 0.6 - 0.4;
  }
  if (variant === "point") {
    return -1.2;
  }
  return Math.sin(frame / 20) * 0.05;
};

export const ClayCharacter: React.FC<ClayCharacterProps> = ({
  variant = "idle",
  scale = 1,
  shirtColor = CLAY_PALETTE.shirt,
  accentColor = CLAY_PALETTE.accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const bob = Math.sin(frame / 15) * 0.05;
  const armRot = getArmRotation(variant, frame);

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 45, position: [0, 1.2, 4.5] }}
      style={{ backgroundColor: "transparent" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <group scale={scale} position={[0, bob, 0]}>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.45, 32, 32]} />
          <ClayMaterial color={CLAY_PALETTE.skin} />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <capsuleGeometry args={[0.35, 0.7, 8, 16]} />
          <ClayMaterial color={shirtColor} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <capsuleGeometry args={[0.28, 0.35, 8, 16]} />
          <ClayMaterial color={CLAY_PALETTE.pants} />
        </mesh>
        <Arm
          position={[-0.55, 0.95, 0]}
          rotation={[0, 0, 0.3]}
          color={CLAY_PALETTE.skin}
        />
        <Arm
          position={[0.55, 0.95, 0]}
          rotation={[0, 0, armRot]}
          color={CLAY_PALETTE.skin}
        />
        <mesh position={[0, 1.62, 0.38]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <ClayMaterial color={accentColor} />
        </mesh>
      </group>
    </ThreeCanvas>
  );
};
