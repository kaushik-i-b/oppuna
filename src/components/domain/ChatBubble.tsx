import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';
import { formatTime } from '@/utils/date';
import type { ChatMessage } from '@/types';

interface Props {
  message: ChatMessage;
}

export function ChatBubble({ message }: Props): React.ReactElement {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isUser ? 'flex-end' : 'flex-start', marginVertical: theme.spacing.xs },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.colors.primary : theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: isUser ? 0 : 1,
            borderRadius: theme.radius.lg,
            borderBottomRightRadius: isUser ? 4 : theme.radius.lg,
            borderBottomLeftRadius: isUser ? theme.radius.lg : 4,
            padding: theme.spacing.md,
          },
        ]}
      >
        <Text
          variant="body"
          style={{ color: isUser ? theme.colors.onPrimary : theme.colors.text }}
        >
          {message.content}
        </Text>
        <Text
          variant="label"
          style={{
            color: isUser ? theme.colors.onPrimary : theme.colors.textFaint,
            opacity: 0.7,
            marginTop: 4,
            textAlign: 'right',
          }}
        >
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  bubble: { maxWidth: '82%' },
});
