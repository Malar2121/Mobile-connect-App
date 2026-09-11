import React, { memo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';

function EventGalleryComponent({ memories, eventTitle }) {
  const { t } = useI18n();
  const { colors, layout, radii } = useTheme();
  const images = (memories ?? []).filter((m) => m.mediaUrl || m.url).slice(0, 12);

  if (!images.length) {
    return (
      <Text style={{ color: colors.textSecondary, fontSize: 14 * layout.fontScale }}>
        {eventTitle ? t('events.noPhotosLinkedTo', { title: eventTitle }) : t('events.noPhotosLinkedYet')}
      </Text>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {images.map((m) => (
        <Image
          key={String(m._id)}
          source={{ uri: m.mediaUrl ?? m.url }}
          style={[styles.thumb, { borderRadius: radii.lg }]}
          accessibilityLabel={m.caption || t('events.eventPhoto')}
        />
      ))}
    </ScrollView>
  );
}

export const EventGallery = memo(EventGalleryComponent);

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  thumb: { width: 120, height: 120 },
});
