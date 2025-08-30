export const CUISINES = [
  'Italian',
  'Chinese',
  'Japanese',
  'American',
  'Mexican',
  'Thai',
  'Indian',
  'French',
  'Mediterranean'
] as const;

export const cuisineImageMap: Record<string, string> = {
  'Italian': '/restaurants/restaurant-1.jpg',
  'Chinese': '/restaurants/restaurant-3.jpg',
  'Japanese': '/restaurants/restaurant-2.jpg',
  'American': '/restaurants/restaurant-4.jpg',
  'Mexican': '/restaurants/restaurant-5.jpg',
  'Thai': '/restaurants/restaurant-1.jpg',
  'Indian': '/restaurants/restaurant-2.jpg',
  'French': '/restaurants/restaurant-3.jpg',
  'Mediterranean': '/restaurants/restaurant-4.jpg'
};

export interface User {
  id: string;
  name: string;
  avatar?: string;
  joinDate: string;
  totalReviews: number;
  totalLikes: number;
  favoriteRestaurants: string[];
}

export interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  restaurant: {
    name: string;
    address: string;
    cuisine: string;
    image?: string;
  };
  rating: number;
  dish: string;
  review: string;
  tip?: string;
  timestamp: string;
  likes: number;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  averageRating: number;
  reviewCount: number;
  image?: string;
}

export const currentUser: User = {
  id: 'current-user',
  name: 'Alex Chen',
  avatar: '',
  joinDate: '2024-01-15',
  totalReviews: 12,
  totalLikes: 45,
  favoriteRestaurants: ['The Italian Corner', 'Sushi Zen', 'Burger Palace']
};

// Circle (friends and family) user IDs
export const circleUserIds = ['user-1', 'user-2', 'user-3', 'user-4', 'current-user'];

export const mockUsers: Record<string, User> = {
  'user-1': {
    id: 'user-1',
    name: 'Sarah Johnson',
    avatar: '',
    joinDate: '2023-11-20',
    totalReviews: 8,
    totalLikes: 32,
    favoriteRestaurants: ['Dragon Garden', 'Pasta Prima']
  },
  'user-2': {
    id: 'user-2',
    name: 'Mike Rodriguez',
    avatar: '',
    joinDate: '2024-02-10',
    totalReviews: 15,
    totalLikes: 67,
    favoriteRestaurants: ['The Italian Corner', 'Taco Villa', 'Burger Palace']
  },
  'user-3': {
    id: 'user-3',
    name: 'Emma Wilson',
    avatar: '',
    joinDate: '2023-12-05',
    totalReviews: 11,
    totalLikes: 54,
    favoriteRestaurants: ['Spice Palace', 'Tokyo Ramen']
  },
  'user-4': {
    id: 'user-4',
    name: 'David Kim',
    avatar: '',
    joinDate: '2024-01-03',
    totalReviews: 9,
    totalLikes: 28,
    favoriteRestaurants: ['Le Bistro', 'Mediterranean Delight']
  },
  [currentUser.id]: currentUser
};

