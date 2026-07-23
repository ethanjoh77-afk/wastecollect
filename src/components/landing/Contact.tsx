import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";
import { Send, CheckCircle2 } from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function validate(): string | null {
    if (!form.name.trim()) return t("csm_error_name_required", "Jina linahitajika");
    if (!form.email.trim()) return t("csm_error_email_required", "Barua pepe inahitajika");
    if (!EMAIL_REGEX.test(form.email.trim()))
      return t("csm_error_email_invalid", "Weka barua pepe sahihi");
    if (!form.message.trim()) return t("csm_error_message_required", "Ujumbe unahitajika");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSending(true);
    try {
      const { error: insertError } = await supabase.from("contact_messages").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || null,
        message: form.message.trim(),
      });

      if (insertError) throw insertError;

      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("csm_error_submit_failed", "Imeshindikana kutuma ujumbe. Jaribu tena.")
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-white drop-shadow-xl mb-3">
          {t("contact_title")}
        </h2>
        <p className="text-center text-white/60 mb-10">{t("contact_desc")}</p>

        <div className="p-8 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-primary-400" />
              <p className="text-white font-medium">{t("contact_sent")}</p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-primary-400 hover:underline mt-2"
              >
                {t("csm_send_another", "Tuma ujumbe mwingine")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">{t("contact_name")}</label>
                <input
                  required
                  type="text"
                  maxLength={200}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">{t("contact_email")}</label>
                <input
                  required
                  type="email"
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">
                  {t("csm_subject", "Kichwa cha Ujumbe")}{" "}
                  <span className="text-white/40">({t("csm_optional", "hiari")})</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">{t("contact_message")}</label>
                <textarea
                  required
                  rows={4}
                  maxLength={5000}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {sending ? t("processing") : t("contact_send")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}