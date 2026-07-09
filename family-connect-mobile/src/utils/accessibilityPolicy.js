/**
 * Centralized accessibility policies for UI modes.
 * Business rules only — no UI changes beyond gating.
 */

/** @typedef {'standard' | 'minor' | 'elder'} UIMode */

export function isMinorMode(uiMode) {
  return uiMode === 'minor';
}

export function isElderMode(uiMode) {
  return uiMode === 'elder';
}

/** Hide sensitive or explicit media thumbnails in minor mode. */
export function canShowSensitiveMedia(uiMode, memory) {
  if (!isMinorMode(uiMode)) return true;
  if (!memory) return true;
  if (memory.isSensitive || memory.sensitive) return false;
  if (memory.mediaType === 'video' && memory.duration > 120) return false;
  return true;
}

/** Admin-only flows hidden for minors regardless of role. */
export function canPerformAdminAction(uiMode, isAdmin) {
  return Boolean(isAdmin) && !isMinorMode(uiMode);
}

/** Location sharing and precision controls. */
export function canControlLocationSharing(uiMode) {
  return !isMinorMode(uiMode);
}

export function canUseHighPrecisionLocation(uiMode) {
  return !isMinorMode(uiMode);
}

/** SOS requires guardian oversight in minor mode. */
export function canTriggerSOS(uiMode) {
  return !isMinorMode(uiMode);
}

/** Restrict destructive or upload actions for minors. */
export function canUploadMedia(uiMode) {
  return !isMinorMode(uiMode);
}

export function canDeleteContent(uiMode, isAdmin) {
  if (isMinorMode(uiMode)) return false;
  return isAdmin;
}

/** Chat notifications suppressed in minor mode (existing behavior). */
export function shouldShowChatNotification(uiMode) {
  return !isMinorMode(uiMode);
}

/** Elder mode simplifies dense admin surfaces. */
export function shouldShowAdvancedSettings(uiMode) {
  return !isElderMode(uiMode);
}

export function getAccessibilityPolicy(uiMode, { isAdmin = false } = {}) {
  return {
    isMinor: isMinorMode(uiMode),
    isElder: isElderMode(uiMode),
    canShowSensitiveMedia: (memory) => canShowSensitiveMedia(uiMode, memory),
    canPerformAdminAction: canPerformAdminAction(uiMode, isAdmin),
    canControlLocationSharing: canControlLocationSharing(uiMode),
    canUseHighPrecisionLocation: canUseHighPrecisionLocation(uiMode),
    canTriggerSOS: canTriggerSOS(uiMode),
    canUploadMedia: canUploadMedia(uiMode),
    canDeleteContent: canDeleteContent(uiMode, isAdmin),
    shouldShowChatNotification: shouldShowChatNotification(uiMode),
    shouldShowAdvancedSettings: shouldShowAdvancedSettings(uiMode),
  };
}
