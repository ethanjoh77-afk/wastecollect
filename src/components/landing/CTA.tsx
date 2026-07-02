import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DeveloperModal from "./DeveloperModal";

export default function CTA() {
  const navigate = useNavigate();
  const [openDeveloper, setOpenDeveloper] = useState(false);

  return (
    <section className="text-center py-16">
      <motion.button
        onClick={() => navigate("/register")}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(16,185,129,0.8)" }}
        whileTap={{ scale: 0.95 }}
        className="mt-6 px-10 py-4 rounded-2xl bg-primary-600 text-white text-lg font-bold shadow-2xl transition-all"
      >
        🚀 Get Started
      </motion.button>

      <div className="mt-6">
        <button
          onClick={() => setOpenDeveloper(true)}
          className="text-white/80 hover:text-white text-sm underline transition-all"
        >
          About Developer
        </button>
      </div>

      <DeveloperModal open={openDeveloper} onClose={() => setOpenDeveloper(false)} />
    </section>
  );
}