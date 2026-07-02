import type { TFunction } from "i18next";

export function getFeatures(t: TFunction) {
  return [
    {
      title: t("feature_smart_collection_title"),
      desc: t("feature_smart_collection_desc"),
    },
    {
      title: t("feature_realtime_tracking_title"),
      desc: t("feature_realtime_tracking_desc"),
    },
    {
      title: t("feature_gps_monitoring_title"),
      desc: t("feature_gps_monitoring_desc"),
    },
    {
      title: t("feature_digital_payments_title"),
      desc: t("feature_digital_payments_desc"),
    },
  ];
}

export function getSteps(t: TFunction) {
  return [
    { step: "01", title: t("step_1_title"), desc: t("step_1_desc") },
    { step: "02", title: t("step_2_title"), desc: t("step_2_desc") },
    { step: "03", title: t("step_3_title"), desc: t("step_3_desc") },
    { step: "04", title: t("step_4_title"), desc: t("step_4_desc") },
    { step: "05", title: t("step_5_title"), desc: t("step_5_desc") },
  ];
}

export function getTestimonials(t: TFunction) {
  return [
    {
      name: t("testimonial_1_name"),
      role: t("testimonial_1_role"),
      text: t("testimonial_1_text"),
    },
    {
      name: t("testimonial_2_name"),
      role: t("testimonial_2_role"),
      text: t("testimonial_2_text"),
    },
    {
      name: t("testimonial_3_name"),
      role: t("testimonial_3_role"),
      text: t("testimonial_3_text"),
    },
  ];
}