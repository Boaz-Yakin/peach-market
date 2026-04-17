"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabaseBrowser";
import { urlBase64ToUint8Array, registerPushSubscription } from "@/lib/pushUtils";

const VAPID_PUBLIC_KEY = "BAjvsWzBSn9KnLzUI3W1AJjT-seLtNpxqeZ5OfY4P5i0CDRLnkEH5V9wagfcrFjdaVMKcT1XFitTd8KbhVHgn3g";

export default function PushManager() {
  const supabase = createClient();

  useEffect(() => {
    async function initPush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push notifications are not supported in this browser.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // 1. Service Worker 등록
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // 2. 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Notification permission denied.");
          return;
        }

        // 3. 구독 생성
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // 4. DB에 저장
        await registerPushSubscription(user.id, subscription);
        console.log("Push subscription registered successfully.");
      } catch (error) {
        console.error("Error initializing Push Notifications:", error);
      }
    }

    initPush();
  }, [supabase]);

  return null; // UI 없이 로직만 수행
}
