import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { LivingLeaf } from '@/ui';
import { lightColors } from '@/theme/colors';
import { logger } from '@/utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Top-level error boundary. It keeps the app from showing a white screen and
 * offers a recovery action. It logs only locally.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error): void {
    logger.error('Unhandled UI error', { message: error.message, stack: error.stack });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <LivingLeaf size={64} variant="outline" reduceMotion />
        <Text style={styles.title}>Something went off-track</Text>
        <Text style={styles.body}>
          Oppuna ran into an unexpected issue, but your data is safe on your device.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={this.handleReset}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: lightColors.background,
  },
  title: { fontSize: 20, fontWeight: '700', color: lightColors.text, marginTop: 16, marginBottom: 8 },
  body: {
    fontSize: 15,
    color: lightColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: lightColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: { color: lightColors.onPrimary, fontWeight: '700', fontSize: 16 },
});
