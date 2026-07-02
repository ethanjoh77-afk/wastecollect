import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Leaf,
  ArrowRight,
} from 'lucide-react';

import { Button, Input, Select } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'citizen',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      setStep(2);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      toast.error(t('register_password_mismatch'));
      return;
    }

    if (formData.password.length < 8) {
      toast.error(t('register_password_too_short'));
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: formData.role,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast.success(t('register_success'));

      navigate('/login');
    } catch (error: any) {
      console.error('Registration failed:', error?.message);

      toast.error(
        error?.message || t('register_failed')
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-gradient">WasteCollect</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
            {step === 1 ? t('register_step1_title') : t('register_step2_title')}
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mb-6">
            {step === 1
              ? t('register_step1_subtitle')
              : t('register_step2_subtitle')}
          </p>

          <div className="flex items-center gap-2 mb-6">
            <div
              className={`flex-1 h-1 rounded-full ${
                step >= 1 ? 'bg-primary-500' : 'bg-secondary-200 dark:bg-slate-700'
              }`}
            />
            <div
              className={`flex-1 h-1 rounded-full ${
                step >= 2 ? 'bg-primary-500' : 'bg-secondary-200 dark:bg-slate-700'
              }`}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('register_first_name')}
                    placeholder="John"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    leftIcon={<User className="w-5 h-5" />}
                    required
                  />
                  <Input
                    label={t('register_last_name')}
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label={t('register_email')}
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  leftIcon={<Mail className="w-5 h-5" />}
                  required
                />

                <Input
                  label={t('register_phone')}
                  type="tel"
                  placeholder="+255 7XX XXX XXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  leftIcon={<Phone className="w-5 h-5" />}
                  required
                />

                <Select
                  label={t('register_account_type')}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  options={[
                    { value: 'citizen', label: t('register_role_citizen') },
                    { value: 'driver', label: t('register_role_driver') },
                  ]}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <Input
                  label={t('register_password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('register_password_placeholder')}
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
                  hint={t('register_password_hint')}
                  required
                />

                <Input
                  label={t('register_confirm_password')}
                  type="password"
                  placeholder={t('register_confirm_password_placeholder')}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                />
              </motion.div>
            )}

            <div className="flex gap-4">
              {step === 2 && (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  {t('register_back')}
                </Button>
              )}
              <Button type="submit" className="flex-1" size="lg" isLoading={isLoading}>
                {step === 1 ? (
                  <>
                    {t('register_continue')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  t('register_create_account')
                )}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-secondary-600 dark:text-secondary-400">
            {t('register_have_account')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('login_sign_in')}
            </Link>
          </p>
        </motion.div>

        <p className="mt-6 text-center text-xs text-secondary-500 dark:text-secondary-400">
          {t('register_terms_prefix')}{' '}
          <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
            {t('register_terms_of_service')}
          </Link>{' '}
          {t('register_and')}{' '}
          <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
            {t('register_privacy_policy')}
          </Link>
        </p>
      </div>
    </div>
  );
}
export default RegisterPage;