import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n';
import { getMyConsent } from '../../services/consentService';

/**
 * Explains to a minor why family content is unavailable.
 *
 * The consent gate returns 403 for every family endpoint until a guardian
 * approves the account, which on its own reads as a broken app. This turns
 * that into a plain statement of what is happening and what has to happen
 * next. It renders nothing for adults and elders, and nothing once approved.
 */
export function ConsentBanner() {
  const { colors, layout, radii } = useTheme();
  const { user } = useAuth();
  const { t } = useI18n();
  const [status, setStatus] = useState(null);

  const load = useCallback(async () => {
    if (user?.memberType !== 'child') {
      setStatus(null);
      return;
    }
    try {
      const data = await getMyConsent();
      setStatus(data?.required ? data.status : null);
    } catch {
      // Never block the screen on this: if the status cannot be read, stay silent.
      setStatus(null);
    }
  }, [user?.memberType]);

  useEffect(() => {
    load();
  }, [load]);

  if (!status || status === 'approved' || status === 'not_applicable') return null;

  const rejected = status === 'rejected';
  const tone = rejected ? colors.error : colors.warning ?? colors.primary;

  return (
    <Card style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftColor: tone }}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: `${tone}22`, borderRadius: radii.full, minWidth: 40, minHeight: 40 },
          ]}
        >
          <Ionicons name={rejected ? 'close-circle-outline' : 'hourglass-outline'} size={20} color={tone} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              color: colors.text,
              fontFamily: 'Inter_600SemiBold',
              fontSize: 15 * layout.fontScale,
            }}
          >
            {rejected ? t('consent.blockedRejectedTitle') : t('consent.blockedPendingTitle')}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13 * layout.fontScale,
              marginTop: 4,
              lineHeight: 20,
            }}
          >
            {rejected ? t('consent.blockedRejectedBody') : t('consent.blockedPendingBody')}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
