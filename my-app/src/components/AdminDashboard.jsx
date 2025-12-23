import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import "./AdminDashboard.css";

// IMPORTANT: default "" biar production pakai same-origin (/api/..)
const API_BASE = import.meta.env.VITE_API_BASE || "";

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

  const [data, setData] = useState([]); // nominations rows
  const [summary, setSummary] = useState([]); // [{ vote, total }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [kelasFilter, setKelasFilter] = useState("ALL");
  const [selectedSensei, setSelectedSensei] = useState(null);

  const [viewMode, setViewMode] = useState("table"); // table | card
  const [selectedRow, setSelectedRow] = useState(null);

  const fetchNominations = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/admin/nominations`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Gagal ambil data admin");

      setData(Array.isArray(json.nominations) ? json.nominations : []);
      setSummary(Array.isArray(json.summary) ? json.summary : []);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNominations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => navigate("/admin");

  // ===== helpers =====
  const formatUpdated = (v) => {
    if (!v) return "-";
    const d = new Date(String(v));
    if (!Number.isNaN(d.getTime())) {
      try {
        return new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(d);
      } catch {
        return String(v);
      }
    }
    return String(v);
  };

  const reasonPreview = (txt, max = 70) => {
    const s = String(txt || "").trim();
    if (!s) return "-";
    return s.length > max ? s.slice(0, max) + "..." : s;
  };

  // ===== summary counts (pastikan semua sensei muncul) =====
  const countsMap = useMemo(() => {
    const m = {};
    for (const it of summary) m[it.vote] = Number(it.total || 0);
    return m;
  }, [summary]);

  const summaryFull = useMemo(() => {
    return senseiList.map((name) => ({
      name,
      total: countsMap[name] || 0,
    }));
  }, [senseiList, countsMap]);

  const totalSubmissions = data.length;
  const totalVotes = useMemo(
    () => summary.reduce((acc, x) => acc + Number(x.total || 0), 0),
    [summary]
  );

  // ===== kelas options from data =====
  const kelasOptions = useMemo(() => {
    const set = new Set();
    for (const r of data) {
      const k = (r.student_class || "").trim();
      if (k) set.add(k);
    }
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [data]);

  // ===== filter (NO SORTING) =====
  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    let rows = data;

    // filter kelas
    if (kelasFilter !== "ALL") {
      rows = rows.filter((r) => String(r.student_class || "").trim() === kelasFilter);
    }

    // filter sensei (klik summary)
    if (selectedSensei) {
      rows = rows.filter(
        (r) => String(r.vote1 || "") === selectedSensei || String(r.vote2 || "") === selectedSensei
      );
    }

    // search
    if (q) {
      rows = rows.filter((r) => {
        const student = (r.student_name || r.uuid || "").toLowerCase();
        const v1 = (r.vote1 || "").toLowerCase();
        const v2 = (r.vote2 || "").toLowerCase();
        const kelas = (r.student_class || "").toLowerCase();
        return (
          student.includes(q) ||
          v1.includes(q) ||
          v2.includes(q) ||
          kelas.includes(q)
        );
      });
    }

    // IMPORTANT: ga di-sort sama sekali (mengikuti urutan dari backend)
    return rows;
  }, [data, searchTerm, kelasFilter, selectedSensei]);

  // ===== export excel =====
  const exportExcel = () => {
    const headers = ["No", "UUID", "Nama Siswa", "Kelas", "Vote 1", "Vote 2", "Alasan", "Updated (Jakarta)"];

    const rows = filteredRows.map((r, idx) => [
      idx + 1,
      r.uuid || "",
      r.student_name || "",
      r.student_class || "",
      r.vote1 || "",
      r.vote2 || "",
      r.reason || "",
      formatUpdated(r.updated_at),
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Nominasi Sensei");

    XLSX.writeFile(wb, `nominasi-sensei-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ===== UI states =====
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
              <span>
                Submissions: <b>{totalSubmissions}</b>
              </span>
              <span className="dot">•</span>
              <span>
                Total Votes: <b>{totalVotes}</b>
              </span>

              {selectedSensei && (
                <>
                  <span className="dot">•</span>
                  <span>
                    Filter Sensei: <b>{selectedSensei}</b>{" "}
                    <button
                      className="chip-clear"
                      onClick={() => setSelectedSensei(null)}
                      title="Clear sensei filter"
                      type="button"
                    >
                      ✕
                    </button>
                  </span>
                </>
              )}
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* SUMMARY (CLICKABLE) */}
        <section className="summary-section">
          <div className="summary-card">
            <div className="summary-title">🏆 Summary Vote per Sensei (klik untuk filter)</div>
            <div className="summary-grid">
              {summaryFull
                .slice()
                .sort((a, b) => b.total - a.total)
                .map((s) => {
                  const active = selectedSensei === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      className={`summary-item summary-btn ${active ? "active" : ""}`}
                      onClick={() => setSelectedSensei((prev) => (prev === s.name ? null : s.name))}
                      title={active ? "Klik untuk reset filter" : `Tampilkan yang vote ${s.name}`}
                    >
                      <div className="summary-name">{s.name}</div>
                      <div className="summary-count">{s.total}</div>
                    </button>
                  );
                })}
            </div>
          </div>
        </section>

        {/* SEARCH + FILTER KELAS + ACTIONS */}
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
                {/* filter kelas (ONLY FILTER YANG KAMU MAU) */}
                <select
                  className="search-input select-compact"
                  value={kelasFilter}
                  onChange={(e) => setKelasFilter(e.target.value)}
                  title="Filter Kelas"
                >
                  {kelasOptions.map((k) => (
                    <option key={k} value={k}>
                      {k === "ALL" ? "Semua Kelas" : k}
                    </option>
                  ))}
                </select>

                <div className="view-toggle">
                  <button
                    className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                    onClick={() => setViewMode("table")}
                    type="button"
                  >
                    📊 Table
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === "card" ? "active" : ""}`}
                    onClick={() => setViewMode("card")}
                    type="button"
                  >
                    📋 Card
                  </button>
                </div>

                <button className="refresh-btn" onClick={fetchNominations} type="button">
                  🔄 Refresh
                </button>

                <button className="export-btn" onClick={exportExcel} type="button">
                  📗 Export Excel
                </button>
              </div>
            </div>

            <div className="search-info">
              Menampilkan {filteredRows.length} dari {data.length} submissions
            </div>
          </div>
        </div>

        {/* LIST */}
        {viewMode === "card" ? (
          <div className="students-grid">
            {filteredRows.map((r, idx) => (
              <div key={`${r.uuid}-${idx}`} className="student-card">
                <div className="student-header">
                  <h3>{r.student_name || "(Nama tidak ditemukan)"}</h3>
                  <span className="timestamp">{formatUpdated(r.updated_at)}</span>
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
                  <div className="info-item message">
                    <strong>Alasan:</strong> "{reasonPreview(r.reason)}"
                  </div>
                </div>

                <button className="view-detail-btn" onClick={() => setSelectedRow(r)} type="button">
                  👁️ Lihat Detail
                </button>
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
                    <th>Alasan</th>
                    <th>Created</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((r, i) => (
                    <tr key={`${r.uuid}-${i}`}>
                      <td>{i + 1}</td>
                      <td className="name-cell">{r.student_name || "(Nama tidak ditemukan)"}</td>
                      <td className="uuid-cell">{r.uuid}</td>
                      <td>{r.student_class || "-"}</td>
                      <td className="vote-cell">{r.vote1 || "-"}</td>
                      <td className="vote-cell">{r.vote2 || "-"}</td>
                      <td className="message-cell">
                        <span className="message-preview">{reasonPreview(r.reason, 50)}</span>
                      </td>
                      <td className="timestamp-cell">{formatUpdated(r.updated_at)}</td>
                      <td>
                        <button
                          className="table-detail-btn"
                          onClick={() => setSelectedRow(r)}
                          title="Lihat Detail"
                          type="button"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredRows.length === 0 && (
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
              <button className="close-btn" onClick={() => setSelectedRow(null)} type="button">
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
                    <span>{formatUpdated(selectedRow.updated_at)}</span>
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
                    <span>{selectedRow.vote2 || "-"}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Alasan</label>
                    <span>"{selectedRow.reason || "-"}"</span>
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
