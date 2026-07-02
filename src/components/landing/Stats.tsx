import { stats } from "../../data/landingContent";

export default function Stats() {
  const cardColors = [
    "bg-primary-600/90 text-white border-primary-400",
    "bg-secondary-600/90 text-white border-secondary-400",
    "bg-primary-700/90 text-white border-primary-500",
    "bg-secondary-700/90 text-white border-secondary-500",
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
              ${cardColors[i % cardColors.length]}
            `}
          >
            <h2 className="text-3xl font-bold mb-2">{s.value}</h2>
            <p className="text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}