import { useNavigate } from "react-router-dom";

const HERO_BG = "/images/waste-hero.jpg";

const ACTIONS = [
  {
    label: "Report Issue",
    route: "/report-issue",
    className: "bg-green-600 hover:bg-green-700",
  },
  {
    label: "Request Pickup",
    route: "/pickup-request",
    className: "bg-blue-600 hover:bg-blue-700",
  },
  {
    label: "Pay Fee",
    route: "/payment",
    className: "bg-yellow-500 text-black hover:bg-yellow-400",
  },
  {
    label: "Tracking",
    route: "/Track-Truck",
    className:
      "border border-white hover:bg-white hover:text-black",
  },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      className="relative min-h-[80vh] flex items-center justify-center text-center px-6 rounded-3xl overflow-hidden"
      style={{
        backgroundImage: `url(${HERO_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay layer (controlled + reusable pattern) */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl text-white">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Smart Waste Management System
        </h1>

        <p className="text-base md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
          Report waste issues, request collection services, manage payments,
          and track municipal operations in real time.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          {ACTIONS.map((action) => (
            <button
              key={action.route}
              onClick={() => navigate(action.route)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${action.className}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}