export const mockReviews: Review[] = [
  // Italian
  {
    id: '1',
    user: { id: 'user-1', name: 'Sarah Johnson', avatar: '' },
    restaurant: { name: 'The Italian Corner', address: '123 Main St, Downtown', cuisine: 'Italian', image: cuisineImageMap.Italian },
    rating: 5,
    dish: 'Truffle Risotto',
    review: 'Absolutely incredible! The truffle risotto was perfectly creamy and the truffle flavor was rich without being overpowering. The portion size was generous and the presentation was beautiful.',
    tip: 'Ask for extra parmesan - they\'re very generous with it!',
    timestamp: '2024-01-20T18:30:00Z',
    likes: 8
  },
  {
    id: '2',
    user: { id: 'user-2', name: 'Mike Rodriguez', avatar: '' },
    restaurant: { name: 'Pasta Prima', address: '456 Elm St, Little Italy', cuisine: 'Italian', image: cuisineImageMap.Italian },
    rating: 4,
    dish: 'Carbonara',
    review: 'Classic carbonara done right! Silky sauce, perfectly cooked pasta, and generous amount of pancetta. The atmosphere is cozy and authentic.',
    timestamp: '2024-01-19T19:15:00Z',
    likes: 6
  },
  
  // Chinese
  {
    id: '3',
    user: { id: 'user-2', name: 'Mike Rodriguez', avatar: '' },
    restaurant: { name: 'Dragon Garden', address: '789 Pine St, Chinatown', cuisine: 'Chinese', image: cuisineImageMap.Chinese },
    rating: 4,
    dish: 'Kung Pao Chicken',
    review: 'Great flavors and authentic taste. The chicken was tender and the sauce had the perfect balance of sweet and spicy. Service was quick and friendly.',
    timestamp: '2024-01-19T12:15:00Z',
    likes: 5
  },
  {
    id: '4',
    user: { id: 'user-3', name: 'Emma Wilson', avatar: '' },
    restaurant: { name: 'Golden Dragon', address: '321 Washington St, Chinatown', cuisine: 'Chinese', image: cuisineImageMap.Chinese },
    rating: 5,
    dish: 'Peking Duck',
    review: 'The best Peking duck I\'ve had outside of Beijing! Crispy skin, tender meat, and served with all the traditional accompaniments. Worth every penny.',
    tip: 'Order ahead - they prepare the duck fresh and it takes 45 minutes.',
    timestamp: '2024-01-18T20:00:00Z',
    likes: 12
  },

  // Japanese
  {
    id: '5',
    user: { id: 'current-user', name: 'Alex Chen', avatar: '' },
    restaurant: { name: 'Sushi Zen', address: '654 Maple Dr, Downtown', cuisine: 'Japanese', image: cuisineImageMap.Japanese },
    rating: 5,
    dish: 'Omakase Set',
    review: 'The omakase was an amazing experience! Each piece was expertly crafted and the fish was incredibly fresh. The chef was entertaining and explained each piece.',
    tip: 'Sit at the sushi bar for the full experience and interaction with the chef.',
    timestamp: '2024-01-18T19:45:00Z',
    likes: 12
  },
  {
    id: '6',
    user: { id: 'user-4', name: 'David Kim', avatar: '' },
    restaurant: { name: 'Tokyo Ramen', address: '987 Cedar Ave, Japantown', cuisine: 'Japanese', image: cuisineImageMap.Japanese },
    rating: 4,
    dish: 'Tonkotsu Ramen',
    review: 'Rich, creamy broth with perfect noodle texture. The chashu pork was melt-in-your-mouth tender. Authentic flavors that remind me of Tokyo.',
    timestamp: '2024-01-17T13:30:00Z',
    likes: 7
  },

  // American
  {
    id: '7',
    user: { id: 'user-1', name: 'Sarah Johnson', avatar: '' },
    restaurant: { name: 'Burger Palace', address: '456 Oak Ave, Midtown', cuisine: 'American', image: cuisineImageMap.American },
    rating: 4,
    dish: 'BBQ Bacon Burger',
    review: 'Solid burger with great flavor! The meat was cooked perfectly and the BBQ sauce added a nice smoky taste. Fries were crispy and well-seasoned.',
    timestamp: '2024-01-17T20:00:00Z',
    likes: 6
  },
  {
    id: '8',
    user: { id: 'user-3', name: 'Emma Wilson', avatar: '' },
    restaurant: { name: 'Steakhouse 51', address: '789 Broadway, Uptown', cuisine: 'American', image: cuisineImageMap.American },
    rating: 5,
    dish: 'Ribeye Steak',
    review: 'Absolutely perfect ribeye! Cooked exactly to medium-rare as requested. The seasoning was spot-on and the sides complemented the steak beautifully.',
    tip: 'Try the truffle mac and cheese as a side - it\'s incredible!',
    timestamp: '2024-01-16T21:30:00Z',
    likes: 9
  },

  // Mexican
  {
    id: '9',
    user: { id: 'user-2', name: 'Mike Rodriguez', avatar: '' },
    restaurant: { name: 'Taco Villa', address: '234 Sunset Blvd, Mission District', cuisine: 'Mexican', image: cuisineImageMap.Mexican },
    rating: 4,
    dish: 'Carnitas Tacos',
    review: 'Authentic Mexican flavors! The carnitas were perfectly seasoned and tender. Fresh tortillas and great salsa verde. Generous portions too.',
    timestamp: '2024-01-16T14:45:00Z',
    likes: 8
  },
  {
    id: '10',
    user: { id: 'user-4', name: 'David Kim', avatar: '' },
    restaurant: { name: 'Casa Guadalajara', address: '567 Mission St, Mission District', cuisine: 'Mexican', image: cuisineImageMap.Mexican },
    rating: 5,
    dish: 'Mole Poblano',
    review: 'The mole sauce was incredibly complex and flavorful - you can taste the love and time that went into making it. Traditional recipe that feels like home cooking.',
    tip: 'Come hungry - the portions are massive and perfect for sharing.',
    timestamp: '2024-01-15T19:00:00Z',
    likes: 11
  },

  // Thai
  {
    id: '11',
    user: { id: 'user-3', name: 'Emma Wilson', avatar: '' },
    restaurant: { name: 'Bangkok Kitchen', address: '890 Geary St, Tenderloin', cuisine: 'Thai', image: cuisineImageMap.Thai },
    rating: 4,
    dish: 'Pad Thai',
    review: 'Great balance of sweet, sour, and salty flavors. The noodles had perfect texture and the shrimp were large and fresh. Authentic taste!',
    timestamp: '2024-01-15T18:20:00Z',
    likes: 6
  },
  {
    id: '12',
    user: { id: 'current-user', name: 'Alex Chen', avatar: '' },
    restaurant: { name: 'Thai Orchid', address: '345 Valencia St, Mission', cuisine: 'Thai', image: cuisineImageMap.Thai },
    rating: 5,
    dish: 'Green Curry',
    review: 'Incredibly aromatic and flavorful green curry! The heat level was perfect and the vegetables were fresh and crisp. Best Thai food in the neighborhood.',
    tip: 'Ask for the curry medium spicy - their hot is REALLY hot!',
    timestamp: '2024-01-14T20:15:00Z',
    likes: 10
  },

  // Indian
  {
    id: '13',
    user: { id: 'user-1', name: 'Sarah Johnson', avatar: '' },
    restaurant: { name: 'Spice Palace', address: '678 Fillmore St, Pacific Heights', cuisine: 'Indian', image: cuisineImageMap.Indian },
    rating: 5,
    dish: 'Butter Chicken',
    review: 'Creamy, rich, and perfectly spiced butter chicken! The naan was fresh and warm. This is comfort food at its finest.',
    timestamp: '2024-01-14T17:30:00Z',
    likes: 9
  },
  {
    id: '14',
    user: { id: 'user-4', name: 'David Kim', avatar: '' },
    restaurant: { name: 'Maharaja Palace', address: '123 Polk St, Polk Gulch', cuisine: 'Indian', image: cuisineImageMap.Indian },
    rating: 4,
    dish: 'Biryani',
    review: 'Fragrant and flavorful biryani with tender lamb. Each grain of rice was perfectly cooked and the spices were well-balanced. Generous portion size.',
    tip: 'Try the mango lassi - it\'s the perfect complement to spicy dishes.',
    timestamp: '2024-01-13T19:45:00Z',
    likes: 7
  },

  // French
  {
    id: '15',
    user: { id: 'user-2', name: 'Mike Rodriguez', avatar: '' },
    restaurant: { name: 'Le Bistro', address: '456 Union St, Cow Hollow', cuisine: 'French', image: cuisineImageMap.French },
    rating: 5,
    dish: 'Coq au Vin',
    review: 'Classic French cooking at its best! The chicken was tender and the wine sauce was rich and complex. Felt like dining in Paris.',
    timestamp: '2024-01-13T21:00:00Z',
    likes: 8
  },
  {
    id: '16',
    user: { id: 'user-3', name: 'Emma Wilson', avatar: '' },
    restaurant: { name: 'Chez Laurent', address: '789 Sutter St, Nob Hill', cuisine: 'French', image: cuisineImageMap.French },
    rating: 4,
    dish: 'Duck Confit',
    review: 'Beautifully prepared duck confit with crispy skin and tender meat. The accompanying potatoes were perfectly seasoned. Excellent wine selection too.',
    tip: 'Make a reservation - this place books up weeks in advance!',
    timestamp: '2024-01-12T20:30:00Z',
    likes: 6
  },

  // Mediterranean
  {
    id: '17',
    user: { id: 'user-4', name: 'David Kim', avatar: '' },
    restaurant: { name: 'Mediterranean Delight', address: '321 Irving St, Inner Sunset', cuisine: 'Mediterranean', image: cuisineImageMap.Mediterranean },
    rating: 4,
    dish: 'Lamb Gyros',
    review: 'Fresh and flavorful gyros with perfectly seasoned lamb. The tzatziki was creamy and the vegetables were crisp. Great value for money!',
    timestamp: '2024-01-12T13:15:00Z',
    likes: 5
  },
  {
    id: '18',
    user: { id: 'current-user', name: 'Alex Chen', avatar: '' },
    restaurant: { name: 'Santorini Garden', address: '654 Clement St, Richmond', cuisine: 'Mediterranean', image: cuisineImageMap.Mediterranean },
    rating: 5,
    dish: 'Grilled Octopus',
    review: 'Perfectly grilled octopus with a nice char and tender texture. The lemon and olive oil dressing was simple but perfect. Transport you to the Greek islands!',
    tip: 'Start with the mezze platter - great for sharing and trying multiple dishes.',
    timestamp: '2024-01-11T19:30:00Z',
    likes: 11
  }
];

