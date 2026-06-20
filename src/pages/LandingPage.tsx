import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Leaf,
  MapPin,
  Truck,
  CreditCard,
  BarChart3,
  Shield,
  Recycle,
  ChevronRight,
  CheckCircle,
  Star,
  Menu,
  X,
  Sun,
  Moon,
  Users,
  Trash2,
  Building2,
  Globe,
  UserPlus,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Mail,
  Phone,
  MapPinned,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/common';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const features = [
  {
    icon: Trash2,
    title: 'Smart Waste Collection',
    description: 'AI-powered route optimization ensures efficient collection with minimal environmental impact.',
  },
  {
    icon: MapPin,
    title: 'Real-Time Tracking',
    description: 'Track collection vehicles live on the map with accurate ETA predictions.',
  },
  {
    icon: Truck,
    title: 'GPS Monitoring',
    description: 'Monitor fleet location, speed, and routes with advanced GPS technology.',
  },
  {
    icon: CreditCard,
    title: 'Digital Payments',
    description: 'Pay waste fees via M-Pesa, Airtel Money, cards, or bank transfer instantly.',
  },
  {
    icon: BarChart3,
    title: 'User Dashboard',
    description: 'Intuitive dashboards for citizens, drivers, and administrators.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Comprehensive reports with downloadable PDF, Excel, and CSV formats.',
  },
];

const stats = [
  { label: 'Registered Users', value: 15000, suffix: '+', icon: Users },
  { label: 'Waste Collected', value: 2500000, suffix: ' kg', icon: Trash2 },
  { label: 'Active Trucks', value: 500, suffix: '+', icon: Truck },
  { label: 'Cities Served', value: 50, suffix: '+', icon: Building2 },
];

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Register',
    description: 'Create your free account in minutes with email or phone verification.',
  },
  {
    number: '02',
    icon: Calendar,
    title: 'Schedule Pickup',
    description: 'Choose your preferred date and time for waste collection.',
  },
  {
    number: '03',
    icon: Truck,
    title: 'Collection',
    description: 'Our trained team arrives on time to collect your waste.',
  },
  {
    number: '04',
    icon: RefreshCw,
    title: 'Recycling',
    description: 'Waste is sorted and processed at our modern recycling facilities.',
  },
  {
    number: '05',
    icon: CheckCircle2,
    title: 'Confirmation',
    description: 'Receive instant confirmation and earn eco-reward points.',
  },
];

