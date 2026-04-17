import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabaseServer';

/**
 * [Zegal Strategy] 판매자 스트라이프 온보딩 링크 생성 API
 * 1. 유저의 프로필에서 기존 stripe_account_id 확인
 * 2. 없으면 새 Express 계정 생성
 * 3. 온보딩 링크(AccountLink) 생성 후 리턴
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    // 1. 프로필에서 기존 계정 정보 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single();

    let accountId = profile?.stripe_account_id;

    // 2. 기존 계정이 없으면 새로 생성 (Connect Express)
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // 애틀란타 한인 마켓이므로 미국 기준
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          user_id: user.id
        }
      });
      
      accountId = account.id;

      // DB에 계정 ID 저장
      await supabase
        .from('profiles')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id);
    }

    // 3. 온보딩 링크 생성
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?stripe=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error('Stripe onboarding error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
