import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../Avatar';

const MAX_VISIBLE = 4;

export function FamilyAvatarGroup({ members = [], size = 36, overlap = 10 }) {
  const visible = members.slice(0, MAX_VISIBLE);
  const extra = members.length - MAX_VISIBLE;

  return (
    <View style={[styles.row, { height: size }]}>
      {visible.map((member, index) => {
        const user = member.user ?? member;
        return (
          <View
            key={user._id ?? index}
            style={[
              styles.avatarWrap,
              {
                marginLeft: index === 0 ? 0 : -overlap,
                zIndex: visible.length - index,
                borderRadius: size / 2,
              },
            ]}
          >
            <Avatar
              uri={user.avatar}
              name={user.fullName ?? user.name}
              size={size}
            />
          </View>
        );
      })}
      {extra > 0 ? (
        <View
          style={[
            styles.extra,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -overlap,
            },
          ]}
        >
          <Text style={styles.extraText}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  extra: {
    backgroundColor: 'rgba(99,102,241,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  extraText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
