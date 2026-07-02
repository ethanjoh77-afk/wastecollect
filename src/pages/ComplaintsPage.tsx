import { useTranslation } from "react-i18next";
import { useComplaints } from "../hooks/useComplaints";

export default function ComplaintsPage() {
  const { t } = useTranslation();
  const { complaints, loading, error } = useComplaints();

  if (loading) return <p>{t('loading')}</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {t('complaints_title')}
      </h1>
      <table className="w-full border">
        <thead>
          <tr>
            <th>{t('complaints_subject')}</th>
            <th>{t('complaints_type')}</th>
            <th>{t('complaints_priority')}</th>
            <th>{t('complaints_status')}</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center p-4">
                {t('complaints_none_found')}
              </td>
            </tr>
          ) : (
            complaints.map((c) => (
              <tr key={c.id}>
                <td>{c.subject}</td>
                <td>{c.complaint_type}</td>
                <td>{c.priority}</td>
                <td>{c.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}