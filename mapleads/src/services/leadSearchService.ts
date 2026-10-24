import { Lead, sanitizePhoneForWhatsApp } from '../utils/leads.ts';

interface GooglePlace {
  id?: string;
  displayName?: string | { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteURI?: string;
  location?: {
    lat: () => number;
    lng: () => number;
  };
  rating?: number;
  userRatingCount?: number;
}

interface GooglePlacesLibrary {
  Place?: {
    searchByText?: (request: {
      textQuery: string;
      fields: string[];
      maxResultCount: number;
    }) => Promise<{ places?: GooglePlace[] }>;
  };
}

interface GoogleMapsApi {
  maps?: {
    importLibrary?: (name: 'places') => Promise<GooglePlacesLibrary>;
    places?: GooglePlacesLibrary;
  };
}

type GoogleMapsWindow = Window & {
  google?: GoogleMapsApi;
};

let placesLibraryPromise: Promise<GooglePlacesLibrary> | null = null;

function loadPlacesLibrary(apiKey: string): Promise<GooglePlacesLibrary> {
  const browserWindow = window as GoogleMapsWindow;
  const existingLibrary = browserWindow.google?.maps?.places;
  if (existingLibrary?.Place?.searchByText) return Promise.resolve(existingLibrary);

  const maps = browserWindow.google?.maps;
  if (maps?.importLibrary) return maps.importLibrary('places');
  if (placesLibraryPromise) return placesLibraryPromise;

  placesLibraryPromise = new Promise<GooglePlacesLibrary>((resolve, reject) => {
    const callbackName = `__mapleadsPlacesLoaded_${Date.now()}`;
    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      callback: callbackName,
      libraries: 'places',
      v: 'weekly',
      loading: 'async'
    });

    Reflect.set(browserWindow, callbackName, () => {
      Reflect.deleteProperty(browserWindow, callbackName);
      const library = browserWindow.google?.maps?.places;
      if (library?.Place?.searchByText) {
        resolve(library);
      } else {
        reject(new Error('A API do Google Maps carregou sem disponibilizar a busca de lugares.'));
      }
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      Reflect.deleteProperty(browserWindow, callbackName);
      reject(new Error('Não foi possível carregar a API do Google Maps. Verifique a chave e a conexão.'));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    placesLibraryPromise = null;
    throw error;
  });

  return placesLibraryPromise;
}

function getPlaceName(place: GooglePlace): string {
  if (typeof place.displayName === 'string') return place.displayName;
  return place.displayName?.text || '';
}

export async function searchLocalBusinesses(params: {
  location: string;
  category: string;
  apiKey: string;
}): Promise<Lead[]> {
  const location = params.location.trim();
  const category = params.category.trim();
  if (!location) throw new Error('Informe a cidade ou região para pesquisar.');
  if (!category) throw new Error('Selecione uma categoria para pesquisar.');
  if (!params.apiKey) {
    throw new Error('A chave da API do Google Maps não está configurada. Defina VITE_GOOGLE_MAPS_API_KEY.');
  }

  const placesLibrary = await loadPlacesLibrary(params.apiKey);
  const searchByText = placesLibrary.Place?.searchByText;
  if (!searchByText) throw new Error('A API Places do Google Maps não oferece a busca por texto.');

  const { places } = await searchByText({
    textQuery: `${category} em ${location}`,
    fields: [
      'id',
      'displayName',
      'formattedAddress',
      'nationalPhoneNumber',
      'internationalPhoneNumber',
      'websiteURI',
      'location',
      'rating',
      'userRatingCount'
    ],
    maxResultCount: 20
  });

  return (places || [])
    .filter((place) => getPlaceName(place))
    .map((place, index) => {
      const name = getPlaceName(place);
      const address = place.formattedAddress || location;
      const phoneData = sanitizePhoneForWhatsApp(
        place.internationalPhoneNumber || place.nationalPhoneNumber || ''
      );

      return {
        id: place.id ? `gmp-${place.id}` : `gmp-${index}-${name}`,
        name,
        phone: phoneData.display || 'Não informado',
        rawPhone: phoneData.raw,
        hasWhatsApp: false,
        neighborhood: 'Não identificado',
        city: location,
        hasWebsite: Boolean(place.websiteURI),
        websiteUrl: place.websiteURI || null,
        rating: place.rating || 0,
        userRatingsTotal: place.userRatingCount || 0,
        category,
        address,
        lat: place.location?.lat() || 0,
        lng: place.location?.lng() || 0,
        status: 'novo',
        messageSent: false,
        interest: 'neutro',
        listId: '',
        createdAt: new Date().toISOString()
      };
    });
}
