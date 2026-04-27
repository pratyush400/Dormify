import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export type EntryType =
  | 'signup'
  | 'postedListing'
  | 'igShare'
  | 'referralGiven'
  | 'referralReceived';

export type EntriesMap = {
  signup: number;
  postedListing: number;
  igShare: number;
  referralsGiven: number;
  referralsReceived: number;
};

export const ZERO_ENTRIES: EntriesMap = {
  signup: 0,
  postedListing: 0,
  igShare: 0,
  referralsGiven: 0,
  referralsReceived: 0,
};

export function totalEntries(e?: Partial<EntriesMap> | null): number {
  if (!e) return 0;
  return (
    (e.signup ?? 0) +
    (e.postedListing ?? 0) +
    (e.igShare ?? 0) +
    (e.referralsGiven ?? 0) +
    (e.referralsReceived ?? 0)
  );
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, '');
}

/** Find a user by username (case-insensitive). Returns uid or null. */
export async function findUserByUsername(rawUsername: string): Promise<{ uid: string; username: string } | null> {
  const username = normalizeUsername(rawUsername);
  if (!username) return null;

  // Try usernameLower first (new field), fall back to legacy `username` exact match.
  const lowerSnap = await getDocs(
    query(collection(db, 'users'), where('usernameLower', '==', username), limit(1))
  );
  if (!lowerSnap.empty) {
    const d = lowerSnap.docs[0];
    return { uid: d.id, username: (d.data().username ?? username) as string };
  }
  const exactSnap = await getDocs(
    query(collection(db, 'users'), where('username', '==', username), limit(1))
  );
  if (!exactSnap.empty) {
    const d = exactSnap.docs[0];
    return { uid: d.id, username: (d.data().username ?? username) as string };
  }
  return null;
}

/**
 * Apply a referral after a new user account has been created.
 * Grants +1 to the new user (referralsReceived) and +1 to the referrer (referralsGiven),
 * inside a transaction so concurrent signups can't double-count.
 * Self-referrals are blocked.
 */
export async function applyReferral(params: {
  newUserUid: string;
  referrerUid: string;
}): Promise<void> {
  const { newUserUid, referrerUid } = params;
  if (!newUserUid || !referrerUid || newUserUid === referrerUid) return;

  const newUserRef = doc(db, 'users', newUserUid);
  const referrerRef = doc(db, 'users', referrerUid);

  await runTransaction(db, async (tx) => {
    const newUserSnap = await tx.get(newUserRef);
    if (!newUserSnap.exists()) throw new Error('New user doc missing');
    const newUserData = newUserSnap.data() as any;
    if (newUserData.referredBy) return; // already applied

    tx.update(newUserRef, {
      referredBy: referrerUid,
      'entries.referralsReceived': increment(1),
    });
    tx.update(referrerRef, {
      'entries.referralsGiven': increment(1),
    });
  });

  // Append-only ledger for audit / disputes.
  await addDoc(collection(db, 'entryEvents'), {
    type: 'referralReceived',
    uid: newUserUid,
    sourceUid: referrerUid,
    ts: serverTimestamp(),
  });
  await addDoc(collection(db, 'entryEvents'), {
    type: 'referralGiven',
    uid: referrerUid,
    sourceUid: newUserUid,
    ts: serverTimestamp(),
  });
}

/** Grant a one-time entry of a given type to a user. Idempotent via the entries map. */
export async function grantOneTimeEntry(uid: string, type: 'postedListing' | 'igShare'): Promise<boolean> {
  if (!uid) return false;
  const userRef = doc(db, 'users', uid);
  let granted = false;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) return;
    const data = snap.data() as any;
    const current = (data.entries?.[type] ?? 0) as number;
    if (current > 0) return;
    tx.update(userRef, {
      [`entries.${type}`]: 1,
    });
    granted = true;
  });
  if (granted) {
    await addDoc(collection(db, 'entryEvents'), {
      type,
      uid,
      ts: serverTimestamp(),
    });
  }
  return granted;
}

/**
 * Backfill entries for an existing user who signed up before the raffle shipped.
 * Idempotent — only runs if `entries` is missing on the user doc.
 * Grants signup, plus postedListing if they have any listings.
 */
export async function backfillEntriesIfNeeded(uid: string): Promise<void> {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  const { getDoc, getDocs: gd, query: q, collection: col, where: w, updateDoc, limit: lim } =
    await import('firebase/firestore');

  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data() as any;
  if (data.entries) return; // already backfilled

  const listingsSnap = await gd(
    q(col(db, 'listings'), w('sellerId', '==', uid), lim(1))
  );
  const hasListing = !listingsSnap.empty;

  const entries = {
    ...ZERO_ENTRIES,
    signup: 1,
    postedListing: hasListing ? 1 : 0,
  };

  await updateDoc(userRef, {
    entries,
    usernameLower: data.usernameLower ?? (data.username ?? '').toLowerCase(),
  });

  await addDoc(collection(db, 'entryEvents'), {
    type: 'signup',
    uid,
    backfill: true,
    ts: serverTimestamp(),
  });
  if (hasListing) {
    await addDoc(collection(db, 'entryEvents'), {
      type: 'postedListing',
      uid,
      backfill: true,
      ts: serverTimestamp(),
    });
  }
}

export const RAFFLE_DEEP_LINK_BASE = 'https://obomarket.co/r';
export const RAFFLE_APP_SCHEME_BASE = 'dormify://r';

export function referralShareUrl(username: string): string {
  return `${RAFFLE_DEEP_LINK_BASE}/${normalizeUsername(username)}`;
}

export function referralShareMessage(username: string): string {
  const url = referralShareUrl(username);
  return `Join me on Obo — sign up with my code @${username} and we both get a raffle entry to win a MacBook: ${url}`;
}
