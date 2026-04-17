'use client';

import { useState } from 'react';

interface StripeConnectButtonProps {
  stripeAccountId?: string;
  isOnboardingComplete?: boolean;
}

/**
 * [Zegal Strategy] 프리미엄 스트라이프 온보딩 버튼
 * 유저의 온보딩 상태에 따라 다른 라벨과 기능을 제공합니다.
 */
export default function StripeConnectButton({ stripeAccountId, isOnboardingComplete }: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/connect/onboard', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || '연동 링크를 생성하지 못했습니다.');
      }
    } catch (error) {
      console.error('Connect error:', error);
      alert('연결 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = () => {
    if (loading) return '연결 중...';
    if (!stripeAccountId) return '판매자 계좌 연결 (준비 중) 💳';
    if (!isOnboardingComplete) return '정산 설정 (준비 중) 🛠️';
    return '판매자 정산 대시보드 (준비 중) 📊';
  };

  return (
    <button
      onClick={() => alert('피치 안심결제 기능은 곧 조지아주 정식 고시와 함께 찾아옵니다! 🍑 (Comming Soon)')}
      disabled={loading}
      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all active:scale-[0.98] ${
        !isOnboardingComplete 
          ? 'bg-amber-50 border border-amber-100' 
          : 'bg-blue-50 border border-blue-100'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-xl w-6 text-center">
          {!isOnboardingComplete ? '🏧' : '🏦'}
        </span>
        <div className="flex flex-col items-start">
          <span className={`text-[15px] font-bold ${!isOnboardingComplete ? 'text-amber-800' : 'text-blue-800'}`}>
            {getLabel()}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">
            {!isOnboardingComplete 
              ? '안전한 대금 정산을 위해 계좌를 연결해주세요' 
              : 'Stripe를 통해 정산 내역을 관리합니다'}
          </span>
        </div>
      </div>
      <div className="flex items-center text-gray-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </button>
  );
}
