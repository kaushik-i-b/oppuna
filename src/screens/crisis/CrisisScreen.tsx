import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Card, Chip, Text } from '@/components';
import {
  CRISIS_CATEGORY_LABEL,
  CRISIS_REGIONS,
  getCrisisRegion,
} from '@/constants/crisis';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Crisis'>;

export function CrisisScreen({ route }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const category = route.params?.category;

  const crisisRegion = useSettingsStore((s) => s.crisisRegion);
  const setCrisisRegion = useSettingsStore((s) => s.setCrisisRegion);
  const region = getCrisisRegion(crisisRegion);

  const openDialer = (phone?: string): void => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch((error) =>
      logger.warn('Could not open dialer', { error: String(error) }),
    );
  };

  const goHome = (): void => {
    navigation.navigate('Main', { screen: 'Home' });
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, flexGrow: 1 }}>
        <View style={{ alignItems: 'center', marginVertical: theme.spacing.lg }}>
          <Text variant="display">🤍</Text>
          <Text variant="title" center style={{ marginTop: theme.spacing.sm }}>
            {t('safety.title')}
          </Text>
          {category ? (
            <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              {CRISIS_CATEGORY_LABEL[category]}
            </Text>
          ) : null}
        </View>

        <Card style={{ backgroundColor: theme.colors.dangerMuted }}>
          <Text variant="body" color="text">
            {t('safety.body')}
          </Text>
          <Text variant="bodyStrong" color="danger" style={{ marginTop: theme.spacing.md }}>
            {t('safety.emergency')}
          </Text>
          {region.emergency ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <Button
                label={`${t('safety.callEmergency')} (${region.emergency})`}
                onPress={() => openDialer(region.emergency)}
              />
            </View>
          ) : null}
        </Card>

        <Text variant="bodyStrong" style={{ marginTop: theme.spacing.lg }}>
          {t('safety.chooseRegion')}
        </Text>
        <View style={styles.regionRow}>
          {CRISIS_REGIONS.map((r) => (
            <Chip
              key={r.code}
              label={r.name}
              selected={r.code === region.code}
              onPress={() => setCrisisRegion(r.code)}
            />
          ))}
        </View>

        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.md }}>
          {t('safety.helplinesFor')} {region.name}
        </Text>
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          {region.helplines.map((resource) => (
            <Card key={resource.label}>
              <Text variant="bodyStrong">{resource.label}</Text>
              {resource.detail ? (
                <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
                  {resource.detail}
                </Text>
              ) : null}
              {resource.text ? (
                <Text variant="bodyStrong" color="primary" style={{ marginTop: theme.spacing.xs }}>
                  {resource.text}
                </Text>
              ) : null}
              {resource.phone ? (
                <View style={{ marginTop: theme.spacing.md }}>
                  <Button
                    label={`Call ${resource.phone}`}
                    onPress={() => openDialer(resource.phone)}
                  />
                </View>
              ) : null}
            </Card>
          ))}
        </View>

        <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.md }}>
          {t('safety.disclaimer')}
        </Text>

        <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.lg }}>
          {t('safety.trusted')}
        </Text>

        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.xl }}>
          <Button
            label={t('safety.breathe')}
            variant="secondary"
            onPress={() => navigation.navigate('Breathing')}
          />
          <Button label={t('safety.backToSafety')} onPress={goHome} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  regionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
});
