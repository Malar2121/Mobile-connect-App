/**
 * Gradient presets — premium accents across dashboard, auth, and headers.
 */

export function createGradients(isDark) {
  if (isDark) {
    return {
      hero: ['#1A1D3D', '#2A2D5C', '#0A0A0F'],
      header: ['#1A1D3D', '#22224A', '#0E0E16'],
      primary: ['#4F56D9', '#6B72F0', '#7B82FF'],
      secondary: ['#009E7E', '#2DD4BF'],
      warm: ['#7C3AED', '#EC4899'],
      cool: ['#3B82F6', '#4F56D9'],
      mint: ['#059669', '#2DD4BF'],
      sunset: ['#F59E0B', '#FF6B4A'],
      glass: ['rgba(26,29,61,0.9)', 'rgba(10,10,15,0.85)'],
      cardAccent: ['#4F56D9', '#7C3AED'],
      auth: ['#0A0A0F', '#14141C', '#1A1D3D'],
      sent: ['#4F46E5', '#6B72F0', '#7B82FF'],
      sentDark: ['#3D44B8', '#4F56D9', '#6B72F0'],
      accent: ['#4F56D9', '#EC4899'],
    };
  }
  return {
    hero: ['#EEF0FF', '#F5F6FA', '#FFFFFF'],
    header: ['#EEF0FF', '#E8EAFC', '#F5F6FA'],
    primary: ['#4F56D9', '#6B72F0'],
    secondary: ['#00B894', '#2DD4BF'],
    warm: ['#8B5CF6', '#EC4899'],
    cool: ['#3B82F6', '#4F56D9'],
    mint: ['#10B981', '#2DD4BF'],
    sunset: ['#F59E0B', '#FF6B4A'],
    glass: ['rgba(255,255,255,0.94)', 'rgba(255,255,255,0.78)'],
    cardAccent: ['#4F56D9', '#8B5CF6'],
    auth: ['#EEF0FF', '#F5F6FA', '#FFFFFF'],
    sent: ['#4F56D9', '#6B72F0', '#8B5CF6'],
    sentDark: ['#3D44B8', '#4F56D9', '#6B72F0'],
    accent: ['#4F56D9', '#EC4899'],
  };
}

export function dashboardGradients(isDark) {
  const g = createGradients(isDark);
  return {
    header: g.header,
    cardAccent: g.cardAccent,
    warm: g.warm,
    cool: g.cool,
    mint: g.mint,
    sunset: g.sunset,
    glass: g.glass,
  };
}

export const chatGradients = {
  get sent() {
    return ['#4F56D9', '#6B72F0', '#8B5CF6'];
  },
  get sentDark() {
    return ['#3D44B8', '#4F56D9', '#6B72F0'];
  },
  accent: ['#4F56D9', '#EC4899'],
  glass: ['rgba(255,255,255,0.94)', 'rgba(255,255,255,0.8)'],
  glassDark: ['rgba(20,20,28,0.94)', 'rgba(20,20,28,0.8)'],
};
