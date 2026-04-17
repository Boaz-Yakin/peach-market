"use client";

import React, { useState, useEffect } from 'react';

const LocalInfoWidget = () => {
  const [exchangeRate, setExchangeRate] = useState('1,380.00');
  const [weather, setWeather] = useState({ temp: '70', status: '로딩 중', icon: '⏳' });

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch('/api/local-info');
        const data = await res.json();
        if (data.weather) {
          setWeather(data.weather);
          setExchangeRate(data.exchangeRate);
        }
      } catch (e) {
        console.error("Local info widget fetch failed", e);
      }
    }
    fetchInfo();
  }, []);

  return (
    <div className="px-4 py-2">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        {/* 날씨 */}
        <div className="flex flex-col items-center gap-1 flex-1 border-r border-gray-50">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Atlanta Weather</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{weather.icon}</span>
            <span className="text-[15px] font-black text-gray-900">{weather.temp}°F</span>
            <span className="text-[11px] text-gray-500 font-medium">{weather.status}</span>
          </div>
        </div>

        {/* 환율 */}
        <div className="flex flex-col items-center gap-1 flex-1 px-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">USD-KRW Exchange</span>
          <div className="flex items-center gap-1">
            <span className="text-[13px] text-gray-400 font-bold">$1 =</span>
            <span className="text-[15px] font-black text-[#ff6b6b]">{exchangeRate}<span className="text-[11px] ml-0.5">원</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalInfoWidget;
