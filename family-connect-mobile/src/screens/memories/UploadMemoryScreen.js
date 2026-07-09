import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Screen,
  TextField,
  useToast,
} from '../../design-system';
import { useTheme } from '../../hooks/useTheme';
import { uploadMemory } from '../../services/memoryService';

async function ensureLibraryPermission() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission needed',
      'Allow access to your photo library to share family memories.',
    );
    return false;
  }
  return true;
}

async function ensureCameraPermission() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission needed',
      'Allow camera access to capture new memories.',
    );
    return false;
  }
  return true;
}

export default function UploadMemoryScreen({ navigation }) {
  const { colors, layout, uiMode } = useTheme();
  const toast = useToast();
  const [caption, setCaption] = useState('');
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMinor = uiMode === 'minor';
  const isElder = uiMode === 'elder';
  const titleSize = (isElder ? 26 : 22) * layout.fontScale;
  const previewHeight = isElder ? 320 : 260;
  const btnExtra = isElder ? { minHeight: layout.minTouch + 14 } : undefined;

  async function pickFromLibrary() {
    setError('');
    if (!(await ensureLibraryPermission())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.85,
      videoMaxDuration: 120,
    });

    if (!result.canceled && result.assets?.[0]) {
      setAsset(result.assets[0]);
    }
  }

  async function captureWithCamera() {
    setError('');
    if (!(await ensureCameraPermission())) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.85,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets?.[0]) {
      setAsset(result.assets[0]);
    }
  }

  function showPickerOptions() {
    Alert.alert('Add media', 'Choose a source', [
      { text: 'Photo library', onPress: pickFromLibrary },
      { text: 'Camera', onPress: captureWithCamera },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleUpload() {
    if (!asset) {
      setError('Select a photo or video first.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const isVideo = asset.type === 'video';
      const ext = asset.uri.split('.').pop()?.split('?')[0] || (isVideo ? 'mp4' : 'jpg');
      const mime =
        asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');

      const formData = new FormData();
      formData.append('media', {
        uri: asset.uri,
        type: mime,
        name: `memory.${ext}`,
      });
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      await uploadMemory(formData);
      toast.success('Memory shared with family');
      navigation.navigate('MemoriesHome', { refresh: Date.now() });
    } catch (e) {
      setError(e.message || 'Upload failed.');
      toast.error(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  const isVideo = asset?.type === 'video';

  if (isMinor) {
    return (
      <Screen edges={['top']}>
        <PageHeader title="Upload" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="shield-outline"
          title="Uploads disabled"
          description="Ask a parent or guardian to upload memories for the family."
          actionLabel="Back to gallery"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} scroll>
      <PageHeader title="Upload memory" onBack={() => navigation.goBack()} />
      <Text
        style={{
          color: colors.textSecondary,
          marginBottom: layout.sectionGap,
          fontSize: 15 * layout.fontScale,
        }}
      >
        Share a photo or video with your family.
      </Text>

        {error ? (
          <Text style={{ color: colors.error, marginBottom: 12, fontSize: 14 * layout.fontScale }}>
            {error}
          </Text>
        ) : null}

        <Card style={{ marginBottom: layout.sectionGap, padding: 0, overflow: 'hidden' }}>
          {asset ? (
            <View>
              {isVideo ? (
                <Video
                  source={{ uri: asset.uri }}
                  style={{ width: '100%', height: previewHeight, backgroundColor: '#000' }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                />
              ) : (
                <Image
                  source={{ uri: asset.uri }}
                  style={{ width: '100%', height: previewHeight }}
                  resizeMode="cover"
                />
              )}
              <Pressable
                onPress={() => setAsset(null)}
                style={({ pressed }) => [
                  styles.removePreview,
                  { backgroundColor: colors.overlay, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Ionicons name="close-circle" size={28} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={showPickerOptions}
              style={({ pressed }) => [
                styles.pickerZone,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  minHeight: previewHeight,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Ionicons name="images-outline" size={isElder ? 48 : 40} color={colors.primary} />
              <Text
                style={{
                  color: colors.text,
                  fontWeight: '700',
                  marginTop: 12,
                  fontSize: (isElder ? 17 : 15) * layout.fontScale,
                }}
              >
                Choose photo or video
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 6, fontSize: 13 * layout.fontScale }}>
                Library or camera
              </Text>
            </Pressable>
          )}
        </Card>

        {asset ? (
          <Button
            title="Change media"
            variant="secondary"
            onPress={showPickerOptions}
            style={{ marginBottom: layout.sectionGap }}
          />
        ) : null}

        <TextField
          label="Caption"
          value={caption}
          onChangeText={setCaption}
          placeholder="A note for the family"
          multiline
          numberOfLines={isElder ? 4 : 3}
        />

        <Button
          title="Upload"
          onPress={handleUpload}
          loading={loading}
          disabled={loading || !asset}
          size="lg"
          style={{ marginBottom: 32 }}
        />
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontWeight: '800', marginBottom: 8 },
  pickerZone: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: 16,
    margin: 12,
  },
  removePreview: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 14,
    padding: 2,
  },
});
