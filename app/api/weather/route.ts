import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get('authorization');

    if (!session?.user && !authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const city = searchParams.get('city');
    let lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    let lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : null;
    let locationName = city || 'Detected Location';

    // 1. Resolve coordinates from city query
    if (city) {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          lat = geoData.results[0].latitude;
          lon = geoData.results[0].longitude;
          locationName = `${geoData.results[0].name}, ${geoData.results[0].admin1 || geoData.results[0].country}`;
        }
      } catch (e) {
        console.warn('Geocoding city error:', e);
      }
    } 
    // 2. Resolve coordinates from active project
    else if (projectId && projectId !== 'custom') {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project) {
        locationName = project.location ? `${project.name} (${project.location})` : project.name;
        lat = project.latitude;
        lon = project.longitude;

        if ((!lat || !lon) && project.location) {
          try {
            const geoRes = await fetch(
              `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(project.location)}&count=1&language=en&format=json`
            );
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              lat = geoData.results[0].latitude;
              lon = geoData.results[0].longitude;
              locationName = `${project.name} · ${geoData.results[0].name}, ${geoData.results[0].admin1 || 'India'}`;

              await prisma.project.update({
                where: { id: projectId },
                data: { latitude: lat, longitude: lon },
              });
            }
          } catch (e) {
            console.warn('Geocoding project error:', e);
          }
        }
      }
    }

    // Default to Indian site coordinates (Kolhapur / Pune region) if coordinates not found
    if (!lat || !lon) {
      lat = 16.7050;
      lon = 74.2433;
      if (!locationName || locationName === 'Detected Location') {
        locationName = 'Site Location (Kolhapur Region)';
      }
    }

    // 3. Fetch comprehensive Open-Meteo telemetry
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
    const res = await fetch(weatherUrl);
    const weatherData = await res.json();

    const current = weatherData.current;
    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const wind = current.wind_speed_10m;
    const rain = current.precipitation;

    // 4. Engineering Impact Analysis Logic
    const impacts = [];

    // Concrete & Curing impact
    if (temp > 38) {
      impacts.push({
        activity: 'Concrete Pouring & Curing',
        status: 'CRITICAL',
        risk: 'Rapid Moisture Loss & Thermal Cracking',
        action: 'Suspend slab casting during peak hours. Use chilled batch water, retarders, and wet curing blankets immediately.',
      });
    } else if (temp < 5) {
      impacts.push({
        activity: 'Concrete Pouring & Curing',
        status: 'WARNING',
        risk: 'Delayed Setting & Frost Damage',
        action: 'Use accelerating admixtures, insulate formwork, and maintain artificial heating above 10°C.',
      });
    } else {
      impacts.push({
        activity: 'Concrete Pouring & Curing',
        status: 'OPTIMAL',
        risk: 'Nominal hydration rate',
        action: 'Conditions suitable for casting. Maintain standard 7-to-14-day ponding/curing protocol.',
      });
    }

    // Crane & High-Altitude Work impact
    if (wind >= 45) {
      impacts.push({
        activity: 'Tower Cranes & Scaffolding',
        status: 'CRITICAL',
        risk: 'Boom Structural Overload / Fall Hazards',
        action: 'IMMEDIATE STOP. Weathervane crane jibs, halt suspended cradle work, and secure loose materials.',
      });
    } else if (wind >= 30) {
      impacts.push({
        activity: 'Tower Cranes & Scaffolding',
        status: 'WARNING',
        risk: 'Swinging Loads & Instability',
        action: 'Limit boom reach, avoid hoisting wide surface-area panels (glazing/plywood), and verify taglines.',
      });
    } else {
      impacts.push({
        activity: 'Tower Cranes & Scaffolding',
        status: 'OPTIMAL',
        risk: 'Safe aerodynamic thresholds',
        action: 'Safe for tower crane operations and scaffolding erection.',
      });
    }

    // Earthwork & Excavation impact
    if (rain > 5 || current.weather_code >= 51) {
      impacts.push({
        activity: 'Excavation & Trenching',
        status: 'CRITICAL',
        risk: 'Slope Collapse & Mud Waterlogging',
        action: 'Halt earthmoving. Cover exposed trenches, position dewatering pumps, and monitor shoring integrity.',
      });
    } else {
      impacts.push({
        activity: 'Excavation & Trenching',
        status: 'OPTIMAL',
        risk: 'Dry soil stability',
        action: 'Normal earthmoving and compaction can proceed.',
      });
    }

    // Painting, Plastering & Waterproofing impact
    if (rain > 0 || humidity > 85) {
      impacts.push({
        activity: 'External Plaster & Painting',
        status: 'CRITICAL',
        risk: 'Blistering, Washout & Poor Adhesion',
        action: 'Postpone external facade coatings, primer application, and cement plaster finishing until dry.',
      });
    } else {
      impacts.push({
        activity: 'External Plaster & Painting',
        status: 'OPTIMAL',
        risk: 'Adequate drying times',
        action: 'Ideal atmospheric conditions for paint adhesion and exterior finishing.',
      });
    }

    return NextResponse.json({
      locationName,
      latitude: lat,
      longitude: lon,
      current,
      daily: weatherData.daily,
      impacts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to process weather metrics' }, { status: 500 });
  }
}