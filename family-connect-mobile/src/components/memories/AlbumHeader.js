import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

function AlbumHeaderComponent({ album, onEdit, onShare, canManage }) {
  const { t } = useI18n();
  const { colors, layout } = useTheme();

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 24 * layout.fontScale }}>{album?.title}</Text>
      {album?.description ? (
        <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale, marginTop: 8, lineHeight: 22 }}>{album.description}</Text>
      ) : null}
      <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 8 }}>
        {t('memories.memoryCountWithSharing', { count: album?.mediaCount ?? 0, sharing: album?.isShared ? t('memories.sharedWithFamily') : t('events.familyOnly') })}
      </Text>
      {canManage ? (
        <View style={styles.actions}>
          <Button title={t('common.edit')} variant="secondary" onPress={onEdit} style={{ flex: 1 }} />
          <Button title={t('memories.share')} variant="secondary" onPress={onShare} style={{ flex: 1 }} />
        </View>
      ) : null}
    </View>
  );
}

export const AlbumHeader = memo(AlbumHeaderComponent);

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
