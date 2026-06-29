import { useComplaints } from "../hooks/useComplaints";

export default function ComplaintsPage() {
  const { complaints, loading, error } = useComplaints();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Complaints Management
      </h1>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {complaints.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center p-4">
                No complaints found
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