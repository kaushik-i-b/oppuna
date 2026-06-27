import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  title: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, action }: Props): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
      }}
    >
      <Text variant="label" color="textFaint" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
        {title}
      </Text>
      {action}
    </View>
  );
}
