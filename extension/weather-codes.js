// Shared weather vocabulary for the morning script (Node) and the live page (browser).
// Turns Open-Meteo WMO weather codes into travel-relevant levels: 0 fine, 1 minor, 2 allow extra time, 3 expect disruption.
(function (root) {
  const CODES = {
    0: ['☀️', 'Clear'], 1: ['🌤️', 'Mostly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Overcast'],
    45: ['🌫️', 'Fog'], 48: ['🌫️', 'Freezing fog'],
    51: ['🌦️', 'Light drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌧️', 'Heavy drizzle'],
    56: ['🧊', 'Freezing drizzle'], 57: ['🧊', 'Freezing drizzle'],
    61: ['🌧️', 'Light rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'],
    66: ['🧊', 'Freezing rain'], 67: ['🧊', 'Freezing rain'],
    71: ['🌨️', 'Light snow'], 73: ['🌨️', 'Snow'], 75: ['❄️', 'Heavy snow'], 77: ['🌨️', 'Snow grains'],
    80: ['🌦️', 'Rain showers'], 81: ['🌧️', 'Rain showers'], 82: ['⛈️', 'Violent showers'],
    85: ['🌨️', 'Snow showers'], 86: ['❄️', 'Heavy snow showers'],
    95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Thunderstorm with hail'], 99: ['⛈️', 'Thunderstorm with hail'],
  };
  const SNOW = new Set([71, 73, 75, 77, 85, 86]);
  const ICE = new Set([56, 57, 66, 67]);
  const RAIN = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82]);
  const STORM = new Set([95, 96, 99]);

  function describe(code) {
    const [icon, label] = CODES[code] || ['🌡️', 'Weather unknown'];
    return { icon, label };
  }

  // input: { code, temperature, snowfallNext (cm), precipitationNext (mm) } — "Next" = coming hours.
  function assess({ code, temperature = null, snowfallNext = 0, precipitationNext = 0 }) {
    const { icon, label } = describe(code);
    const cold = Number.isFinite(temperature) && temperature <= 0.5;
    const wet = precipitationNext > 0.1 || RAIN.has(code);
    let level = 0;
    let kind = 'dry';
    let advice = 'No weather impact expected.';
    if (ICE.has(code)) {
      level = 3; kind = 'ice'; advice = 'Freezing rain: pavements, platforms and roads very slippery. Expect slower buses and trams.';
    } else if (SNOW.has(code) || snowfallNext > 0.2) {
      level = snowfallNext >= 5 || code === 75 || code === 86 ? 3 : 2; kind = 'snow';
      advice = level === 3 ? 'Heavy snow: buses and trams likely delayed. Allow 15+ extra minutes.' : `Snow${snowfallNext >= 1 ? ` (~${Math.round(snowfallNext)} cm expected)` : ''}: buses and trams may run slower. Allow ~10 extra minutes.`;
    } else if (cold && wet) {
      level = 2; kind = 'ice'; advice = 'Wet and freezing: icy patches likely on stops and stairs.';
    } else if (STORM.has(code)) {
      level = 2; kind = 'storm'; advice = 'Storms: overhead-line and tree-fall disruptions possible on S-Bahn and trams.';
    } else if (RAIN.has(code) || precipitationNext > 1) {
      level = code === 65 || code === 82 ? 2 : 1; kind = 'rain'; advice = 'Rain: roads busier and buses a little slower.';
    } else if (code === 45 || code === 48) {
      level = 1; kind = 'fog'; advice = 'Fog: road traffic slower.';
    } else if (cold) {
      level = 1; kind = 'frost'; advice = 'Frosty: watch for icy patches on stairs and platforms.';
    }
    return { level, kind, icon, label, advice };
  }

  const api = Object.freeze({ describe, assess });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TransportGapsWeather = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
