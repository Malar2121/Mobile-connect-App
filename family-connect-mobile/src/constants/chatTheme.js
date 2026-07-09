/** Chat-specific tokens + tab config */
export {
  chatTypography,
  chatRadii,
  chatGradients,
  chatShadows,
} from '../design-system';

export const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '🎉', '👏'];

export const QUICK_EMOJIS = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '✨', '🙏', '💯', '🥳'];

export const STICKERS = ['🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐸', '🦄', '🌈', '⭐', '🍕', '🎂'];

export const TAB_CONFIG = [
  { route: 'Dashboard', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { route: 'Events', label: 'Events', icon: 'calendar', iconOutline: 'calendar-outline' },
  { route: 'Memories', label: 'Memories', icon: 'images', iconOutline: 'images-outline' },
  { route: 'Chat', label: 'Chat', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
  { route: 'Map', label: 'Map', icon: 'map', iconOutline: 'map-outline' },
  { route: 'Profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
];
