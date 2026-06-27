import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';

import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';
import { weekdayShort } from '@/utils/date';

interface Props {
  data: { day: number; score: number | null }[];
  maxScore?: number;
}

const HEIGHT = 140;
const BAR_GAP = 10;

export function MoodBarChart({ data, maxScore = 5 }: Props): React.ReactElement {
  const theme = useTheme();
  const width = 300;
  const barWidth = (width - BAR_GAP * (data.length - 1)) / Math.max(1, data.length);

  return (
    <View accessibilityLabel="Weekly mood chart">
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`}>
        <Line x1={0} y1={HEIGHT - 1} x2={width} y2={HEIGHT - 1} stroke={theme.colors.border} strokeWidth={1} />
        {data.map((point, index) => {
          const x = index * (barWidth + BAR_GAP);
          const ratio = point.score == null ? 0 : point.score / maxScore;
          const barHeight = Math.max(point.score == null ? 0 : 6, ratio * (HEIGHT - 16));
          const y = HEIGHT - barHeight - 1;
          return (
            <Rect
              key={point.day}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={6}
              fill={point.score == null ? theme.colors.border : theme.colors.primary}
            />
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {data.map((point) => (
          <View key={`label-${point.day}`} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="label" color="textFaint">
              {weekdayShort(point.day)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
