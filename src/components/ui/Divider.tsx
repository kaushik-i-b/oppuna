import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export function Divider(): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm }}
    />
  );
}
