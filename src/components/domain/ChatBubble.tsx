import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/ui/Typography';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { enter } from '@/ui/motion';
import type { ChatMessage } from '@/types';

interface Props {
  message: ChatMessage;
  /** Hide timestamp for denser modern chat feel */
  showTime?: boolean;
}

export function ChatBubble({ message, showTime = false }: Props): React.ReactElement {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const isUser = message.role === 'user';
  const empty = !message.content;

  return (
    <Animated.View
      entering={reduceMotion ? undefined : enter.soft()}
      style={[
        styles.row,
        { justifyContent: isUser ? 'flex-end' : 'flex-start', marginVertical: 6 },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser
              ? theme.colors.chatUserBubble
              : theme.colors.chatAssistantBubble,
            borderColor: theme.colors.border,
            borderWidth: isUser ? 0 : StyleSheet.hairlineWidth,
            borderRadius: theme.radius.lg,
            borderBottomRightRadius: isUser ? 6 : theme.radius.lg,
            borderBottomLeftRadius: isUser ? theme.radius.lg : 6,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md,
            maxWidth: '84%',
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel={
          empty
            ? 'Oppuna is thinking'
            : `${isUser ? 'You' : 'Oppuna'}: ${message.content}`
        }
      >
        {empty ? (
          <Text variant="body" color="textMuted">
            …
          </Text>
        ) : (
          <Text
            variant="body"
            style={{
              color: isUser ? theme.colors.textPrimary : theme.colors.textPrimary,
              lineHeight: theme.fontSize.md * 1.45,
            }}
          >
            {message.content}
          </Text>
        )}
        {showTime ? (
          <Text
            variant="label"
            color="textFaint"
            style={{ marginTop: 4, textAlign: 'right' }}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  bubble: {},
});
