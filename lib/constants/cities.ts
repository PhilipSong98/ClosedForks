// Common city locations for restaurant search
export interface CityLocation {
  name: string;
  lat: number;
  lng: number;
  country: string;
  countryName: string;
}

export const CITY_LOCATIONS: Record<string, CityLocation> = {
  stockholm: {
    name: 'Stockholm',
    lat: 59.3293,
    lng: 18.0686,
    country: 'se',
    countryName: 'Sweden',
  },
  gothenburg: {
    name: 'Gothenburg',
    lat: 57.7089,
    lng: 11.9746,
    country: 'se',
    countryName: 'Sweden',
  },
  malmo: {
    name: 'Malmö',
    lat: 55.6049,
    lng: 13.0038,
    country: 'se',
    countryName: 'Sweden',
  },
  copenhagen: {
    name: 'Copenhagen',
    lat: 55.6761,
    lng: 12.5683,
    country: 'dk',
    countryName: 'Denmark',
  },
  oslo: {
    name: 'Oslo',
    lat: 59.9139,
    lng: 10.7522,
    country: 'no',
    countryName: 'Norway',
  },
  helsinki: {
    name: 'Helsinki',
    lat: 60.1699,
    lng: 24.9384,
    country: 'fi',
    countryName: 'Finland',
  },
};

export const DEFAULT_CITY = CITY_LOCATIONS.stockholm;

export const getCityByName = (cityName: string): CityLocation | undefined => {
  return CITY_LOCATIONS[cityName.toLowerCase()];
};

export const getCitiesByCountry = (country: string): CityLocation[] => {
  return Object.values(CITY_LOCATIONS).filter(city => city.country === country);
};