import axios from 'axios';

const urlBase64ToUint8Array = (base64String) => {
  const str = base64String.trim();
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPush = async () => {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported');
    return;
  }

  if (!('PushManager' in window)) {
    console.error('Push Manager not supported');
    return;
  }

  try {
    // 1. Register Service Worker
    const register = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker Registered');

    // 2. Get Public Key from server
    const token = localStorage.getItem('token');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications/vapid-public-key`, {
      headers: { 'x-auth-token': token }
    });
    const publicKey = response.data?.publicKey || response.data;

    if (!publicKey || typeof publicKey !== 'string') {
        console.error('Failed to retrieve VAPID public key from server');
        return;
    }

    // 3. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    // 4. Subscribe
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    console.log('Push Subscribed');

    // 5. Send subscription to server
    await axios.post(`${import.meta.env.VITE_API_URL}/api/notifications/subscribe`, subscription, {
      headers: { 'x-auth-token': token }
    });
    console.log('Subscription sent to server');

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
  }
};
