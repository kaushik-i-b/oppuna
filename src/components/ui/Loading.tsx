import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  label?: string;
}

export function Loading({ label }: Props): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.container, { gap: theme.spacing.md }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {label ? (
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
