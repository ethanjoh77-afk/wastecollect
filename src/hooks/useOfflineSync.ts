import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getQueue, subscribeQueue, type QueueItem } from '../lib/offlineQueue';
import { flushOfflineQueue } from '../services/collectionService';

/** Inafuatilia foleni ya offline na kuisync mtandao ukirudi. */
export function useOfflineSync() {
  const [items, setItems] = useState<QueueItem[]>(() => getQueue());
  const [online, setOnline] = useState<boolean>(() => navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  const sync = useCallback(async (silent = false) => {
    if (!navigator.onLine || getQueue().filter((i) => !i.failed_reason).length === 0) return;
    setSyncing(true);
    try {
      const r = await flushOfflineQueue();
      if (!silent && r.synced > 0) toast.success(`Kazi ${r.synced} zimetumwa kwenye mfumo`);
      if (r.rejected > 0) toast.error(`Kazi ${r.rejected} zimekataliwa na seva — angalia orodha`);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => subscribeQueue(() => setItems(getQueue())), []);

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    sync(true);
    const timer = setInterval(() => sync(true), 60_000);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(timer);
    };
  }, [sync]);

  return {
    online,
    syncing,
    pending: items.filter((i) => !i.failed_reason),
    rejected: items.filter((i) => i.failed_reason),
    sync: () => sync(false),
  };
}
