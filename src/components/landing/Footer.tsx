import { InstallAppButton } from "../common/InstallAppButton";

export default function Footer() {
  return (
    <footer className="py-8 flex flex-col items-center gap-4 text-center text-white/50 text-sm">
      <InstallAppButton />
      <p>© 2026 Smart Waste Management System • Developed by Joshua J Nasta</p>
    </footer>
  );
}
