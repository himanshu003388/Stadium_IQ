export const COLORS = {
  surface: 'var(--color-surface)',
  surfaceDim: 'var(--color-surface-dim)',
  surfaceBright: 'var(--color-surface-bright)',
  surfaceContainerLowest: 'var(--color-surface-container-lowest)',
  surfaceContainerHigh: 'var(--color-surface-container-high)',
  onSurface: 'var(--color-on-surface)',
  onSurfaceVariant: 'var(--color-on-surface-variant)',
  outline: 'var(--color-outline)',
  outlineVariant: 'var(--color-outline-variant)',
  background: 'var(--color-background)',
  primary: 'var(--color-primary)',
  primaryContainer: 'var(--color-primary-container)',
  secondaryContainer: 'var(--color-secondary-container)',
  tertiary: 'var(--color-tertiary)',
  gradientNavy: 'linear-gradient(135deg, #0B1E3D, #1B3A6B)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  onPrimary: 'var(--color-on-primary)',
  statusCritical: 'var(--color-status-critical)',
  statusBusy: 'var(--color-status-busy)',
  statusNominal: 'var(--color-status-nominal)',
  headerBg: 'var(--color-header-bg)',
  headerText: 'var(--color-header-text)',
};

export const ZONE_COLORS = {
  north: { fill: '#2563EB', bg: '#DBEAFE', text: '#1E3A8A', label: 'North' },
  south: { fill: '#DC2626', bg: '#FEE2E2', text: '#7F1D1D', label: 'South' },
  east: { fill: '#059669', bg: '#D1FAE5', text: '#064E3B', label: 'East' },
  west: { fill: '#D97706', bg: '#FEF3C7', text: '#78350F', label: 'West' },
  nominal: { fill: '#16A34A', bg: '#DCFCE7', text: '#14532D', label: 'Nominal' },
  busy: { fill: '#D97706', bg: '#FEF3C7', text: '#78350F', label: 'Busy' },
  moderate: { fill: '#EA580C', bg: '#FFEDD5', text: '#7C2D12', label: 'Moderate' },
  critical: { fill: '#EF4444', bg: '#FEE2E2', text: '#7F1D1D', label: 'Critical' },
};

export const PRIORITY_COLORS = {
  high: '#C62828',
  medium: '#B45309',
  low: '#1D4ED8',
};

export const PRIORITY_BG = {
  high: 'rgba(198, 40, 40, 0.12)',
  medium: 'rgba(180, 83, 9, 0.12)',
  low: 'rgba(29, 78, 216, 0.12)',
};

export const LANG_FLAGS = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  ar: '🇸🇦',
  pt: '🇧🇷',
  ja: '🇯🇵',
  hi: '🇮🇳',
};

export const GATE_STATUS_COLORS = {
  normal: { bg: '#DCFCE7', text: '#14532D', label: 'Normal' },
  watch: { bg: '#FFEDD5', text: '#7C2D12', label: 'Watch' },
  critical: { bg: '#FEE2E2', text: '#7F1D1D', label: 'Critical' },
};

export const TRANSPORT_ICONS = {
  subway: 'subway',
  bus: 'directions_bus',
  shuttle: 'airport_shuttle',
  train: 'train',
  rideshare: 'car_rental',
  parking: 'local_parking',
  walking: 'directions_walk',
};

export const NAV_ITEMS = [
  { id: 'dashboard', icon: 'dashboard', label: 'Command Center', desc: 'Overview & KPIs', allowedRoles: ['organizer', 'staff'] },
  { id: 'crowdmap', icon: 'map', label: 'Crowd Map', desc: 'Navigation & density', allowedRoles: ['organizer', 'staff', 'volunteer'] },
  { id: 'volunteers', icon: 'groups', label: 'Volunteer Dispatch', desc: 'Task assignment', allowedRoles: ['organizer'] },
  { id: 'transport', icon: 'directions_bus', label: 'Transport Hub', desc: 'Departure options', allowedRoles: ['organizer', 'staff', 'volunteer', 'fan'] },
  { id: 'sustainability', icon: 'eco', label: 'Sustainability', desc: 'Green metrics', allowedRoles: ['organizer', 'staff', 'fan'] },
  { id: 'accessibility', icon: 'accessible', label: 'Accessibility', desc: 'Inclusive services', allowedRoles: ['organizer', 'staff', 'volunteer', 'fan'] },
  { id: 'vendors', icon: 'store', label: 'Concessions', desc: 'Vendor dashboard', allowedRoles: ['organizer', 'staff'] },
  { id: 'volunteer-mobile', icon: 'smartphone', label: 'Volunteer Mobile', desc: 'Mobile responder', allowedRoles: ['volunteer'] },
  { id: 'assistant', icon: 'smart_toy', label: 'AI Assistant', desc: 'GenAI help', allowedRoles: ['organizer', 'staff', 'volunteer', 'fan'] },
];

export const QUICK_PROMPTS = [
  { text: 'Which gate is least busy?', icon: 'meeting_room' },
  { text: 'Best transport options?', icon: 'directions_bus' },
  { text: 'Current crowd conditions?', icon: 'groups' },
  { text: 'Accessibility services?', icon: 'accessible' },
  { text: 'Where can I eat nearby?', icon: 'restaurant' },
  { text: 'Sustainability efforts?', icon: 'eco' },
];
