import * as React from "react";
import Svg, { Path, Circle, SvgProps } from "react-native-svg";

interface Props extends SvgProps {
  size?: number;
  color?: string;
}

const PersonIcon = ({ size = 24, color = "#FFFFFF", ...props }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Circle cx="12" cy="8" r="4" fill={color} />
    <Path
      d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      fill={color}
      opacity={0.85}
    />
  </Svg>
);

export default PersonIcon;