export const topRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'The Italian Corner',
    address: '123 Main St, Downtown',
    cuisine: 'Italian',
    averageRating: 4.8,
    reviewCount: 24,
    image: cuisineImageMap.Italian
  },
  {
    id: '2',
    name: 'Sushi Zen',
    address: '654 Maple Dr, Downtown',
    cuisine: 'Japanese',
    averageRating: 4.9,
    reviewCount: 18,
    image: cuisineImageMap.Japanese
  },
  {
    id: '3',
    name: 'Dragon Garden',
    address: '789 Pine St, Chinatown',
    cuisine: 'Chinese',
    averageRating: 4.6,
    reviewCount: 31,
    image: cuisineImageMap.Chinese
  },
  {
    id: '4',
    name: 'Burger Palace',
    address: '456 Oak Ave, Midtown',
    cuisine: 'American',
    averageRating: 4.4,
    reviewCount: 15,
    image: cuisineImageMap.American
  },
  {
    id: '5',
    name: 'Casa Guadalajara',
    address: '567 Mission St, Mission District',
    cuisine: 'Mexican',
    averageRating: 4.7,
    reviewCount: 22,
    image: cuisineImageMap.Mexican
  },
  {
    id: '6',
    name: 'Thai Orchid',
    address: '345 Valencia St, Mission',
    cuisine: 'Thai',
    averageRating: 4.5,
    reviewCount: 19,
    image: cuisineImageMap.Thai
  },
  {
    id: '7',
    name: 'Spice Palace',
    address: '678 Fillmore St, Pacific Heights',
    cuisine: 'Indian',
    averageRating: 4.6,
    reviewCount: 27,
    image: cuisineImageMap.Indian
  },
  {
    id: '8',
    name: 'Le Bistro',
    address: '456 Union St, Cow Hollow',
    cuisine: 'French',
    averageRating: 4.8,
    reviewCount: 16,
    image: cuisineImageMap.French
  },
  {
    id: '9',
    name: 'Mediterranean Delight',
    address: '321 Irving St, Inner Sunset',
    cuisine: 'Mediterranean',
    averageRating: 4.3,
    reviewCount: 13,
    image: cuisineImageMap.Mediterranean
  }
];