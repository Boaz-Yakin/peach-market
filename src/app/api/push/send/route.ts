import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabaseServer';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
  'mailto:boazn@example.com', // 대표님 이메일 또는 관리자 이메일
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(request: Request) {
  try {
    const { userId, title, body, url } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // 1. 해당 유저의 모든 구독 정보 가져오기
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (error || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    // 2. 모든 구독 기기에 푸시 전송
    const pushPromises = subscriptions.map((sub: any) => 
      webpush.sendNotification(
        sub.subscription,
        JSON.stringify({ title, body, url: url || '/' })
      ).catch(err => {
        console.error('Push error:', err);
        // 만약 구독이 만료되었다면 DB에서 삭제하는 로직 추가 가능
        if (err.statusCode === 410 || err.statusCode === 404) {
          // 삭제 로직 (생략 가능하나 권장)
        }
      })
    );

    await Promise.all(pushPromises);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Push error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
