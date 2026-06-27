import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  emoji = '🌱',
  title,
  description,
  actionLabel,
  onAction,
}: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={[styles.container, { padding: theme.spacing.xl, gap: theme.spacing.sm }]}>
      <Text variant="display" center>
        {emoji}
      </Text>
      <Text variant="subtitle" center>
        {title}
      </Text>
      {description ? (
        <Text variant="body" color="textMuted" center>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.md, alignSelf: 'stretch' }}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
