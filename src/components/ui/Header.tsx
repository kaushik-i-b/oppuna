import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function Header({ title, onBack, right }: Props): React.ReactElement {
  const theme = useTheme();
  const { selection } = useHaptics();

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
      ]}
    >
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            onPress={() => {
              selection();
              onBack();
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text variant="subtitle" color="primary">
              ‹ Back
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Text variant="subtitle" numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  side: { minWidth: 64, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
});
