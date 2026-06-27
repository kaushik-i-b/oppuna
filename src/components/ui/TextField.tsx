import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';

interface Props extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  multiline?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  helperText,
  multiline,
  containerStyle,
  ...inputProps
}: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={[{ gap: theme.spacing.xs }, containerStyle]}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textFaint}
        multiline={multiline}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            color: theme.colors.text,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            minHeight: multiline ? 120 : 48,
            textAlignVertical: multiline ? 'top' : 'center',
            fontSize: theme.fontSize.md,
          },
        ]}
        {...inputProps}
      />
      {helperText ? (
        <Text variant="caption" color="textFaint">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1 },
});
