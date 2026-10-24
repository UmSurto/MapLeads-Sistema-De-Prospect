import test from 'node:test';
import assert from 'node:assert/strict';
import { searchLocalBusinesses } from './leadSearchService.ts';

test('Google Maps search requires a location selected by the user', async () => {
  await assert.rejects(
    searchLocalBusinesses({ location: ' ', category: 'Barbearia', apiKey: '' }),
    /Informe a cidade ou região/
  );
});

test('Google Maps search does not return generated businesses without an API key', async () => {
  await assert.rejects(
    searchLocalBusinesses({ location: 'Rio de Janeiro, RJ', category: 'Barbearia', apiKey: '' }),
    /VITE_GOOGLE_MAPS_API_KEY/
  );
});
