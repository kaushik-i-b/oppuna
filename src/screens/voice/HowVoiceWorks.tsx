import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

const STEPS = ['Voice', 'AssemblyAI', 'Realtime conversation', 'Oppuna tools', 'Reflection memory'] as const;

/** Quiet explainer for a hackathon judge. It does not sit in the conversation path. */
export function HowVoiceWorks(): React.ReactElement {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginTop: theme.spacing.lg }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
      >
        <Text variant="caption" color="textFaint" center>
          {open ? 'Hide how Oppuna Voice works' : 'How Oppuna Voice works'}
        </Text>
      </Pressable>
      {open ? (
        <View style={{ marginTop: theme.spacing.md, alignItems: 'center', gap: 4 }}>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <Text variant="caption" color="textMuted">
                {step}
              </Text>
              {index < STEPS.length - 1 ? (
                <Text variant="caption" color="textFaint">
                  ↓
                </Text>
              ) : null}
            </View>
          ))}
          <Text variant="caption" color="textFaint" center style={{ marginTop: theme.spacing.sm }}>
            AssemblyAI hears the conversation, takes turns, and speaks. Oppuna keeps only the memories you approve.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  step: { alignItems: 'center' },
});
