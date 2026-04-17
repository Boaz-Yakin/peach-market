import Stripe from 'stripe';

// 배포 시 환경 변수가 없을 경우 빌드가 실패하는 것을 방지하기 위해 런타임 체크로 변경
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-03-25.dahlia', 
  typescript: true,
});