const testimonials = [
  {
    name: 'Grace Mwangi',
    role: 'City Manager, Dar es Salaam',
    content: "WasteCollect transformed our city's waste management. Collection efficiency increased by 40% in just 6 months.",
    rating: 5,
    avatar: 'GM',
  },
  {
    name: 'John Kikwete',
    role: 'Operations Director, CleanCity Ltd',
    content: 'The driver app and route optimization have significantly reduced our fuel costs and improved service delivery.',
    rating: 5,
    avatar: 'JK',
  },
  {
    name: 'Fatima Hassan',
    role: 'Citizen, Arusha',
    content: "I love being able to track when the truck will arrive and report issues directly from my phone!",
    rating: 5,
    avatar: 'FH',
  },
];

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-secondary-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">WasteCollect</span>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <button onClick={() => scrollToSection('home')} className="text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Home
              </button>
              <button onClick={() => scrollToSection('features')} className="text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('about')} className="text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                About
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-secondary-600 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                Contact
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <Link to="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="hidden sm:inline-flex">
                  Get Started
                </Button>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-secondary-600 dark:text-secondary-400"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-white dark:bg-slate-800 border-t border-secondary-100 dark:border-slate-700"
          >
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('home')} className="block w-full text-left px-4 py-2 text-secondary-600 dark:text-secondary-300 font-medium">
                Home
              </button>
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-secondary-600 dark:text-secondary-300 font-medium">
                Features
              </button>
              <button onClick={() => scrollToSection('about')} className="block w-full text-left px-4 py-2 text-secondary-600 dark:text-secondary-300 font-medium">
                About
              </button>
              <button onClick={() => scrollToSection('contact')} className="block w-full text-left px-4 py-2 text-secondary-600 dark:text-secondary-300 font-medium">
                Contact
              </button>
              <div className="flex gap-3 pt-3 border-t border-secondary-100 dark:border-slate-700">
                <Link to="/login" className="flex-1">
                  <Button variant="secondary" className="w-full">Sign in</Button>
                </Link>
                <Link to="/register" className="flex-1">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-400/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary-400/20 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
                <Leaf className="w-4 h-4" />
                Smart Waste Management for Modern Cities
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-secondary-900 dark:text-white mb-6 leading-tight">
                Transform Your City's
                <span className="block text-gradient">Waste Management</span>
              </h1>

              <p className="text-lg sm:text-xl text-secondary-600 dark:text-secondary-400 mb-10 max-w-2xl mx-auto">
                Digital solutions for municipalities, waste companies, and citizens.
                Track collections, manage fleets, and engage communities in creating cleaner environments.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button size="xl" rightIcon={<ChevronRight className="w-5 h-5" />}>
                    Start Free Trial
                  </Button>
                </Link>
                <Button variant="outline" size="xl">
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                  <CheckCircle className="w-5 h-5 text-success-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                  <CheckCircle className="w-5 h-5 text-success-500" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                  <CheckCircle className="w-5 h-5 text-success-500" />
                  Cancel anytime
                </div>
              </div>
            </motion.div>
          </div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="relative mx-auto max-w-5xl rounded-2xl overflow-hidden shadow-2xl ring-1 ring-secondary-200/50 dark:ring-slate-700/50">
              <div className="bg-gradient-to-b from-secondary-900 to-secondary-800 p-2">
                <div className="flex items-center gap-2 px-3">
                  <div className="w-3 h-3 rounded-full bg-error-500" />
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                </div>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 relative p-8">
                <div className="grid grid-cols-4 gap-4 h-full">
                  {/* Mock Dashboard Elements */}
                  <div className="col-span-1 space-y-4">
                    <div className="h-10 bg-white dark:bg-slate-700 rounded-lg" />
                    <div className="h-8 bg-primary-500/30 rounded-lg" />
                    <div className="h-8 bg-white/50 dark:bg-slate-600 rounded-lg" />
                    <div className="h-8 bg-white/50 dark:bg-slate-600 rounded-lg" />
                    <div className="h-8 bg-white/50 dark:bg-slate-600 rounded-lg" />
                  </div>
                  <div className="col-span-3 space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      {['primary', 'secondary', 'success', 'warning'].map((color, i) => (
                        <div key={i} className={`h-24 bg-${color}-500/30 rounded-xl`} />
                      ))}
                    </div>
                    <div className="h-48 bg-white/50 dark:bg-slate-700 rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-32 bg-white/50 dark:bg-slate-700 rounded-xl" />
                      <div className="h-32 bg-white/50 dark:bg-slate-700 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 lg:py-24 bg-secondary-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-secondary-600 dark:text-secondary-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Everything You Need for Smart Waste Management
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400">
              Powerful features for municipalities, companies, drivers, and citizens.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 lg:p-8 rounded-2xl bg-white dark:bg-slate-800 border border-secondary-100 dark:border-slate-700 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-5 shadow-lg">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djUtSDI0di01aDEyem0wLTh2NUgyNHYtNWgxMnptMCA4djVIMjR2LTVoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-white/80">
              Simple steps to cleaner communities
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="relative">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-full h-0.5 bg-white/30 border-t-2 border-dashed border-white/50" />
                  )}
                </div>
                <div className="text-xs text-white/50 mb-1">Step {step.number}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/70">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 dark:text-white mb-6">
                About WasteCollect
              </h2>
              <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-6">
                WasteCollect is Africa's leading digital waste management platform, transforming how cities manage waste collection, recycling, and environmental services.
              </p>
              <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                Founded in 2020, we serve over 50 cities across East Africa, helping municipalities, private companies, and citizens work together for cleaner communities.
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Globe, label: 'Pan-African Reach', value: '10+ Countries' },
                  { icon: Recycle, label: 'Waste Recycled', value: '60% Rate' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <item.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-900 dark:text-white">{item.value}</p>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-3xl p-8 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                    <Truck className="w-8 h-8 text-primary-500 mb-3" />
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">500+</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Collection Vehicles</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                    <Users className="w-8 h-8 text-secondary-500 mb-3" />
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">500+</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Trained Drivers</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                    <Shield className="w-8 h-8 text-success-500 mb-3" />
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">99.9%</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">System Uptime</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                    <BarChart3 className="w-8 h-8 text-warning-500 mb-3" />
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">40%</p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">Efficiency Gain</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24 bg-secondary-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Trusted by Leading Organizations
            </h2>
            <p className="text-lg text-secondary-600 dark:text-secondary-400">
              See what our customers are saying about WasteCollect.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-card border border-secondary-100 dark:border-slate-700"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-warning-500 fill-warning-500" />
                  ))}
                </div>
                <p className="text-secondary-700 dark:text-secondary-300 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-secondary-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-secondary-500 dark:text-secondary-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Waste Management?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join the growing number of cities using WasteCollect to create cleaner, more efficient communities.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button
                  size="xl"
                  className="bg-white text-primary-600 hover:bg-secondary-50"
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  Start Your Free Trial
                </Button>
              </Link>
              <Button
                variant="outline"
                size="xl"
                className="border-white text-white hover:bg-white/10"
              >
                Schedule a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 lg:py-24 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
                Get in Touch
              </h2>
              <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-8">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                    <MapPinned className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-white">Address</h3>
                    <p className="text-secondary-600 dark:text-secondary-400">Plot 12, Ohio Street, Dar es Salaam, Tanzania</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                    <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-white">Email</h3>
                    <p className="text-secondary-600 dark:text-secondary-400">hello@wastecollect.africa</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                    <Phone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-white">Phone</h3>
                    <p className="text-secondary-600 dark:text-secondary-400">+255 700 000 000</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form className="bg-secondary-50 dark:bg-slate-700/50 rounded-2xl p-6 lg:p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-secondary-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Your message..."
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Send Message
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 dark:bg-slate-950 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">WasteCollect</span>
              </div>
              <p className="text-secondary-400 text-sm mb-4">
                Smart waste management for modern cities. Making communities cleaner, one collection at a time.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="p-2 rounded-lg bg-secondary-800 hover:bg-primary-500 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-secondary-800 hover:bg-primary-500 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-secondary-800 hover:bg-primary-500 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-secondary-800 hover:bg-primary-500 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-secondary-400 text-sm">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-secondary-400 text-sm">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">About</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-secondary-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-secondary-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-secondary-400 text-sm">
              &copy; {new Date().getFullYear()} WasteCollect. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-secondary-400">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default LandingPage;
