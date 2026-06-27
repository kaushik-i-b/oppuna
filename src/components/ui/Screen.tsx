import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Header } from '@/components/ui/Header';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  keyboardAvoiding?: boolean;
  edges?: Edge[];
  title?: string;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  keyboardAvoiding = false,
  edges = ['top', 'bottom'],
  title,
  onBack,
  headerRight,
  contentStyle,
}: Props): React.ReactElement {
  const theme = useTheme();

  const padding = padded ? { padding: theme.spacing.lg } : undefined;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={edges}>
      <StatusBar
        barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {title != null ? <Header title={title} onBack={onBack} right={headerRight} /> : null}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
