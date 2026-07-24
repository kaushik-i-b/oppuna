import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';
import { LivingLeaf, type LivingLeafVariant } from '@/ui/LivingLeaf';

interface Props {
  title: string;
  body?: string;
  leafVariant?: LivingLeafVariant;
  leafSize?: number;
  style?: StyleProp<ViewStyle>;
}

/** Soft centered hero used across care screens (mood, sleep, breathe, etc.). */
export function CareHero({
  title,
  body,
  leafVariant = 'idle',
  leafSize = 64,
  style,
}: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, { marginBottom: theme.spacing.xl }, style]}>
      <View
        style={[
          styles.orb,
          {
            backgroundColor: theme.colors.primaryMuted,
            width: leafSize * 1.55,
            height: leafSize * 1.55,
            borderRadius: leafSize * 0.775,
          },
        ]}
      >
        <LivingLeaf size={leafSize} variant={leafVariant} showAura={false} />
      </View>
      <Text variant="title" center style={{ marginTop: theme.spacing.lg }}>
        {title}
      </Text>
      {body ? (
        <Text
          variant="body"
          color="textSecondary"
          center
          style={{ marginTop: theme.spacing.sm, maxWidth: 300 }}
        >
          {body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  orb: { alignItems: 'center', justifyContent: 'center' },
});
