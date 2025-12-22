import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3003";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const senseiList = useMemo(
    () => [
      "Eva Sensei",
      "Fifi Sensei",
      "Dedy Sensei",
      "Marita Sensei",
      "Niko Sensei",
      "Sarah Sensei",
      "Gagah Sensei",
      "Gilang Sensei",
      "Crystal Sensei",
      "Saidah Sensei",
      "Ega Sensei",
      "Derisna Sensei",
    ],
    []
  );

  const [data, setData] = useState([]); // nominations
  const [summary, setSummary] = useState([]); // [{vote,total}]
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'card'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedRow, setSelectedRow] = useState(null);

  const fetchNominations = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/admin/nominations`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json.message || "Gagal ambil data admin");

      setData(json.nominations || []);
      setSummary(json.summary || []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNominations();
  }, []);

  const handleLogout = () => {
    navigate("/admin");
  };

  const countsMap = useMemo(() => {
    const m = {};
    for (const it of summary) m[it.vote] = Number(it.total || 0);
    return m;
  }, [summary]);

  const summaryFull = useMemo(() => {
    // tampilkan semua sensei, yang belum ada vote => 0
    return senseiList.map((name) => ({
      name,
      total: countsMap[name] || 0,
    }));
  }, [senseiList, countsMap]);

  const totalSubmissions = data.length;
  const totalVotes = useMemo(() => {
    // sum semua total summary
    return summary.reduce((acc, x) => acc + Number(x.total || 0), 0);
  }, [summary]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return data;

    return data.filter((r) => {
      const student = (r.student_name || r.uuid || "").toLowerCase();
      const v1 = (r.vote1 || "").toLowerCase();
      const v2 = (r.vote2 || "").toLowerCase();
      const reason = (r.reason || "").toLowerCase();
      const kelas = (r.student_class || "").toLowerCase();
      return (
        student.includes(q) ||
        v1.includes(q) ||
        v2.includes(q) ||
        reason.includes(q) ||
        kelas.includes(q)
      );
    });
  }, [data, searchTerm]);

  // const exportCSV = () => {
  //   const headers = ["UUID", "Nama Siswa", "Kelas", "Vote 1", "Vote 2", "Alasan", "Updated At"];
  //   const esc = (v) => {
  //     const s = String(v ?? "");
  //     if (s.includes(",") || s.includes("\n") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
  //     return `"${s}"`;
  //   };

  //   const rows = filtered.map((r) =>
  //     [
  //       esc(r.uuid),
  //       esc(r.student_name || ""),
  //       esc(r.student_class || ""),
  //       esc(r.vote1 || ""),
  //       esc(r.vote2 || ""),
  //       esc(r.reason || ""),
  //       esc(r.updated_at || ""),
  //     ].join(",")
  //   );

  //   const csv = "\uFEFF" + [headers.map(esc).join(","), ...rows].join("\n");
  //   const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  //   const url = URL.createObjectURL(blob);

  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `nominasi-sensei-${new Date().toISOString().slice(0, 10)}.csv`;
  //   document.body.appendChild(a);
  //   a.click();
  //   a.remove();
  //   URL.revokeObjectURL(url);
  // };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>📊 Mengambil data nominasi...</p>
          <p className="loading-detail">Mohon tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchNominations}>
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>📊 Dashboard Admin — Nominasi Sensei</h1>
            <div className="header-sub">
              <span>Submissions: <b>{totalSubmissions}</b></span>
              <span className="dot">•</span>
              <span>Total Votes: <b>{totalVotes}</b></span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* SUMMARY */}
        <section className="summary-section">
          <div className="summary-card">
            <div className="summary-title">🏆 Summary Vote per Sensei</div>
            <div className="summary-grid">
              {summaryFull
                .slice()
                .sort((a, b) => b.total - a.total)
                .map((s) => (
                  <div key={s.name} className="summary-item">
                    <div className="summary-name">{s.name}</div>
                    <div className="summary-count">{s.total}</div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* SEARCH + ACTIONS */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-header">
              <input
                className="search-input"
                type="text"
                placeholder="🔍 Cari nama siswa / sensei / kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="action-buttons">
                <div className="view-toggle">
                  <button
                    className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                    onClick={() => setViewMode("table")}
                  >
                    📊 Table
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === "card" ? "active" : ""}`}
                    onClick={() => setViewMode("card")}
                  >
                    📋 Card
                  </button>
                </div>

                <button className="refresh-btn" onClick={fetchNominations}>
                  🔄 Refresh
                </button>

                {/* <button className="export-btn" onClick={exportCSV}>
                  📄 Export CSV
                </button> */}
              </div>
            </div>

            <div className="search-info">
              Menampilkan {filtered.length} dari {data.length} submissions
            </div>
          </div>
        </div>

        {/* LIST */}
        {viewMode === "card" ? (
          <div className="students-grid">
            {filtered.map((r, idx) => (
              <div key={`${r.uuid}-${idx}`} className="student-card">
                <div className="student-header">
                  <h3>{r.student_name || "(Nama tidak ditemukan)"}</h3>
                  <span className="timestamp">{r.updated_at ? String(r.updated_at) : "-"}</span>
                </div>

                <div className="student-info">
                  <div className="info-item">
                    <strong>UUID:</strong> {r.uuid}
                  </div>
                  <div className="info-item">
                    <strong>Kelas:</strong> {r.student_class || "-"}
                  </div>
                  <div className="info-item">
                    <strong>Vote 1:</strong> {r.vote1 || "-"}
                  </div>
                  <div className="info-item">
                    <strong>Vote 2:</strong> {r.vote2 || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container">
            <div className="table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>UUID</th>
                    <th>Kelas</th>
                    <th>Vote 1</th>
                    <th>Vote 2</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={`${r.uuid}-${i}`}>
                      <td>{i + 1}</td>
                      <td className="name-cell">{r.student_name || "(Nama tidak ditemukan)"}</td>
                      <td className="uuid-cell">{r.uuid}</td>
                      <td>{r.student_class || "-"}</td>
                      <td className="vote-cell">{r.vote1 || "-"}</td>
                      <td className="vote-cell">{r.vote2 || "-"}</td>
                      <td className="timestamp-cell">{r.updated_at ? String(r.updated_at) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="no-results">
            <p>❌ Tidak ada data yang cocok dengan "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedRow && (
        <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Nominasi</h2>
              <button className="close-btn" onClick={() => setSelectedRow(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>👤 Siswa</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Nama</label>
                    <span>{selectedRow.student_name || "(Nama tidak ditemukan)"}</span>
                  </div>
                  <div className="detail-item">
                    <label>UUID</label>
                    <span>{selectedRow.uuid}</span>
                  </div>
                  <div className="detail-item">
                    <label>Kelas</label>
                    <span>{selectedRow.student_class || "-"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Updated</label>
                    <span>{selectedRow.updated_at ? String(selectedRow.updated_at) : "-"}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>🏅 Vote</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Vote 1</label>
                    <span>{selectedRow.vote1 || "-"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Vote 2</label>
                    <span>{selectedRow.vote2 || ""}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Alasan</label>
                    <span>{selectedRow.reason || "-"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
