import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Leaf } from 'lucide-react';
import { Button, Input } from '../common';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await login(formData.email, formData.password);

    toast.success("Welcome back!");
    navigate("/dashboard");
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);

    toast.error(
      error?.message ||
      error?.error_description ||
      "Login failed. Please try again."
    );
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
              Digital Waste Collection System
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Transforming waste management with smart technology. Track collections,
              manage vehicles, and engage citizens in creating cleaner, greener communities.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: 'Citizens', value: '10K+' },
              { label: 'Vehicles', value: '500+' },
              { label: 'Collections', value: '50K+' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-white/60 text-sm">
          Powered by advanced AI and IoT technology
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
              Welcome back
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-8">
              Sign in to continue to your dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
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
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Sign in
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-secondary-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-slate-900 text-secondary-500">
                    Demo accounts
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { email: 'super@waste.gov', role: 'Super Admin' },
                  { email: 'citizen@gmail.com', role: 'Citizen' },
                ].map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setFormData({ email: account.email, password: 'demo123' });
                    }}
                    className="p-3 rounded-xl border border-secondary-200 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-left"
                  >
                    <div className="text-xs text-secondary-500 dark:text-secondary-400">
                      {account.role}
                    </div>
                    <div className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                      {account.email}
                    </div>
                    <div className="text-xs text-secondary-400">demo123</div>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
