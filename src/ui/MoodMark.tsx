import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { MoodKey } from '@/types';

interface Props {
  mood: MoodKey;
  size?: number;
  /** Face / stroke color. */
  color: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Soft, brand-native mood marks — calm SVG faces instead of system emoji.
 * Designed to sit in Soft Sage UI without cartoon bounce.
 */
export function MoodMark({
  mood,
  size = 32,
  color,
  style,
}: Props): React.ReactElement {
  return (
    <View style={style} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Circle cx="24" cy="24" r="21" stroke={color} strokeWidth="2.4" />

        {mood === 'awful' ? (
          <>
            <Path
              d="M15 21 C16.6 18.8, 19.4 18.8, 21 21"
              stroke={color}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <Path
              d="M27 21 C28.6 18.8, 31.4 18.8, 33 21"
              stroke={color}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <Circle cx="18" cy={mood === 'low' ? 21.5 : 20.5} r={mood === 'great' ? 2.4 : 2.1} fill={color} />
            <Circle cx="30" cy={mood === 'low' ? 21.5 : 20.5} r={mood === 'great' ? 2.4 : 2.1} fill={color} />
          </>
        )}

        {mood === 'great' ? (
          <Path
            d="M15 27.5 C18.5 34.2, 29.5 34.2, 33 27.5"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ) : null}
        {mood === 'good' ? (
          <Path
            d="M17 28.5 C20.2 32.6, 27.8 32.6, 31 28.5"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ) : null}
        {mood === 'okay' ? (
          <Path d="M18 30.5 H30" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        ) : null}
        {mood === 'low' ? (
          <Path
            d="M17 32.2 C20.2 28.6, 27.8 28.6, 31 32.2"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ) : null}
        {mood === 'awful' ? (
          <Path
            d="M16 33.8 C20.2 28.2, 27.8 28.2, 32 33.8"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}
