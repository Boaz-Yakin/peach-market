import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

/**
 * 애틀란타 현지 정보 (날씨, 환율, 기름값) API
 * - 무료 API 사용 (OpenWeatherMap, Frankfurter)
 * - 서버 사이드 캐싱 적용 (1시간 주기)
 */

export async function GET() {
  const supabase = await createClient();
  
  try {
    // 1. 캐시 확인 (로컬 정보는 DB에 'local_info_cache' 라는 이름으로 관리)
    const { data: cache } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'atlanta_local_info')
      .single();

    const now = new Date();
    const cacheExpiry = 60 * 60 * 1000; // 1시간 캐시

    if (cache && (now.getTime() - new Date(cache.updated_at).getTime() < cacheExpiry)) {
      return NextResponse.json(cache.value);
    }

    // 2. 캐시 만료되었거나 없을 경우 새로운 데이터 페치
    // A. 날씨 (OpenWeatherMap - API Key 필요하므로 Placeholder 처리)
    let weatherData = { temp: '75', status: '맑음', icon: '☀️' };
    const weatherKey = process.env.OPENWEATHER_API_KEY;
    
    if (weatherKey) {
      try {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Atlanta&units=imperial&appid=${weatherKey}&lang=kr`
        );
        const wJson = await weatherRes.json();
        if (wJson.main) {
          weatherData = {
            temp: Math.round(wJson.main.temp).toString(),
            status: wJson.weather[0].description,
            icon: getWeatherIcon(wJson.weather[0].icon)
          };
        }
      } catch (e) {
        console.error("Weather fetch error", e);
      }
    }

    // B. 환율 (Frankfurter - Key 필요 없음)
    let exchangeRate = '1,380';
    try {
      const fxRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=KRW');
      const fxJson = await fxRes.json();
      if (fxJson.rates && fxJson.rates.KRW) {
        exchangeRate = fxJson.rates.KRW.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
      }
    } catch (e) {
      console.error("FX fetch error", e);
    }

    // C. 기름값 (Mock - 조지아 평균값 고정/반수동 관리 권장)
    const gasPrice = '3.25';

    const result = {
      weather: weatherData,
      exchangeRate: exchangeRate,
      updatedAt: now.toISOString()
    };

    // 3. DB에 캐시 저장 (upsert)
    await supabase
      .from('system_settings')
      .upsert({ 
        key: 'atlanta_local_info', 
        value: result, 
        updated_at: now.toISOString() 
      }, { onConflict: 'key' });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Local Info API Error:", error);
    return NextResponse.json({ 
      weather: { temp: '70', status: '정보없음', icon: '❓' },
      exchangeRate: '1,380'
    });
  }
}

function getWeatherIcon(iconCode: string) {
  const map: any = {
    '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️', 
    '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️'
  };
  return map[iconCode.substring(0,2)] || '☀️';
}
