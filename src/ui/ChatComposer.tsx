import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';

import { Icon } from '@/ui/Icon';
import { PressableScale } from '@/ui/PressableScale';
import { useTheme } from '@/theme/ThemeProvider';
import { useHaptics } from '@/hooks/useHaptics';

const MIN_HEIGHT = 44;
const MAX_HEIGHT = 120;

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  placeholder?: string;
  sending?: boolean;
  editable?: boolean;
}

/**
 * Integrated chat composer — rounded surface with circular send.
 * Grows to MAX_HEIGHT then scrolls internally.
 */
export function ChatComposer({
  value,
  onChangeText,
  onSend,
  onCancel,
  placeholder = 'Message Oppuna…',
  sending = false,
  editable = true,
}: Props): React.ReactElement {
  const theme = useTheme();
  const haptics = useHaptics();
  const [height, setHeight] = useState(MIN_HEIGHT);
  const canSend = value.trim().length > 0 && !sending;

  const onContentSizeChange = (
    e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ): void => {
    const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, e.nativeEvent.contentSize.height + 16));
    setHeight(next);
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
          paddingLeft: theme.spacing.lg,
          paddingRight: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          ...theme.shadow,
          shadowOpacity: theme.mode === 'dark' ? 0.25 : 0.08,
          elevation: 2,
        },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textFaint}
        multiline
        editable={editable && !sending}
        onContentSizeChange={onContentSizeChange}
        style={{
          flex: 1,
          maxHeight: MAX_HEIGHT,
          minHeight: MIN_HEIGHT - 16,
          height,
          color: theme.colors.textPrimary,
          fontSize: theme.fontSize.md,
          lineHeight: theme.fontSize.md * 1.4,
          paddingTop: 10,
          paddingBottom: 10,
          textAlignVertical: 'top',
        }}
        accessibilityLabel={placeholder}
      />
      <PressableScale
        onPress={() => {
          if (sending) {
            onCancel?.();
            return;
          }
          if (!canSend) return;
          void haptics.selection();
          onSend();
        }}
        disabled={!sending && !canSend}
        scaleTo={0.92}
        accessibilityRole="button"
        accessibilityLabel={sending ? 'Cancel' : 'Send message'}
        style={[
          styles.send,
          {
            backgroundColor: sending
              ? theme.colors.danger
              : canSend
                ? theme.colors.primary
                : theme.colors.surfacePressed,
          },
        ]}
      >
        <Icon
          name={sending ? 'close' : 'send'}
          size={18}
          color={
            sending
              ? theme.colors.onDanger
              : canSend
                ? theme.colors.onPrimary
                : theme.colors.textFaint
          }
        />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
