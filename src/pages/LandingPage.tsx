import { useNavigate } from "react-router-dom";

import Hero from "../components/landing/Hero";
import Stats from "../components/landing/Stats";
import Features from "../components/landing/Features";
import Steps from "../components/landing/Steps";
import Testimonials from "../components/landing/Testimonials";
import CTA from "../components/landing/CTA";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen text-white bg-center bg-no-repeat bg-cover"
      style={{
        backgroundImage: "url('/images/hero-bg.jpg')",
      }}
    >
      {/* HERO SECTION WRAPPER */}
      <section className="px-6 md:px-8 py-16">
        <Hero />

        {/* AUTH ACTIONS */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 rounded-xl bg-green-600 font-semibold hover:bg-green-700 transition"
          >
            Get Started
          </button>

          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-3 rounded-xl bg-black font-semibold hover:bg-gray-800 transition"
          >
            Admin Panel
          </button>
        </div>
      </section>

      {/* CONTENT FLOW */}
      <Stats />
      <Features />
      <Steps />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}