import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getHeroCarouselImages } from "../../services/landingCmsService";

const AUTOPLAY_MS = 5000;

// Picha za akiba — zinatumika endapo admin bado hajaweka picha za carousel
// kwenye CMS, ili landing page isionekane tupu.
const FALLBACK_SLIDES = [
  { id: "fallback-1", image_url: "/images/hero-bg.png", title: null },
];

interface Slide {
  id: string;
  image_url: string | null;
  title: string | null;
}

/**
 * Hero background carousel — picha zinabadilika kiotomatiki kila sekunde 5,
 * zikiwa na mishale ya kudhibiti mkono na vitone (dots) vya kuruka moja
 * kwa moja kwenda picha fulani. Inatumika nyuma ya maudhui ya Hero section
 * kabla ya login, ili kuleta msisimko na kuonyesha huduma tofauti tofauti.
 */
export default function HeroCarousel({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let mounted = true;
    getHeroCarouselImages()
      .then((items) => {
        if (!mounted) return;
        const withImages = items.filter((i) => !!i.image_url);
        if (withImages.length > 0) {
          setSlides(
            withImages.map((i) => ({
              id: i.id,
              image_url: i.image_url,
              title: i.title,
            }))
          );
        }
      })
      .catch((err) => {
        console.error("HeroCarousel: failed to load slides", err);
        // Endelea kuonyesha fallback slide, usivunje ukurasa.
      });
    return () => {
      mounted = false;
    };
  }, []);

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [next, paused, slides.length]);

  const current = slides[index] ?? slides[0];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 bg-center bg-cover bg-no-repeat transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url('${slide.image_url}')`,
            opacity: i === index ? 1 : 0,
          }}
          aria-hidden={i !== index}
        />
      ))}

      <div className="absolute inset-0 bg-black/50" />

      {children}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Picha iliyopita"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Picha inayofuata"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <div className="flex items-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Nenda kwenye picha ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-white" : "w-2.5 bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-white/80 font-medium tabular-nums">
              {index + 1}/{slides.length}
            </span>
          </div>
        </>
      )}

      {current?.title && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-black/30 text-white text-sm font-medium">
          {current.title}
        </div>
      )}
    </div>
  );
}
