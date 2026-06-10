import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

/**
 * Base64url → Uint8Array 변환 (Web Push applicationServerKey 용)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * 브라우저 푸시 알림 구독/해제를 관리하는 훅.
 *
 * 사용 예:
 * ```tsx
 * const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotification();
 *
 * if (!isSupported) return <p>이 브라우저는 푸시 알림을 지원하지 않습니다.</p>;
 *
 * return (
 *   <button onClick={isSubscribed ? unsubscribe : subscribe} disabled={isLoading}>
 *     {isSubscribed ? "알림 끄기" : "알림 받기"}
 *   </button>
 * );
 * ```
 */
export function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: publicKeyData } = trpc.push.getPublicKey.useQuery();
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    // Service Worker 등록 후 현재 구독 상태 확인
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setIsSubscribed(!!sub);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("[PushNotification] SW 등록 실패:", err);
        setIsLoading(false);
      });
  }, []);

  /** 푸시 알림 구독 요청 */
  async function subscribe() {
    if (!publicKeyData?.publicKey) {
      console.error("[PushNotification] VAPID 공개키를 불러오지 못했습니다.");
      return;
    }
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKeyData.publicKey),
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      await subscribeMutation.mutateAsync({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
      setIsSubscribed(true);
    } catch (err) {
      console.error("[PushNotification] 구독 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }

  /** 푸시 알림 구독 해제 */
  async function unsubscribe() {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("[PushNotification] 구독 해제 실패:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe };
}
