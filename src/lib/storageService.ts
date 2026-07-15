import { supabase } from "./supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Kabla ya kubana: ukubwa wa juu unaokubalika wa faili ya awali (raw kutoka kamera)
const MAX_RAW_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

// Baada ya kubana: lengo la ukubwa wa faili itakayopakiwa Supabase
const TARGET_MAX_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB

// Upana/urefu wa juu wa picha baada ya kubana (px)
const MAX_DIMENSION = 1600;

/**
 * Inabana (compress) na kupunguza ukubwa wa picha kwa kutumia Canvas,
 * ili picha kubwa za kamera (mfano 8-15MB kutoka Android) ziweze
 * kupakiwa haraka na bila kukataliwa na server, hasa kwenye mtandao
 * wa simu (mobile data) ulio polepole.
 */
async function compressImage(file: File): Promise<Blob> {
  const imageBitmap = await createImageBitmap(file);

  let { width, height } = imageBitmap;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Imeshindwa kuandaa picha kwa ajili ya kubana.");
  }

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Jaribu viwango tofauti vya quality mpaka tufikie ukubwa unaotakiwa
  let quality = 0.85;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );

    if (!blob) break;
    if (blob.size <= TARGET_MAX_SIZE_BYTES) break;

    quality -= 0.15;
    if (quality < 0.3) quality = 0.3;
  }

  if (!blob) {
    throw new Error("Imeshindwa kubana picha. Tafadhali jaribu picha nyingine.");
  }

  return blob;
}

export async function uploadReportPhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "Aina ya faili haikubaliki. Tumia picha (JPEG, PNG, WEBP) pekee."
    );
  }

  if (file.size > MAX_RAW_SIZE_BYTES) {
    throw new Error(
      "Faili ni kubwa mno (zaidi ya 15MB). Tafadhali chagua picha ndogo zaidi."
    );
  }

  let uploadBlob: Blob = file;

  // Bana picha tu kama ni kubwa kuliko lengo letu la mwisho
  if (file.size > TARGET_MAX_SIZE_BYTES) {
    try {
      uploadBlob = await compressImage(file);
    } catch (compressErr) {
      console.error("Image compression failed, using original file:", compressErr);
      // Kama kubana kumeshindwa lakini faili bado liko ndani ya kikomo cha awali,
      // tumia faili la awali badala ya kukataa kabisa.
      uploadBlob = file;
    }
  }

  const fileExt = "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `reports/${fileName}`;

  const { error } = await supabase.storage
    .from("report-photos")
    .upload(filePath, uploadBlob, {
      contentType: "image/jpeg",
    });

  if (error) {
    console.error("Supabase upload error:", error.message);
    throw new Error(
      `Imeshindwa kupakia picha: ${error.message || "Tafadhali jaribu tena."}`
    );
  }

  const { data } = supabase.storage.from("report-photos").getPublicUrl(filePath);

  return data.publicUrl;
}
