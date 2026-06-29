import { ReactNode } from "react";
import { useTheme } from "../../hooks/useTheme";
import { glassCard, glassLight, glassDark, glassHover } from "../../styles/glass";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = "" }: Props) {
  const { isDark } = useTheme();

  return (
    <div
      className={[
        glassCard,
        isDark ? glassDark : glassLight,
        glassHover,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}