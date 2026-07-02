import { steps } from "../../data/landingContent";

export default function Steps() {
  return (
    <section className="px-6 py-16 bg-black/30 backdrop-blur-md rounded-3xl border border-white/10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-white mb-12">
          How It Works
        </h2>

        <div className="space-y-8">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-5 items-start">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-600 text-white font-bold shrink-0">
                {i + 1}
              </div>

              <div>
                <h4 className="font-semibold text-lg text-white">
                  {s.title}
                </h4>
                <p className="text-white/70">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}