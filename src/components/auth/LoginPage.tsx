import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { useAppStats } from '../../hooks/useAppStats';
import toast from 'react-hot-toast';

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const { stats, loading: statsLoading } = useAppStats();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);

      toast.success(t('login_welcome_back'));
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error?.message);

      toast.error(
        error?.message ||
          error?.error_description ||
          t('login_failed')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 p-8 lg:p-12 flex flex-col justify-between hidden lg:flex">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <span className="text-xl font-bold text-white">WasteCollect</span>
        </div>

        <div className="max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              {t('login_hero_title')}
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              {t('login_hero_desc')}
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: t('login_stat_citizens'), value: stats.citizens },
              { label: t('login_stat_vehicles'), value: stats.vehicles },
              { label: t('login_stat_collections'), value: stats.reportsResolved },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="text-3xl font-bold text-white">
                  {statsLoading ? '...' : `${stat.value.toLocaleString()}+`}
                </div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-white/60 text-sm">
          {t('login_footer_tagline')}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">WasteCollect</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              {t('welcome_back')}
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-8">
              {t('login_subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('login_email_label')}
                type="email"
                placeholder={t('login_email_placeholder')}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />

              <Input
                label={t('login_password_label')}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('login_password_placeholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-secondary-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-secondary-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">
                    {t('login_remember_me')}
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t('login_forgot_password')}
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                {t('login_sign_in')}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-secondary-600 dark:text-secondary-400">
              {t('login_no_account')}{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                {t('login_sign_up')}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
