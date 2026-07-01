import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  /** Rendered width and height in pixels. */
  size?: number;
  /** Main leaf color. Defaults to the theme primary brand color. */
  color?: string;
  /** Secondary color used for the midrib, veins, and the champaca bud. */
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Oppuna brand mark: a stylised leaf of the Magnolia champaca (champak)
 * with a small emerging flower bud, drawn as a resolution-independent
 * vector so it stays crisp at every size and adapts to the active theme.
 */
export function Logo({ size = 96, color, accentColor, style }: Props): React.ReactElement {
  const theme = useTheme();
  const leaf = color ?? theme.colors.primary;
  const accent = accentColor ?? theme.colors.onPrimary;

  return (
    <View
      style={style}
      accessibilityRole="image"
      accessibilityLabel="Oppuna, a Magnolia champaca leaf"
    >
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Defs>
          <LinearGradient id="oppunaLeaf" x1="30" y1="6" x2="70" y2="94" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={leaf} stopOpacity={1} />
            <Stop offset="1" stopColor={leaf} stopOpacity={0.82} />
          </LinearGradient>
        </Defs>

        {/* Lanceolate Magnolia champaca leaf */}
        <Path
          d="M50 5
             C 30 26, 20 52, 27 78
             C 31 90, 42 95, 50 95
             C 58 95, 69 90, 73 78
             C 80 52, 70 26, 50 5 Z"
          fill="url(#oppunaLeaf)"
        />

        {/* Midrib and lateral veins */}
        <G stroke={accent} strokeWidth={2.4} strokeLinecap="round" opacity={0.9}>
          <Path d="M50 16 L50 88" />
          <Path d="M50 34 C 42 36, 37 40, 34 47" />
          <Path d="M50 34 C 58 36, 63 40, 66 47" />
          <Path d="M50 50 C 43 52, 38 56, 36 63" />
          <Path d="M50 50 C 57 52, 62 56, 64 63" />
          <Path d="M50 66 C 45 68, 42 71, 41 76" />
          <Path d="M50 66 C 55 68, 58 71, 59 76" />
        </G>

        {/* Emerging champaca flower bud at the leaf tip */}
        <G fill={accent}>
          <Path d="M50 4 C 46 9, 46 14, 50 18 C 54 14, 54 9, 50 4 Z" />
          <Path d="M44 8 C 43 13, 45 17, 49 19 C 48 14, 47 10, 44 8 Z" opacity={0.75} />
          <Path d="M56 8 C 57 13, 55 17, 51 19 C 52 14, 53 10, 56 8 Z" opacity={0.75} />
        </G>
      </Svg>
    </View>
  );
}
