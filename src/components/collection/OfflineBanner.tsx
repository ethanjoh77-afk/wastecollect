import { CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { removeFromQueue } from '../../lib/offlineQueue';

export function OfflineBanner() {
  const { online, syncing, pending, rejected, sync } = useOfflineSync();

  if (online && pending.length === 0 && rejected.length === 0) return null;

  return (
    <div className="space-y-2">
      {(!online || pending.length > 0) && (
        <div className="flex items-center gap-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 px-4 py-3 text-sm text-warning-800 dark:text-warning-200">
          <CloudOff className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            {!online ? 'Hakuna mtandao. ' : ''}
            {pending.length > 0
              ? `Kazi ${pending.length} zinasubiri kutumwa — zitatumwa mtandao ukirudi.`
              : 'Unaweza kuendelea kufanya kazi; kila kitu kitahifadhiwa.'}
          </div>
          {online && pending.length > 0 && (
            <button
              onClick={sync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 font-medium underline disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Tuma sasa
            </button>
          )}
        </div>
      )}

      {rejected.map((r) => (
        <div
          key={r.id}
          className="flex items-start gap-3 rounded-xl bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700 px-4 py-3 text-sm text-error-800 dark:text-error-200"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{r.label}</p>
            <p className="text-xs opacity-90">{r.failed_reason}</p>
          </div>
          <button onClick={() => removeFromQueue(r.id)} className="text-xs underline">
            Ondoa
          </button>
        </div>
      ))}
    </div>
  );
}
