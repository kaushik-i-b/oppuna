import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';
import { PRESS_SCALE_SOFT, PressableScale } from '@/ui';

interface Props {
  title: string;
  subtitle?: string;
  leadingEmoji?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  accessibilityHint?: string;
}

export function ListItem({
  title,
  subtitle,
  leadingEmoji,
  trailing,
  onPress,
  danger = false,
  accessibilityHint,
}: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();

  const content = (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
      ]}
    >
      {leadingEmoji ? <Text variant="subtitle">{leadingEmoji}</Text> : null}
      <View style={styles.text}>
        <Text variant="bodyStrong" color={danger ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Text variant="subtitle" color="textFaint">›</Text> : null)}
    </View>
  );

  if (!onPress) return content;

  return (
    <PressableScale
      onPress={() => {
        selection();
        onPress();
      }}
      scaleTo={PRESS_SCALE_SOFT}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1, gap: 2 },
});
