import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card, Loading, Screen, Text } from '@/components';
import { LICENSE_ASSETS, loadLicenseText } from '@/constants/licenses';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ThirdPartyLicenses'>;

export function ThirdPartyLicensesScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<{ title: string; body: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await Promise.all(
          LICENSE_ASSETS.map(async (asset) => ({
            title: asset.title,
            body: await loadLicenseText(asset),
          })),
        );
        if (!cancelled) setSections(loaded);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Screen title={t('settings.thirdPartyLicenses')} onBack={() => navigation.goBack()} scroll>
      <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.md }}>
        {t('settings.thirdPartyLicensesSubtitle')}
      </Text>

      {loading ? <Loading label={t('common.loading')} /> : null}

      {sections.map((section) => (
        <Card key={section.title} style={{ marginBottom: theme.spacing.md }}>
          <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
            {section.title}
          </Text>
          <Text variant="caption" color="textMuted" style={{ fontFamily: 'monospace' }}>
            {section.body}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
