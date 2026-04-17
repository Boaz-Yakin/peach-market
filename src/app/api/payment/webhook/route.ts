import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabaseServer';
import { headers } from 'next/headers';

/**
 * [Zegal Strategy] 결제 완료 및 상태 동기화 웹훅
 * Stripe로부터 결제 성공 이벤트를 받아 DB(transactions) 상태를 'paid'로 전환합니다.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature');

  let event;

  try {
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Webhook Signature or Secret missing.');
    }
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = await createClient();

  // 자금의 흐름이 성공적으로 확보되었을 때
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const { item_id, buyer_id, seller_id } = session.metadata;

    // 1. Transactions 테이블 업데이트 (에스크로 보관 시작)
    const { error } = await supabase
      .from('transactions')
      .insert({
        item_id,
        buyer_id,
        seller_id,
        amount: session.amount_total / 100, // 센트 -> 달러
        status: 'paid', // 결제 완료 (보관 중)
        stripe_payment_intent: session.payment_intent
      });

    if (error) {
      console.error('DB Update Error in Webhook:', error);
      return NextResponse.json({ error: 'DB sync failed' }, { status: 500 });
    }

    // 2. 채팅방에 시스템 메시지 또는 알림 전송 (옵션)
    console.log(`[Stripe Webhook] Transaction successful for item ${item_id}`);
  }

  return NextResponse.json({ received: true });
}
