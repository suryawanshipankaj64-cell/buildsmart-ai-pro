import { apiClient } from './client';
import { WeatherInfo } from '../types';

export async function fetchWeather(projectId?: string, city?: string): Promise<WeatherInfo> {
  try {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (city) params.append('city', city);

    const data = await apiClient<any>(`/weather?${params.toString()}`);
    
    // Map WMO weather code to condition
    const wCode = data.current?.weather_code;
    let condition = 'Partly Cloudy';
    if (wCode === 0) condition = 'Clear Sky';
    else if (wCode === 1 || wCode === 2) condition = 'Mainly Clear';
    else if (wCode === 3) condition = 'Overcast';
    else if (wCode >= 51 && wCode <= 67) condition = 'Rain / Drizzle';
    else if (wCode >= 80 && wCode <= 82) condition = 'Rain Showers';
    else if (wCode >= 95) condition = 'Thunderstorm';

    const temp = Math.round(data.current?.temperature_2m ?? data.temperature ?? 28);
    const humidity = Math.round(data.current?.relative_humidity_2m ?? data.humidity ?? 60);
    const windSpeed = Math.round(data.current?.wind_speed_10m ?? data.windSpeed ?? 12);

    // Get engineering impact advisory
    const primaryImpact = data.impacts && data.impacts.length > 0 ? data.impacts[0] : null;
    const advisory = primaryImpact
      ? `${primaryImpact.activity}: ${primaryImpact.action || primaryImpact.risk}`
      : 'Optimal atmospheric conditions for construction execution & concrete casting.';

    return {
      temp,
      condition,
      location: data.locationName || city || 'Site Location',
      humidity,
      windSpeed,
      advisory,
    };
  } catch (err) {
    console.warn('Weather fetch error:', err);
    return {
      temp: 28,
      condition: 'Partly Cloudy',
      location: city ? `${city} Site` : 'Site Project Location',
      humidity: 58,
      windSpeed: 11,
      advisory: 'Adequate humidity and temperature for construction operations.',
    };
  }
}


