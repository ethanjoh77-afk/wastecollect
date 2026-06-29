import { stats } from "../../data/landingContent";

export default function Stats() {
  const cardColors = [
    "bg-green-600/85 text-white border-green-400", // Green
    "bg-black/80 text-white border-gray-500",      // Black
    "bg-sky-600/85 text-white border-sky-400",     // Blue
    "bg-yellow-400/90 text-black border-yellow-300" // Yellow
  ];

  return (
    <section className="px-6 py-12">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">

        {stats.map((s, i) => (
          <div
            key={i}
            className={`
              p-6
              rounded-2xl
              text-center
              border
              backdrop-blur-md
              shadow-xl
              transition-all
              hover:scale-105
              ${cardColors[i]}
            `}
          >
            <h2 className="text-3xl font-bold mb-2">
              {s.value}
            </h2>

            <p className="text-sm font-medium">
              {s.label}
            </p>
          </div>
        ))}

      </div>
    </section>
  );
}