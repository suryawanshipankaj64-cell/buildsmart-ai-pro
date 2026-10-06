'use client';

import { useState, useEffect } from 'react';
import { 
  CloudSun, 
  MapPin, 
  Search, 
  Navigation, 
  Droplets, 
  Wind, 
  CloudRain, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HardHat,
  Calendar,
  Sun,
  Cloud,
  RefreshCw,
  Info,
  ShieldCheck,
  Zap,
  Hammer
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface Impact {
  activity: string;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  risk: string;
  action: string;
}

function getWeatherDescription(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear Sky', icon: '☀️' };
  if (code === 1 || code === 2) return { label: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { label: 'Overcast', icon: '☁️' };
  if (code >= 45 && code <= 48) return { label: 'Foggy / Hazy', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { label: 'Rain Showers', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { label: 'Snow / Hail', icon: '❄️' };
  if (code >= 80 && code <= 82) return { label: 'Heavy Downpour', icon: '⛈️' };
  if (code >= 95) return { label: 'Thunderstorm', icon: '⚡' };
  return { label: 'Moderate Weather', icon: '🌤️' };
}

function getDaySuitability(maxTemp: number, rain: number, maxWind: number) {
  if (rain > 5) {
    return { label: 'Rain Alert', status: 'CRITICAL', desc: 'Protect cement & halt open trenching' };
  }
  if (maxWind > 35) {
    return { label: 'High Wind', status: 'WARNING', desc: 'Restrict crane & scaffolding lifts' };
  }
  if (maxTemp > 38) {
    return { label: 'Extreme Heat', status: 'WARNING', desc: 'Early morning concrete pours only' };
  }
  return { label: 'Optimal Work', status: 'OPTIMAL', desc: 'All civil trades safe to proceed' };
}

export default function WeatherPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [cityInput, setCityInput] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
          if (data.length > 0) {
            setSelectedProject(data[0].id);
            fetchTelemetry(`/api/weather?projectId=${data[0].id}`);
          }
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    }
    loadProjects();
  }, []);

  async function fetchTelemetry(url: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch weather telemetry');
      setWeatherData(data);
    } catch (err: any) {
      setError(err.message);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleUseLiveGPS() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedProject('custom');
        fetchTelemetry(`/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      },
      () => {
        setError('Location access denied. Enter a city manually.');
        setLoading(false);
      }
    );
  }

  function handleCitySearch(e: React.FormEvent) {
    e.preventDefault();
    if (!cityInput.trim()) return;
    setSelectedProject('custom');
    fetchTelemetry(`/api/weather?city=${encodeURIComponent(cityInput.trim())}`);
  }

  function handleRefresh() {
    if (selectedProject && selectedProject !== 'custom') {
      fetchTelemetry(`/api/weather?projectId=${selectedProject}`);
    } else if (cityInput.trim()) {
      fetchTelemetry(`/api/weather?city=${encodeURIComponent(cityInput.trim())}`);
    }
  }

  const dailyForecast = weatherData?.daily?.time ? weatherData.daily.time.map((t: string, idx: number) => {
    const dateObj = new Date(t);
    const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const maxTemp = Math.round(weatherData.daily.temperature_2m_max?.[idx] || 0);
    const minTemp = Math.round(weatherData.daily.temperature_2m_min?.[idx] || 0);
    const rainSum = weatherData.daily.precipitation_sum?.[idx] || 0;
    const maxWind = Math.round(weatherData.daily.wind_speed_10m_max?.[idx] || 0);
    const code = weatherData.daily.weather_code?.[idx] || 0;
    const cond = getWeatherDescription(code);
    const suitability = getDaySuitability(maxTemp, rainSum, maxWind);

    return {
      t,
      dayName,
      formattedDate,
      maxTemp,
      minTemp,
      rainSum,
      maxWind,
      cond,
      suitability,
    };
  }) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6 text-paper">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-blueprint-line pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <CloudSun className="text-signal-teal" size={26} /> Weather & Construction Impact
          </h1>
          <p className="text-xs text-signal-slate">
            Real-time telemetry and site operation constraints based on local atmospheric thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              if (e.target.value !== 'custom') {
                fetchTelemetry(`/api/weather?projectId=${e.target.value}`);
              }
            }}
            className="rounded-lg border border-blueprint-line bg-navy-900 px-3 py-2 text-xs text-paper focus:border-signal-teal focus:outline-none font-mono"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="custom">Custom City / GPS</option>
          </select>

          <button
            onClick={handleUseLiveGPS}
            className="flex items-center gap-1.5 rounded-lg border border-blueprint-line bg-navy-900 px-3 py-2 text-xs font-medium text-paper hover:border-signal-teal transition"
          >
            <Navigation size={13} className="text-signal-teal" /> Live GPS
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh weather telemetry"
            className="flex items-center gap-1.5 rounded-lg border border-blueprint-line bg-navy-900 px-2.5 py-2 text-xs font-medium text-signal-slate hover:text-paper hover:border-signal-teal transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-signal-teal' : ''} />
          </button>
        </div>
      </div>

      {/* City Lookup */}
      <form onSubmit={handleCitySearch} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-2.5 text-signal-slate" size={16} />
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Type any city (e.g. Kolhapur, Sangli, Pune, Mumbai, Bengaluru, Dubai)..."
            className="w-full rounded-lg border border-blueprint-line bg-navy-900 py-2 pl-9 pr-4 text-sm text-paper focus:border-signal-teal focus:outline-none placeholder:text-signal-slate/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !cityInput.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-signal-teal px-4 py-2 text-xs font-semibold text-navy-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Search size={14} /> Analyze
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-12 text-sm text-signal-slate gap-2">
          <Loader2 className="animate-spin text-signal-teal" size={20} /> Fetching atmospheric telemetry radar...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-signal-coral/30 bg-signal-coral/10 p-4 text-xs text-signal-coral flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {weatherData && !loading && (
        <div className="space-y-6">
          {/* Telemetry Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-signal-slate font-mono">LOCATION</span>
                <h3 className="text-lg font-bold text-paper mt-0.5 truncate">{weatherData.locationName}</h3>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-paper font-display">{Math.round(weatherData.current.temperature_2m)}°C</span>
                <span className="text-xs text-signal-slate block mt-0.5 font-mono">Feels like {Math.round(weatherData.current.apparent_temperature)}°C</span>
              </div>
            </div>

            <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-signal-slate">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">WIND VELOCITY</span>
                <Wind size={16} className="text-signal-teal" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-paper font-display">{weatherData.current.wind_speed_10m}</span>
                <span className="text-xs text-signal-slate ml-1 font-mono">km/h</span>
                <span className="text-xs text-signal-slate block mt-0.5 font-mono">Gusts: {weatherData.current.wind_gusts_10m || weatherData.current.wind_speed_10m} km/h</span>
              </div>
            </div>

            <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-signal-slate">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">RELATIVE HUMIDITY</span>
                <Droplets size={16} className="text-signal-teal" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-paper font-display">{weatherData.current.relative_humidity_2m}%</span>
                <span className="text-xs text-signal-slate block mt-0.5 font-mono">
                  {weatherData.current.relative_humidity_2m > 85 ? 'High saturation (Hydration lock)' : 'Hydration equilibrium'}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-signal-slate">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono">PRECIPITATION</span>
                <CloudRain size={16} className="text-signal-teal" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-paper font-display">{weatherData.current.precipitation}</span>
                <span className="text-xs text-signal-slate ml-1 font-mono">mm</span>
                <span className="text-xs text-signal-slate block mt-0.5 font-mono">
                  {weatherData.current.precipitation > 0 ? 'Active rain on site' : 'Dry ground conditions'}
                </span>
              </div>
            </div>
          </div>

          {/* Project Impact & Site Advisories */}
          <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5">
            <div className="flex items-center justify-between mb-3 border-b border-blueprint-line/60 pb-2.5">
              <h2 className="text-sm font-bold text-paper flex items-center gap-2">
                <HardHat size={16} className="text-signal-teal" /> Project Impact & Site Advisories
              </h2>
              <span className="text-[10px] font-mono text-signal-slate">
                Automated Civil Engineering Directives
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weatherData.impacts.map((item: Impact, idx: number) => {
                const isCrit = item.status === 'CRITICAL';
                const isWarn = item.status === 'WARNING';

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 transition-all ${
                      isCrit
                        ? 'border-signal-coral/40 bg-signal-coral/10'
                        : isWarn
                        ? 'border-signal-amber/40 bg-signal-amber/10'
                        : 'border-blueprint-line bg-navy-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-paper">{item.activity}</h4>
                      <span
                        className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                          isCrit
                            ? 'bg-signal-coral/20 text-signal-coral'
                            : isWarn
                            ? 'bg-signal-amber/20 text-signal-amber'
                            : 'bg-signal-teal/20 text-signal-teal'
                        }`}
                      >
                        {isCrit && <XCircle size={12} />}
                        {isWarn && <AlertTriangle size={12} />}
                        {!isCrit && !isWarn && <CheckCircle2 size={12} />}
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-paper/90 mb-1">
                      <span className="text-signal-slate font-normal">Risk: </span>
                      {item.risk}
                    </p>
                    <p className="text-xs text-signal-slate">
                      <span className="text-paper/80 font-medium">Directive: </span>
                      {item.action}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-Day Construction Weather & Operation Forecast */}
          {dailyForecast.length > 0 && (
            <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-blueprint-line/60 pb-2.5">
                <h2 className="text-sm font-bold text-paper flex items-center gap-2">
                  <Calendar size={16} className="text-signal-teal" /> 7-Day Construction Weather Forecast & Trade Suitability
                </h2>
                <span className="text-[10px] font-mono text-signal-slate">
                  Daily Atmospheric Workability
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {dailyForecast.map((day: any, i: number) => {
                  const isCrit = day.suitability.status === 'CRITICAL';
                  const isWarn = day.suitability.status === 'WARNING';

                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${
                        isCrit
                          ? 'border-signal-coral/40 bg-signal-coral/10'
                          : isWarn
                          ? 'border-signal-amber/40 bg-signal-amber/10'
                          : i === 0
                          ? 'border-signal-teal/50 bg-navy-950'
                          : 'border-blueprint-line bg-navy-950/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-paper font-mono">{day.dayName}</span>
                          <span className="text-base">{day.cond.icon}</span>
                        </div>
                        <span className="text-[10px] font-mono text-signal-slate block">{day.formattedDate}</span>

                        <div className="my-2 text-center">
                          <div className="text-base font-extrabold text-paper font-display">
                            {day.maxTemp}°<span className="text-xs font-normal text-signal-slate"> / {day.minTemp}°</span>
                          </div>
                          <span className="text-[10px] text-signal-slate font-mono block truncate mt-0.5">
                            {day.cond.label}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-blueprint-line/40 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-signal-slate">
                          <span>Rain:</span>
                          <span className={day.rainSum > 0 ? 'text-signal-coral font-bold' : 'text-paper'}>
                            {day.rainSum} mm
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-signal-slate">
                          <span>Wind:</span>
                          <span className="text-paper">{day.maxWind} km/h</span>
                        </div>

                        <div className="pt-1">
                          <span
                            className={`block text-center rounded px-1 py-0.5 text-[9px] font-mono font-bold truncate ${
                              isCrit
                                ? 'bg-signal-coral/20 text-signal-coral'
                                : isWarn
                                ? 'bg-signal-amber/20 text-signal-amber'
                                : 'bg-signal-teal/20 text-signal-teal'
                            }`}
                            title={day.suitability.desc}
                          >
                            {day.suitability.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Construction Threshold Reference Guide */}
          <div className="rounded-xl border border-blueprint-line/60 bg-navy-950/80 p-4">
            <div className="flex items-center gap-2 mb-2 text-signal-teal text-xs font-bold font-mono uppercase">
              <Info size={14} /> Civil Engineering Weather Threshold Reference
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-signal-slate">
              <div className="rounded-lg bg-navy-900 border border-blueprint-line/40 p-2.5">
                <span className="font-bold text-paper block mb-0.5">🏗️ Concrete Casting</span>
                <span>Safe: 5°C - 38°C. Above 38°C causes rapid slump loss & dehydration.</span>
              </div>
              <div className="rounded-lg bg-navy-900 border border-blueprint-line/40 p-2.5">
                <span className="font-bold text-paper block mb-0.5">🗼 Tower Cranes</span>
                <span>Max safe gust: 35 km/h. Above 45 km/h mandates immediate jib lock.</span>
              </div>
              <div className="rounded-lg bg-navy-900 border border-blueprint-line/40 p-2.5">
                <span className="font-bold text-paper block mb-0.5">🚜 Earthwork & Pit</span>
                <span>Rain &gt; 5mm causes slope saturation and mud waterlogging.</span>
              </div>
              <div className="rounded-lg bg-navy-900 border border-blueprint-line/40 p-2.5">
                <span className="font-bold text-paper block mb-0.5">🎨 Paint & Plaster</span>
                <span>Humidity &gt; 85% causes moisture trapping & coat blistering.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}