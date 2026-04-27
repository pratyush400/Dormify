import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

type PushPayload = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
  badge?: number;
};

type NewListingNotificationInput = {
  actorId: string;
  actorName: string;
  college: string;
  title: string;
  price?: number;
  hall?: string;
  listingId: string;
};

type NewEventNotificationInput = {
  actorId: string;
  actorName: string;
  college: string;
  title: string;
  location?: string;
  when?: Date | null;
  eventId: string;
};

type PreviewNotificationType = 'listing' | 'event' | 'rebrand';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

function chunk<T>(items: T[], size: number) {
  const parts: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    parts.push(items.slice(i, i + size));
  }
  return parts;
}

async function sendExpoPushBatch(messages: PushPayload[]) {
  if (!messages.length) return;

  for (const batch of chunk(messages, 100)) {
    await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });
  }
}

async function getUserPushToken(uid: string) {
  const userSnapshot = await getDoc(doc(db, 'users', uid));
  return userSnapshot.data()?.expoPushToken as string | undefined;
}

async function getCollegePushTokens(college: string, excludeUid: string) {
  if (!college) return [];

  const usersSnapshot = await getDocs(
    query(collection(db, 'users'), where('college', '==', college))
  );

  return usersSnapshot.docs
    .filter((userDoc) => userDoc.id !== excludeUid)
    .map((userDoc) => userDoc.data()?.expoPushToken as string | undefined)
    .filter((token): token is string => !!token);
}

async function getAllPushTokens(excludeUid?: string) {
  const usersSnapshot = await getDocs(collection(db, 'users'));

  return usersSnapshot.docs
    .filter((userDoc) => userDoc.id !== excludeUid)
    .map((userDoc) => userDoc.data()?.expoPushToken as string | undefined)
    .filter((token): token is string => !!token);
}

const LISTING_NOTIFICATION_TEMPLATES = [
  (title: string, priceLabel: string, hallLabel: string) => ({
    title: 'Fresh drop on Obo',
    body: `${title} just landed${priceLabel}${hallLabel}. Claim it now!`,
  }),
  (title: string, priceLabel: string, hallLabel: string) => ({
    title: 'This one might go fast',
    body: `${title}${priceLabel} is up now${hallLabel}. Worth a look.`,
  }),
  (title: string, priceLabel: string, hallLabel: string) => ({
    title: 'We know how stressful finals can be, this might blow off some steam!',
    body: `${title}${priceLabel} is live${hallLabel}. Open Obo before it disappears.`,
  }),
];

const EVENT_NOTIFICATION_TEMPLATES = [
  (title: string, locationLabel: string, timeLabel: string) => ({
    title: 'Something is happening on palatine hill',
    body: `${title}${timeLabel}${locationLabel}. Tap in and see who is going.`,
  }),
  (title: string, locationLabel: string, timeLabel: string) => ({
    title: 'Your campus has plans',
    body: `${title}${locationLabel}${timeLabel}. This looks otterly worth opening!`,
  }),
  (title: string, locationLabel: string, timeLabel: string) => ({
    title: 'New event just dropped',
    body: `${title}${timeLabel}${locationLabel}. Catch the details in Obo.`,
  }),
];

function pickTemplate<T>(templates: T[], seed: string) {
  const index = seed.length % templates.length;
  return templates[index];
}

export async function sendChatNotification(params: {
  receiverId: string;
  senderName: string;
  message: string;
  chatId: string;
}) {
  try {
    const token = await getUserPushToken(params.receiverId);
    if (!token) return;

    await sendExpoPushBatch([
      {
        to: token,
        title: params.senderName,
        body: params.message || 'Sent you a message',
        sound: 'default',
        badge: 1,
        data: {
          type: 'chat',
          chatId: params.chatId,
        },
      },
    ]);
  } catch (error) {
    console.log('Push notification error:', error);
  }
}

export async function sendNewListingNotification(input: NewListingNotificationInput) {
  try {
    const tokens = await getCollegePushTokens(input.college, input.actorId);
    if (!tokens.length) return;

    const priceLabel = typeof input.price === 'number' && !Number.isNaN(input.price)
      ? ` for $${input.price}`
      : '';
    const hallLabel = input.hall ? ` near ${input.hall}` : '';
    const template = pickTemplate(LISTING_NOTIFICATION_TEMPLATES, input.title);
    const { title, body } = template(input.title, priceLabel, hallLabel);

    await sendExpoPushBatch(tokens.map((token) => ({
      to: token,
      title,
      body,
      sound: 'default',
      badge: 1,
      data: {
        type: 'listing',
        listingId: input.listingId,
      },
    })));
  } catch (error) {
    console.log('Listing notification error:', error);
  }
}

export async function sendNewEventNotification(input: NewEventNotificationInput) {
  try {
    const tokens = await getCollegePushTokens(input.college, input.actorId);
    if (!tokens.length) return;

    const locationLabel = input.location ? ` at ${input.location}` : '';
    const timeLabel = input.when
      ? ` on ${input.when.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${input.when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      : '';
    const template = pickTemplate(EVENT_NOTIFICATION_TEMPLATES, input.title);
    const { title, body } = template(input.title, locationLabel, timeLabel);

    await sendExpoPushBatch(tokens.map((token) => ({
      to: token,
      title,
      body,
      sound: 'default',
      badge: 1,
      data: {
        type: 'event',
        eventId: input.eventId,
      },
    })));
  } catch (error) {
    console.log('Event notification error:', error);
  }
}

export async function sendRebrandNotificationToAllUsers(excludeUid?: string) {
  try {
    const tokens = await getAllPushTokens(excludeUid);
    if (!tokens.length) return 0;

    await sendExpoPushBatch(tokens.map((token) => ({
      to: token,
      title: 'Obo is here',
      body: 'Dormify is now Obo. Same campus marketplace, fresh name. Update when you can.',
      sound: 'default',
      badge: 1,
      data: {
        type: 'rebrand',
      },
    })));

    return tokens.length;
  } catch (error) {
    console.log('Rebrand notification error:', error);
    return 0;
  }
}

export async function sendPreviewNotificationToUser(params: {
  receiverId: string;
  type: PreviewNotificationType;
}) {
  try {
    const token = await getUserPushToken(params.receiverId);
    if (!token) return false;

    const payloadByType: Record<PreviewNotificationType, PushPayload> = {
      listing: {
        to: token,
        title: 'Fresh drop on Obo',
        body: 'Vintage mini fridge just landed near Campus. Claim it now!',
        sound: 'default',
        badge: 1,
        data: {
          type: 'listing',
          listingId: 'preview-listing',
        },
      },
      event: {
        to: token,
        title: 'New event just dropped',
        body: 'Sunset study jam tonight at the student center. Catch the details in Obo.',
        sound: 'default',
        badge: 1,
        data: {
          type: 'event',
          eventId: 'preview-event',
        },
      },
      rebrand: {
        to: token,
        title: 'Obo is here',
        body: 'Dormify is now Obo. Same campus marketplace, fresh name. Update when you can.',
        sound: 'default',
        badge: 1,
        data: {
          type: 'rebrand',
        },
      },
    };

    await sendExpoPushBatch([payloadByType[params.type]]);
    return true;
  } catch (error) {
    console.log('Preview notification error:', error);
    return false;
  }
}
