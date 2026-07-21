import { useTranslation } from 'react-i18next';
import { Construction } from 'lucide-react';
import { SuperAdminLayout } from '../layout/SuperAdminLayout';

interface ComingSoonProps {
  titleKey: string;
  phaseLabel: string;
}

export function SuperAdminComingSoon({ titleKey, phaseLabel }: ComingSoonProps) {
  const { t } = useTranslation();

  return (
    <SuperAdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Construction className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          {t(titleKey)}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          {t('superadmin_coming_soon_desc')}
        </p>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
          {phaseLabel}
        </span>
      </div>
    </SuperAdminLayout>
  );
}