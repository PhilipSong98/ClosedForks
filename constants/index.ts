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
  DISHES: [
    'Pasta',
    'Burger',
    'Pizza',
    'Sushi',
    'Ramen',
    'Steak',
    'Sandwich',
    'Salad',
    'Tacos',
    'Curry',
    'Poke',
    'Wings',
    'Kebab',
    'BBQ',
    'Seafood',
    'Soup'
  ],
  CUISINE: [
    'Asian',
    'Mexican',
    'Italian', 
    'American',
    'Mediterranean',
    'Nordic',
    'French',
    'Indian'
  ],
  MEAL_TYPE: [
    'Brunch',
    'Lunch', 
    'Dinner',
    'Dessert',
    'Coffee',
    'Drinks',
    'Breakfast'
  ],
  VIBE: [
    'Casual',
    'Fine Dining',
    'Date Night',
    'Groups',
    'Quick Bite',
    'Cozy',
    'Trendy',
    'Family Friendly'
  ]
} as const;

// Flattened array of all tags for easier use
export const ALL_REVIEW_TAGS = [
  ...REVIEW_TAGS.DISHES,
  ...REVIEW_TAGS.CUISINE,
  ...REVIEW_TAGS.MEAL_TYPE,
  ...REVIEW_TAGS.VIBE,
] as const;

// Tag category icons and colors for UI
export const TAG_CATEGORY_CONFIG = {
  DISHES: {
    label: 'Popular Dishes',
    icon: '🍽️',
    color: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'
  },
  CUISINE: {
    label: 'Cuisine Type', 
    icon: '🌍',
    color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
  },
  MEAL_TYPE: {
    label: 'Meal Type',
    icon: '⏰',
    color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
  },
  VIBE: {
    label: 'Atmosphere',
    icon: '✨',
    color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
  }
} as const;