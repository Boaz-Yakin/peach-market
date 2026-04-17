import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 실제로는 DB에서 가져와야 하지만, 현재는 대표 이벤트 1건에 대한 하드코딩된 프리미엄 디자인 노출
  const event = {
    title: "🍑 조지아 피치 마켓 첫 오프라인 밋업!",
    date: "2026년 4월 25일 (토) 오후 2:00",
    location: "Duluth H-Mart 앞 광장 (2108 Pleasant Hill Rd)",
    description: `애틀란타 한인 커뮤니티의 새로운 정을 만드는 피치 마켓이 첫 번째 오프라인 만남을 가집니다! 
    
    온라인에서만 보던 이웃들과 직접 만나고, 소소한 나눔 장터와 피치 굿즈 증정 이벤트에도 참여해 보세요. 조지아의 따뜻한 봄날, 피치 마켓이 시원한 커피 한 잔 대접하겠습니다.`,
    benefits: [
      "피치 마켓 한정판 에코백 증정 (선착순 50명)",
      "현장 안심결제 체험 시 당도 포인트 +5.0 보너스",
      "애틀란타 지역 명물 맛집 쿠폰 추첨"
    ],
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800"
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-4">
        <Link href="/community" className="p-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Link>
        <h1 className="text-[17px] font-black text-gray-900">이벤트 상세</h1>
      </div>

      {/* Hero Image */}
      <div className="relative h-[240px] w-full">
        <Image src={event.image} alt="Event Hero" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <span className="bg-[#ff6b6b] text-white text-[11px] font-black px-3 py-1 rounded-full mb-3 inline-block uppercase tracking-wider">
            Official Event
          </span>
          <h2 className="text-white text-[24px] font-black leading-tight">
            {event.title}
          </h2>
        </div>
      </div>

      {/* Info Sections */}
      <div className="px-6 py-8">
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
              📅
            </div>
            <div>
              <p className="text-[13px] text-gray-400 font-bold mb-1">일시</p>
              <p className="text-[16px] text-gray-900 font-black">{event.date}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
              📍
            </div>
            <div>
              <p className="text-[13px] text-gray-400 font-bold mb-1">장소</p>
              <p className="text-[16px] text-gray-900 font-black">{event.location}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-10">
          <h3 className="text-[18px] font-black text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#ff6b6b] rounded-full" />
            이벤트 소개
          </h3>
          <p className="text-[15px] text-gray-600 font-medium leading-[1.8] whitespace-pre-wrap">
            {event.description}
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-10">
          <h3 className="text-[16px] font-black text-gray-900 mb-4">참가 시 혜택 🎁</h3>
          <ul className="flex flex-col gap-4">
            {event.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full" />
                <span className="text-[14px] text-gray-700 font-bold">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RSVP Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-50">
        <div className="max-w-md mx-auto">
          <button 
            onClick={() => alert("참가 신청이 접수되었습니다! 행사 당일에 뵙겠습니다. 🍑")}
            className="w-full py-4 bg-[#ff6b6b] text-white rounded-2xl font-black text-[16px] shadow-lg shadow-[#ff6b6b]/30 active:scale-[0.98] transition-all"
          >
            참가 신청하기
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
