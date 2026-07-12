import React, { useCallback, useRef } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { PageHeader, Screen, Button } from '../../design-system';
import { useChatModule } from '../../contexts/ChatModuleContext';
import { VoiceBubble } from '../../components/chat/VoiceBubble';
import { useTheme } from '../../hooks/useTheme';
import { useResponsive } from '../../design-system';

export default function VoiceMessageScreen() {
  const navigation = useNavigation();
  const { horizontalPadding } = useResponsive();
  const { colors, layout } = useTheme();
  const { sendTextMessage } = useChatModule();
  const recordingRef = useRef(null);
  const startRef = useRef(null);

  const startRecording = useCallback(async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    startRef.current = Date.now();
  }, []);

  const stopAndSend = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const duration = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : null;
    recordingRef.current = null;
    
    // Generate a simple simulated waveform
    const waveform = Array.from({ length: 40 }, () => Math.floor(Math.random() * 100));

    if (uri) {
      await sendTextMessage('🎤 Voice message', {
        mediaOptions: { mediaUri: uri, mimeType: 'audio/m4a', mediaType: 'audio', mediaDuration: duration, waveform },
      });
      navigation.navigate('Conversation');
    }
  }, [sendTextMessage, navigation]);

  return (
    <Screen edges={['top']}>
      <PageHeader title="Voice message" subtitle="Record & send" onBack={() => navigation.goBack()} />

      <View style={{ paddingTop: 24 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 15 * layout.fontScale, lineHeight: 22, marginBottom: 24 }}>
          Hold record, then send. Playback supports pause, speed control, and seek architecture via VoiceBubble.
        </Text>

        <VoiceBubble uri={null} duration={0} isMine={false} waveform={[]} />

        <Button title="Start recording" onPress={startRecording} style={{ marginTop: 20 }} />
        <Button title="Stop & send" onPress={stopAndSend} variant="secondary" style={{ marginTop: 12 }} />
      </View>
    </Screen>
  );
}
