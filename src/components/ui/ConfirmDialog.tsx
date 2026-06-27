import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A theme-aware confirmation dialog that works consistently across web and
 * native (unlike Alert.alert, which is unreliable on web).
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]} onPress={onCancel}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.xl,
              gap: theme.spacing.md,
            },
          ]}
          onPress={() => undefined}
        >
          <Text variant="heading">{title}</Text>
          <Text variant="body" color="textMuted">
            {message}
          </Text>
          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
            />
            <Button label={cancelLabel} variant="ghost" onPress={onCancel} haptic={false} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420 },
});
