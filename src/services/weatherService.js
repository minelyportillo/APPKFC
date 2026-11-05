const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getSanSalvadorWeather() {
  const params = new URLSearchParams({
    latitude: '13.6929',
    longitude: '-89.2182',
    current: 'temperature_2m,relative_humidity_2m,weather_code'
  });
  const response = await fetch(`${WEATHER_URL}?${params}`);

  if (!response.ok) {
    throw new Error('No se pudo consultar el clima. Inténtalo de nuevo.');
  }

  const data = await response.json();
  if (!data.current) {
    throw new Error('La API no devolvió datos meteorológicos.');
  }

  return data;
}
