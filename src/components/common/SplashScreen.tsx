import { motion } from "framer-motion";
import logo from "../../assets/logo.png";

export function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-xl p-3">
          <img src={logo} alt="WasteCollect" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          WasteCollect
        </h1>

        <p className="text-white/80 text-sm sm:text-base font-medium">
          Ukusanyaji wa taka, kidijitali.
        </p>
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "10rem" }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
        className="h-1 bg-white/70 rounded-full mt-10 overflow-hidden"
      />
    </motion.div>
  );
}
