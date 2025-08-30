export const FEATURES = {
  MAPS: process.env.NEXT_PUBLIC_ENABLE_MAPS === 'true',
} as const;

export const CUISINES = [
  'American',
  'Asian',
  'Chinese',
  'French',
  'Indian',
  'Italian',
  'Japanese',
  'Mexican',
  'Mediterranean',
  'Middle Eastern',
  'Thai',
  'Other',
] as const;

export const PRICE_LEVELS = {
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
} as const;

export const RATING_CATEGORIES = {
  overall: 'Overall',
  food: 'Food',
  service: 'Service',
  vibe: 'Vibe',
  value: 'Value',
} as const;

export const VISIBILITY_OPTIONS = {
  my_circles: 'My Network',
  public: 'Public',
} as const;

export const USER_ROLES = {
  user: 'User',
  admin: 'Admin',
} as const;

export const INVITE_STATUS = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
} as const;

export const REPORT_REASONS = [
  'Spam',
  'Inappropriate content',
  'False information',
  'Harassment',
  'Other',
] as const;