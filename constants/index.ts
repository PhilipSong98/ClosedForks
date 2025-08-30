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

export const REVIEW_TAGS = {
  CUISINE: [
    'Italian',
    'Chinese', 
    'Japanese',
    'Thai',
    'Indian',
    'Mexican',
    'French',
    'Spanish',
    'American',
    'Korean',
    'Vietnamese',
    'Greek',
    'Mediterranean',
    'Middle Eastern',
    'Nordic',
    'German',
    'British',
    'Brazilian',
    'Peruvian',
    'African',
    'Caribbean',
    'Fusion',
  ],
  EXPERIENCE: [
    'Casual Dining',
    'Fine Dining',
    'Fast Food',
    'Street Food',
    'Buffet',
    'Brunch',
    'Late Night',
    'Happy Hour',
    'Takeout',
    'Delivery',
  ],
  ATMOSPHERE: [
    'Romantic',
    'Family Friendly',
    'Business Lunch',
    'Group Dining',
    'Date Night',
    'Outdoor Seating',
    'Waterfront',
    'Rooftop',
    'Cozy',
    'Trendy',
    'Historic',
    'Modern',
  ],
  DIETARY: [
    'Vegetarian Friendly',
    'Vegan Options',
    'Halal',
    'Kosher',
    'Gluten Free',
    'Healthy Options',
    'Organic',
    'Local Ingredients',
  ]
} as const;

// Flattened array of all tags for easier use
export const ALL_REVIEW_TAGS = [
  ...REVIEW_TAGS.CUISINE,
  ...REVIEW_TAGS.EXPERIENCE,
  ...REVIEW_TAGS.ATMOSPHERE,
  ...REVIEW_TAGS.DIETARY,
] as const;