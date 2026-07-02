import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Truck, Satellite, MapPin, CreditCard, LucideIcon } from "lucide-react";
import { features } from "../../data/landingContent";

const featureIcons: Record<string, LucideIcon> = {
  "Smart Waste Collection": Truck,
  "Real-Time Tracking": MapPin,
  "GPS Monitoring": Satellite,
  "Digital Payments": CreditCard,
};

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
    "bg-primary-600/85 border-primary-400",
    "bg-secondary-600/85 border-secondary-400",
    "bg-primary-700/85 border-primary-500",
    "bg-secondary-700/85 border-secondary-500",
  ];

  return (
    <section className="px-6 py-14">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-extrabold text-center text-white drop-shadow-lg mb-12">
          Everything You Need
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => {
            const Icon = featureIcons[f.title] ?? Truck;

            return (
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
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-white/90">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}