const API_BASE = process.env.NEXT_PUBLIC_URL;

export async function fetchPendingStudents(token) {
  const res = await fetch(`${API_BASE}/api/student/pending-students`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch pending students");
  }

  return res.json();
}

export async function acceptStudent(id, token) {
  const res = await fetch(
    `${API_BASE}/api/student/pending-students/${id}/accept`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to accept student");
  return res.json();
}

export async function rejectStudent(id, token) {
  const res = await fetch(
    `${API_BASE}/api/student/pending-students/${id}/reject`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to reject student");
  return res.json();
}
