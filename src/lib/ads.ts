export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  category: string;
  isPremium?: boolean;
}

export const MOCK_ADS: Ad[] = [
  {
    id: 'ad-1',
    title: '꿀돼지 BBQ 아틀란타 - 회식 환영!',
    description: '아틀란타 최고의 삼겹살! 단체 예약 시 프리미엄 된장찌개 서비스.',
    imageUrl: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=600&auto=format&fit=crop', // K-BBQ 느낌
    linkUrl: 'https://www.google.com/search?q=honey+pig+atlanta',
    category: '맛집/식당',
    isPremium: true
  },
  {
    id: 'ad-2',
    title: '아틀란타 부동산 No.1 제이슨 리',
    description: '둘루스, 잔스크릭 전문. 내 집 마련의 꿈, 전문가와 상의하세요.',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop', // Real Estate 느낌
    linkUrl: 'https://www.google.com/search?q=atlanta+realtor',
    category: '부동산/비즈니스',
    isPremium: true
  },
  {
    id: 'ad-3',
    title: '피치 보바 - 한여름 시원한 모모 스무디!',
    description: '신선한 복숭아로 만든 펄 가득 스무디. 피치마켓 회원 10% 할인.',
    imageUrl: 'https://images.unsplash.com/photo-1540304453526-64c05e9ef0c6?q=80&w=600&auto=format&fit=crop', // Peach drink 느낌
    linkUrl: 'https://www.google.com/search?q=atlanta+boba+tea',
    category: '카페/음료'
  }
];
