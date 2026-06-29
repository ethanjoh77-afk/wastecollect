import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { features } from "../../data/landingContent";

export default function Features() {
  const navigate = useNavigate();

  const handleFeatureClick = (title: string) => {
    switch (title) {
      case "Smart Waste Collection":
        navigate("/features/smart-collection");
        break;

      case "Real-Time Tracking":
        navigate("/features/tracking");
        break;

      case "GPS Monitoring":
        navigate("/features/gps");
        break;

      case "Digital Payments":
        navigate("/features/payments");
        break;

      default:
        break;
    }
  };

  const cardColors = [
    "bg-green-600/80 border-green-400",
    "bg-blue-600/80 border-blue-400",
    "bg-purple-600/80 border-purple-400",
    "bg-amber-500/80 border-amber-300",
  ];

  return (
    <section className="px-6 py-14">
      <div className="max-w-6xl mx-auto">

        <h2 className="text-5xl font-extrabold text-center text-white drop-shadow-lg mb-12">
          Everything You Need
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
              onClick={() => handleFeatureClick(f.title)}
              className={`
                p-6
                rounded-2xl
                backdrop-blur-md
                border
                shadow-xl
                cursor-pointer
                text-white
                ${cardColors[i % cardColors.length]}
              `}
            >
              <h3 className="font-bold text-xl mb-3">
                {f.title}
              </h3>

              <p className="text-white/90">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}