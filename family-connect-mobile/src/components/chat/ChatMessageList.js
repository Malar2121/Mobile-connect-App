import React, { forwardRef, useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ChatDateChip } from './ChatDateChip';
import { ChatMessageBubble } from './ChatMessageBubble';
import { getMessageReactions, isMessageStarred } from '../../utils/chatModuleHelpers';
import { ChatEmptyState } from './ChatEmptyState';
import {
  buildChatListItems,
  getSenderId,
  isMyMessage,
  messageKey,
} from '../../utils/chatHelpers';

export const ChatMessageList = forwardRef(function ChatMessageList(
  {
    messages,
    userId,
    familyMemberCount,
    editedTexts,
    reactions,
    starredIds,
    searchQuery,
    onScroll,
    onLongPress,
    onSwipeReply,
    onReactionPress,
    headerOffset,
    onLoadMore,
    loadingMore,
    uiMode,
  },
  ref,
) {
  const listItems = useMemo(() => buildChatListItems(messages), [messages]);

  const renderItem = useCallback(
    ({ item, index }) => {
      if (item.type === 'date') {
        return <ChatDateChip label={item.dateLabel} />;
      }

      const message = item.message;
      const mine = isMyMessage(message, userId);

      const prevMsgItem = listItems
        .slice(0, index)
        .reverse()
        .find((i) => i.type === 'message');
      const prev = prevMsgItem?.message;
      const showAvatar =
        !mine &&
        (!prev || getSenderId(prev) !== getSenderId(message) || isMyMessage(prev, userId));

      const msgReactions = getMessageReactions(message, reactions);
      const isStarred = isMessageStarred(message, userId, starredIds);

      return (
        <ChatMessageBubble
          message={message}
          isMine={mine}
          userId={userId}
          familyMemberCount={familyMemberCount}
          showAvatar={showAvatar}
          editedTexts={editedTexts}
          reactions={msgReactions}
          isStarred={isStarred}
          searchQuery={searchQuery}
          replyToMessage={message.replyTo}
          uiMode={uiMode}
          onLongPress={onLongPress}
          onSwipeReply={onSwipeReply}
          onReactionPress={(emoji) => onReactionPress?.(message, emoji)}
        />
      );
    },
    [
      listItems,
      userId,
      familyMemberCount,
      editedTexts,
      reactions,
      starredIds,
      searchQuery,
      onLongPress,
      onSwipeReply,
      onReactionPress,
      uiMode,
    ],
  );

  const handleScroll = useCallback(
    (e) => {
      onScroll?.(e);
      const y = e.nativeEvent.contentOffset.y;
      if (y < 80 && onLoadMore) onLoadMore();
    },
    [onScroll, onLoadMore],
  );

  return (
    <FlatList
      ref={ref}
      data={listItems}
      keyExtractor={(item) => item.key}
      renderItem={renderItem}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      initialNumToRender={14}
      maxToRenderPerBatch={12}
      windowSize={9}
      removeClippedSubviews
      contentContainerStyle={[
        styles.content,
        { paddingTop: headerOffset ?? 100, paddingBottom: 16 },
        listItems.length === 0 && styles.emptyGrow,
      ]}
      ListEmptyComponent={<ChatEmptyState />}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
});

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  emptyGrow: {
    flex: 1,
    justifyContent: 'center',
  },
});
