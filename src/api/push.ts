import { API_BASE } from './base';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding)
		.replace(/-/g, '+')
		.replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
	for (let i = 0; i < rawData.length; i++) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

export async function subscribeToPush(token: string): Promise<void> {
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
		return;
	}

	const permission = await Notification.requestPermission();
	if (permission !== 'granted') {
		return;
	}

	const registration = await navigator.serviceWorker.ready;

	let subscription = await registration.pushManager.getSubscription();
	if (!subscription) {
		const res = await fetch(`${API_BASE}/push/vapid-public-key`);
		const { public_key } = await res.json();
		if (!public_key) {
			return;
		}
		subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(public_key),
		});
	}

	await fetch(`${API_BASE}/push/subscribe`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(subscription),
	});
}
