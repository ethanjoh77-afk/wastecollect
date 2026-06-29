import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";

// ================= STAT CARD =================
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "vs last month",
  icon: Icon,
  iconColor = "bg-primary-500",
  trend,
  className,
}: StatCardProps) {
  const getTrendColor = () => {
    if (trend === "up") return "text-green-600 dark:text-green-400";
    if (trend === "down") return "text-red-600 dark:text-red-400";
    return "text-gray-500 dark:text-gray-400";
  };

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border border-gray-200 dark:border-slate-700",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>

          {change !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-sm", getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">{Math.abs(change)}%</span>
              <span className="text-gray-400">{changeLabel}</span>
            </div>
          )}
        </div>

        <div className={cn("p-3 rounded-xl", iconColor)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ================= QUICK ACTION =================
interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
}

export function QuickAction({
  title,
  description,
  icon: Icon,
  onClick,
  color = "bg-primary-500",
  disabled = false,
}: QuickActionProps) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      onClick={() => {
        if (!disabled && onClick) onClick();
      }}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow transition-all text-left",
        !disabled && "hover:shadow-lg cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn("p-2.5 rounded-lg", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          {title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </motion.button>
  );
}