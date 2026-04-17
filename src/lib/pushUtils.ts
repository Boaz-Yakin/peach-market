export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushSubscription(userId: string, subscription: PushSubscription) {
  const { createClient } = await import('./supabaseBrowser');
  const supabase = createClient();

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      subscription: subscription.toJSON(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,subscription'
    });

  if (error) {
    console.error('Error saving subscription to DB:', error);
  }
}
