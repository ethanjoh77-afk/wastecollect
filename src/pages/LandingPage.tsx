import { useNavigate } from "react-router-dom";
import Hero from "../components/landing/Hero";
import Stats from "../components/landing/Stats";
import Features from "../components/landing/Features";
import Steps from "../components/landing/Steps";
import Testimonials from "../components/landing/Testimonials";
import Partners from "../components/landing/Partners";
import FAQ from "../components/landing/FAQ";
import Contact from "../components/landing/Contact";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* HERO SECTION — background image imewekwa hapa pekee */}
      <section
        className="relative text-white bg-center bg-no-repeat bg-cover px-6 md:px-8 py-16 min-h-[600px] flex flex-col justify-center"
        style={{
          backgroundImage: "url('/images/hero-bg.png')",
        }}
      >
        {/* Overlay nyeusi kwa usomekaji wa maandishi */}
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10">
          <Hero />

          {/* AUTH ACTIONS */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-3 rounded-xl bg-primary-600 font-semibold hover:bg-primary-700 transition"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* CONTENT FLOW — bila background image */}
      <Stats />
      <Features />
      <Steps />
      <Testimonials />
      <Partners />
      <FAQ />
      <Contact />
      <CTA />
      <Footer />
    </div>
  );
}