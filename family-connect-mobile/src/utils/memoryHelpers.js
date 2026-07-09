export function getUploader(memory) {
  const u = memory?.uploadedBy;
  if (u && typeof u === 'object') return u;
  return { fullName: 'Member', avatar: null, _id: u };
}

export function getUploaderId(memory) {
  const u = memory?.uploadedBy;
  if (!u) return '';
  return String(u._id ?? u);
}

export function getLikeCount(memory) {
  return memory?.likes?.length ?? 0;
}

export function isLikedByUser(memory, userId) {
  if (!userId || !memory?.likes?.length) return false;
  const uid = String(userId);
  return memory.likes.some((id) => String(id._id ?? id) === uid);
}

export function canDeleteMemory(memory, user) {
  if (!user || !memory) return false;
  if (user.role === 'admin') return true;
  return getUploaderId(memory) === String(user._id);
}

export function formatMemoryDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function toggleLikeOptimistic(memory, userId) {
  const uid = String(userId);
  const likes = [...(memory.likes ?? [])];
  const idx = likes.findIndex((id) => String(id._id ?? id) === uid);
  if (idx > -1) {
    likes.splice(idx, 1);
  } else {
    likes.push(userId);
  }
  return { ...memory, likes };
}
