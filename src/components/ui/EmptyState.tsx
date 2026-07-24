import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, LivingLeaf, type OppunaIconName } from '@/ui';

interface Props {
  /** Optional functional icon instead of the default Living Leaf. */
  icon?: OppunaIconName;
  /** Legacy content emoji override (e.g. mood-specific empty states). */
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: Props): React.ReactElement {
  const theme = useTheme();

  const leading = emoji ? (
    <Text variant="display" center>
      {emoji}
    </Text>
  ) : icon ? (
    <Icon name={icon} size={48} color={theme.colors.textFaint} />
  ) : (
    <LivingLeaf size={56} variant="idle" />
  );

  return (
    <View style={[styles.container, { padding: theme.spacing.xl, gap: theme.spacing.sm }]}>
      {leading}
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
