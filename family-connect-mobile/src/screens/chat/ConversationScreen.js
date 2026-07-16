import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Loader } from '../../components/Loader';
import { ChatActionSheet } from '../../components/chat/ChatActionSheet';
import { ChatMentionBar } from '../../components/chat/ChatMentionBar';
import { ChatAttachmentSheet } from '../../components/chat/ChatAttachmentSheet';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { ChatInputBar } from '../../components/chat/ChatInputBar';
import { ChatMessageList } from '../../components/chat/ChatMessageList';
import { ChatNoFamilyState } from '../../components/chat/ChatNoFamilyState';
import { PinnedBanner } from '../../components/chat/PinnedBanner';
import { ChatReplyBar } from '../../components/chat/ChatReplyBar';
import { ChatScrollFab } from '../../components/chat/ChatScrollFab';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { useChatModule } from '../../contexts/ChatModuleContext';
import { useTheme } from '../../hooks/useTheme';
import { getUnreadCount } from '../../utils/chatHelpers';
import { getMessageReactions, isMessageStarred } from '../../utils/chatModuleHelpers';

export default function ConversationScreen() {
  const navigation = useNavigation();
  const { colors, isDark, uiMode } = useTheme();
  const insets = useSafeAreaInsets();
  const recordingRef = useRef(null);
  const recordingStart = useRef(null);

  const {
    family,
    members,
    userId,
    messages,
    prefs,
    draft,
    loading,
    sending,
    error,
    setError,
    typingName,
    replyTo,
    setReplyTo,
    showScrollFab,
    listRef,
    familyMemberCount,
    onlineCount,
    pinnedMessage,
    scrollToBottom,
    handleDraftChange,
    handleSend,
    sendTextMessage,
    handleDelete,
    handleCopy,
    handleForward,
    handleEdit,
    handlePin,
    handleUnpin,
    handleToggleStar,
    handleReaction,
    handleSchedule,
    handleScroll,
    loadMore,
    loadingMore,
    setLastReadAt,
  } = useChatModule();

  const [actionMessage, setActionMessage] = useState(null);
  const [attachOpen, setAttachOpen] = useState(false);

  const reactionsMap = useMemo(() => {
    const map = {};
    messages.forEach((m) => {
      map[String(m._id)] = getMessageReactions(m, prefs.reactions);
    });
    return map;
  }, [messages, prefs.reactions]);

  const starredIds = useMemo(
    () => messages.filter((m) => isMessageStarred(m, userId, prefs.starredIds)).map((m) => String(m._id)),
    [messages, userId, prefs.starredIds],
  );

  const unreadBelow = useMemo(
    () => getUnreadCount(messages, userId, prefs.lastReadAt),
    [messages, userId, prefs.lastReadAt],
  );

  const handleAction = useCallback(
    (actionId, message) => {
      const text = prefs.editedTexts[String(message._id)] ?? message.text ?? '';
      switch (actionId) {
        case 'reply':
          setReplyTo(message);
          break;
        case 'copy':
          handleCopy(message, prefs.editedTexts);
          break;
        case 'forward':
          handleForward(message, prefs.editedTexts);
          break;
        case 'edit':
          if (Platform.OS === 'ios') {
            Alert.prompt('Edit message', undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Save', onPress: (val) => handleEdit(message, val) },
            ], 'plain-text', text);
          } else {
            handleEdit(message, `${text} ✏️`);
          }
          break;
        case 'pin':
          if (message.pinnedAt) handleUnpin(message);
          else handlePin(message);
          break;
        case 'star':
          handleToggleStar(message);
          break;
        case 'schedule':
          handleSchedule(text || 'Scheduled message', new Date(Date.now() + 3600000).toISOString());
          Alert.alert('Scheduled', 'Message will send in 1 hour.');
          break;
        case 'delete':
          Alert.alert('Delete message?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => handleDelete(message) },
          ]);
          break;
        default:
          break;
      }
    },
    [prefs, setReplyTo, handleCopy, handleForward, handleEdit, handlePin, handleUnpin, handleToggleStar, handleSchedule, handleDelete],
  );

  const handleAttachment = useCallback(
    async (type) => {
      try {
        if (type === 'gallery') {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.85 });
          if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            await sendTextMessage(draft || '', {
              mediaOptions: {
                mediaUri: asset.uri,
                mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
                mediaType: asset.type === 'video' ? 'video' : 'image',
              },
            });
          }
        } else if (type === 'camera') {
          const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
          if (!result.canceled && result.assets[0]) {
            await sendTextMessage('', { mediaOptions: { mediaUri: result.assets[0].uri, mimeType: 'image/jpeg' } });
          }
        } else if (type === 'document') {
          const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
          if (!result.canceled && result.assets[0]) {
            const doc = result.assets[0];
            await sendTextMessage(doc.name ? `📎 ${doc.name}` : '', {
              mediaOptions: {
                mediaUri: doc.uri,
                mimeType: doc.mimeType || 'application/pdf',
                mediaType: doc.mimeType?.startsWith('image') ? 'image' : 'document',
                documentName: doc.name,
                fileName: doc.name,
              },
            });
          }
        } else if (type === 'gif') {
          handleDraftChange(`${draft} 🎬`);
        }
      } catch (e) {
        setError(e.message || 'Attachment failed.');
      }
    },
    [draft, sendTextMessage, handleDraftChange, setError],
  );

  const startVoiceRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      recordingStart.current = Date.now();
    } catch {
      setError('Could not start voice recording.');
    }
  }, [setError]);

  const stopVoiceRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const duration = recordingStart.current ? Math.round((Date.now() - recordingStart.current) / 1000) : null;
      recordingRef.current = null;
      if (uri) {
        await sendTextMessage('🎤 Voice message', {
          mediaOptions: { mediaUri: uri, mimeType: 'audio/m4a', mediaType: 'audio', mediaDuration: duration },
        });
      }
    } catch {
      setError('Could not send voice message.');
    }
  }, [sendTextMessage, setError]);

  if (loading) return <Loader fullScreen />;
  if (!family) return <ChatNoFamilyState />;

  const wallpaperUri = prefs.wallpaper;
  const content = (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ChatHeader
        familyName={family.name}
        members={members}
        onlineCount={onlineCount}
        onVoiceCall={() => Alert.alert('Voice call', 'Coming soon')}
        onVideoCall={() => Alert.alert('Video call', 'Coming soon')}
        onSearch={() => navigation.navigate('ChatSearch')}
        onMore={() => navigation.navigate('ChatSettings')}
        onBack={() => navigation.goBack()}
        showBack
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.flex}>
          {prefs.archived && uiMode !== 'minor' ? (
            <View style={[styles.archivedBanner, { backgroundColor: isDark ? colors.card : '#FEF3C7' }]}>
              <Text style={{ color: colors.text, fontSize: 13 }}>This chat is archived</Text>
            </View>
          ) : null}

          {/* <PinnedBanner
            message={pinnedMessage}
            editedTexts={prefs.editedTexts}
            onPress={() => scrollToBottom()}
            onUnpin={() => pinnedMessage && handleUnpin(pinnedMessage)}
          /> */}

          <ChatMessageList
            ref={listRef}
            messages={messages}
            userId={userId}
            familyMemberCount={familyMemberCount}
            editedTexts={prefs.editedTexts}
            reactions={reactionsMap}
            starredIds={starredIds}
            onScroll={handleScroll}
            onLoadMore={loadMore}
            loadingMore={loadingMore}
            uiMode={uiMode}
            headerOffset={insets.top + 88}
            onLongPress={uiMode === 'minor' ? undefined : setActionMessage}
            onSwipeReply={setReplyTo}
            onReactionPress={handleReaction}
          />

          <ChatScrollFab
            visible={showScrollFab}
            unreadCount={unreadBelow}
            onPress={() => {
              scrollToBottom();
              setLastReadAt(new Date().toISOString());
            }}
          />

          <TypingIndicator name={typingName} />
          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <ChatReplyBar message={replyTo} editedTexts={prefs.editedTexts} onClose={() => setReplyTo(null)} />
          <ChatMentionBar
            draft={draft}
            members={members}
            onSelect={(member) => {
              const atIndex = draft.lastIndexOf('@');
              const base = atIndex >= 0 ? draft.slice(0, atIndex) : draft;
              handleDraftChange(`${base}@${member.fullName} `);
            }}
          />

          <ChatInputBar
            draft={draft}
            onChangeText={handleDraftChange}
            onSend={handleSend}
            onAttach={() => setAttachOpen(true)}
            onCamera={() => handleAttachment('camera')}
            onVoiceStart={startVoiceRecording}
            onVoiceEnd={stopVoiceRecording}
            sending={sending}
            bottomInset={insets.bottom}
          />
        </View>
      </KeyboardAvoidingView>

      <ChatActionSheet
        visible={Boolean(actionMessage)}
        message={actionMessage}
        isMine={actionMessage && String(actionMessage.sender?._id ?? actionMessage.sender) === String(userId)}
        isPinned={Boolean(actionMessage?.pinnedAt)}
        isStarred={actionMessage && isMessageStarred(actionMessage, userId, prefs.starredIds)}
        onClose={() => setActionMessage(null)}
        onAction={handleAction}
        onReaction={(emoji) => actionMessage && handleReaction(actionMessage, emoji)}
      />

      <ChatAttachmentSheet visible={attachOpen} onClose={() => setAttachOpen(false)} onSelect={handleAttachment} />
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.flex}>
      {wallpaperUri ? (
        <ImageBackground source={{ uri: wallpaperUri }} style={styles.flex} imageStyle={{ opacity: isDark ? 0.15 : 0.25 }}>
          {content}
        </ImageBackground>
      ) : (
        content
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  archivedBanner: { marginHorizontal: 16, marginTop: 100, padding: 10, borderRadius: 12, alignItems: 'center' },
  error: { textAlign: 'center', fontSize: 13, paddingHorizontal: 16, paddingBottom: 4 },
});
