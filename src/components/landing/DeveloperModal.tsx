import { AnimatePresence, motion } from "framer-motion";
import { X, Github, Linkedin, Mail } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DeveloperModal({
  open,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-red-400 transition"
            >
              <X size={24} />
            </button>

            <img
              src="/images/developer.jpg"
              alt="Developer"
              className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-green-500"
            />

            <h2 className="mt-5 text-3xl font-bold text-center text-white">
              Joshua J Nasta
            </h2>

            <p className="text-center text-green-400 font-semibold mt-2">
              Full Stack Developer
            </p>

            <p className="mt-5 text-center text-gray-300">
              Responsible for designing and developing both the frontend and
              backend of the application, including database integration and
              deployment.
            </p>

            <div className="flex justify-center gap-4 mt-8">
              <a
                href="https://github.com/ethanjoh7-afk"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                <Github className="text-white" />
              </a>

              <a
                href="https://linkedin.com/in/triggerbeatz7"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                <Linkedin className="text-white" />
              </a>

              <a
                href="mailto:triggerbeatz7@gmail.com"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition"
              >
                <Mail className="text-white" />
              </a>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Smart Waste Management System
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Developed by Joshua J Nasta
              <p className="text-xs text-green-400 mt-2">
                Version 1.0.0
               </p>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}