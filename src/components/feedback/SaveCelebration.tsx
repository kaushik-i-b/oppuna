import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Typography';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { LivingLeaf } from '@/ui';

export type SaveCelebrationKind = 'mood' | 'journal' | 'insight';

interface Props {
  visible: boolean;
  kind: SaveCelebrationKind;
  message: string;
  detail?: string;
  /** Auto-dismiss after this many ms. */
  durationMs?: number;
  onDone: () => void;
}

const KIND_LABEL: Record<SaveCelebrationKind, string> = {
  mood: 'Mood saved',
  journal: 'Journal saved',
  insight: 'Insight updated',
};

/**
 * Full-screen care-save celebration — Living Leaf mascot + soft message.
 * Used after mood / journal saves (and insight refresh moments).
 */
export function SaveCelebration({
  visible,
  kind,
  message,
  detail,
  durationMs = 1800,
  onDone,
}: Props): React.ReactElement {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const backdrop = useSharedValue(0);
  const card = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      backdrop.value = 0;
      card.value = 0;
      return;
    }

    if (reduceMotion) {
      backdrop.value = 1;
      card.value = 1;
    } else {
      backdrop.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      card.value = withDelay(
        60,
        withTiming(1, { duration: 320, easing: Easing.out(Easing.back(1.2)) }),
      );
    }

    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onDone, reduceMotion, backdrop, card]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value * 0.55,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [
      { scale: reduceMotion ? 1 : 0.88 + card.value * 0.12 },
      { translateY: reduceMotion ? 0 : (1 - card.value) * 16 },
    ],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDone}
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { backgroundColor: theme.colors.text }, backdropStyle]}
        />
        <Pressable style={styles.touch} onPress={onDone} accessibilityRole="button" accessibilityLabel="Dismiss">
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.xl,
                borderColor: theme.colors.border,
                padding: theme.spacing.xl,
                ...theme.shadow,
              },
              cardStyle,
            ]}
          >
            <LivingLeaf
              size={88}
              variant="celebrate"
              accessibilityLabel={KIND_LABEL[kind]}
            />
            <Text
              variant="subtitle"
              center
              style={{ marginTop: theme.spacing.lg, color: theme.colors.primary }}
            >
              {message}
            </Text>
            {detail ? (
              <Text
                variant="body"
                color="textMuted"
                center
                style={{ marginTop: theme.spacing.sm, maxWidth: 260 }}
              >
                {detail}
              </Text>
            ) : null}
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  touch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 340,
    width: '100%',
  },
});
