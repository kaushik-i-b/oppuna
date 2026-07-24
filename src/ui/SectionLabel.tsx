import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
}

/** Home-style uppercase section label. */
export function SectionLabel({ children, style }: Props): React.ReactElement {
  const theme = useTheme();
  return (
    <Text
      variant="label"
      color="textFaint"
      style={[{ letterSpacing: 1.2, marginBottom: theme.spacing.sm }, style]}
    >
      {children}
    </Text>
  );
}
