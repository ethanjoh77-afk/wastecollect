import { useLandingCMS } from "../hooks/useLandingCMS";
import { updateContent } from "../services/landingCmsService";
import { useState } from "react";

export default function AdminLandingCMS() {
  const features = useLandingCMS("features");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (id: string, value: string) => {
    setLoading(true);
    await updateContent(id, { description: value });
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-4">
      <h1>Landing CMS</h1>

      {features.map((f) => (
        <div key={f.id} className="border p-4 rounded-xl">
          <input
            defaultValue={f.title}
            className="border p-2 w-full"
          />

          <textarea
            defaultValue={f.description}
            onBlur={(e) => handleUpdate(f.id, e.target.value)}
            className="border p-2 w-full mt-2"
          />
        </div>
      ))}
    </div>
  );
}