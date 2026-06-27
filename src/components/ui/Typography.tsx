import React from 'react';
import { Text as RNText, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { ColorScheme } from '@/theme/colors';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label';

interface Props extends TextProps {
  variant?: TextVariant;
  color?: keyof ColorScheme;
  center?: boolean;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function Text({
  variant = 'body',
  color,
  center,
  style,
  children,
  ...rest
}: Props): React.ReactElement {
  const theme = useTheme();

  const variantStyle: Record<TextVariant, TextStyle> = {
    display: { fontSize: theme.fontSize.xxxl, fontWeight: '800', lineHeight: theme.fontSize.xxxl * 1.2 },
    title: { fontSize: theme.fontSize.xxl, fontWeight: '700', lineHeight: theme.fontSize.xxl * 1.25 },
    heading: { fontSize: theme.fontSize.xl, fontWeight: '700', lineHeight: theme.fontSize.xl * 1.3 },
    subtitle: { fontSize: theme.fontSize.lg, fontWeight: '600', lineHeight: theme.fontSize.lg * 1.35 },
    body: { fontSize: theme.fontSize.md, fontWeight: '400', lineHeight: theme.fontSize.md * 1.5 },
    bodyStrong: { fontSize: theme.fontSize.md, fontWeight: '600', lineHeight: theme.fontSize.md * 1.5 },
    caption: { fontSize: theme.fontSize.sm, fontWeight: '400', lineHeight: theme.fontSize.sm * 1.4 },
    label: { fontSize: theme.fontSize.xs, fontWeight: '600', lineHeight: theme.fontSize.xs * 1.4 },
  };

  const resolvedColor =
    color != null
      ? theme.colors[color]
      : variant === 'caption' || variant === 'label'
        ? theme.colors.textMuted
        : theme.colors.text;

  return (
    <RNText
      style={[variantStyle[variant], { color: resolvedColor }, center && { textAlign: 'center' }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
