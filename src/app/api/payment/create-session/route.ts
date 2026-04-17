import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabaseServer';

/**
 * [Zegal Strategy] 안심결제 세션 생성 API
 * 1. 상품 정보 및 판매자의 stripe_account_id 확인
 * 2. 수수료(3.5%) 계산
 * 3. Stripe Checkout Session 생성 (Destination Charge 방식)
 */
export async function POST(req: Request) {
  try {
    const { itemId, amount, sellerId, roomId } = await req.json();
    const supabase = await createClient();
    const { data: { user: buyer } } = await supabase.auth.getUser();

    if (!buyer) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 1. 판매자의 Stripe 계정 정보 가져오기
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', sellerId)
      .single();

    if (!sellerProfile?.stripe_account_id) {
      return NextResponse.json({ error: '판매자가 결제 시스템을 연동하지 않았습니다.' }, { status: 400 });
    }

    // 2. 수수료 계산 (3.5%)
    const feeAmount = Math.round(amount * 0.035 * 100); // 센트 단위

    // 3. 결제 세션 생성
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '피치 마켓 안심결제 거래',
              description: `아이템 #${itemId} 거래`,
            },
            unit_amount: Math.round(amount * 100), // 달러 -> 센트
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeAmount, // 플랫폼 수익
        transfer_data: {
          destination: sellerProfile.stripe_account_id, // 판매자에게 정산
        },
        // [Zegal Strategy] 즉시 정산되지 않도록 hold 처리 (구매 확정 후 해제 로직은 별도 구현)
        capture_method: 'automatic', // 일단 결제는 완료하되 Payout 스케줄로 제어
        metadata: {
          item_id: itemId,
          buyer_id: buyer.id,
          seller_id: sellerId
        }
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/${roomId}?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/${roomId}?status=cancel`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Stripe session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
