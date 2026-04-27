import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';

export const PENDING_REFERRAL_KEY = '@obo/pendingReferral';

export default function ReferralLandingRoute() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (code) {
        await AsyncStorage.setItem(PENDING_REFERRAL_KEY, String(code).toLowerCase());
      }
      setReady(true);
    })();
  }, [code]);

  if (!ready) return null;
  return <Redirect href={{ pathname: '/(auth)/signup', params: { ref: String(code ?? '') } }} />;
}
