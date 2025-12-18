import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { session } from "../auth/session";
import "./NominatedSenseiPage.css";

export default function NominatedSenseiPage() {
  const navigate = useNavigate();

  const classOptions = useMemo(
    () => ["Tangerang A", "Tangerang B", "Tangerang C", "Tangerang D", "Fukushuu AB"],
    []
  );

  const senseiOptions = useMemo(
    () => [
      { name: "Eva Sensei", img: "/family.png" },
      { name: "Fifi Sensei", img: "/family.png" },
      { name: "Dedy Sensei", img: "/family.png" },
      { name: "Niko Sensei", img: "/family.png" },
      { name: "Sarah Sensei", img: "/family.png" },
      { name: "Gagah Sensei", img: "/family.png" },
      { name: "Gilang Sensei", img: "/family.png" },
      { name: "Crystal Sensei", img: "/family.png" },
      { name: "Saidah Sensei", img: "/family.png" },
      { name: "Ega Sensei", img: "/family.png" },
      { name: "Derisna Sensei", img: "/family.png" },
      { name: "Marita Sensei", img: "/family.png" },
    ],
    []
  );

  const [kelas, setKelas] = useState("");
  const [selected, setSelected] = useState([]); // max 2
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSensei = (name) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((x) => x !== name);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, name];
    });
  };

  const canSubmit =
    kelas && selected.length === 2 && reason.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const token = session.getToken();

      const res = await fetch("http://localhost:3002/api/wisuda/nomination", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_class: kelas,
          vote1: selected[0],
          vote2: selected[1],
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("❌ " + (data.message || "Gagal menyimpan"));
        return;
      }

      alert("✅ Terima kasih! Nominasi tersimpan.");
      navigate("/questionnaire", { replace: true });
    } catch (err) {
      alert("❌ API tidak bisa dihubungi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="nom-page">
      <div className="nom-wrap">
        <div className="nom-top">
          <Link className="nom-back" to="/questionnaire">← Kembali</Link>

          <div className="nom-titleWrap">
            <div className="nom-badge">SAMIT</div>
            <h1 className="nom-title">Nominasi Sensei Terbaik</h1>
            <p className="nom-subtitle">Pilih 2 Sensei terfavoritmu ✨</p>
            <p className="nom-subtitle">
              Dipilih: <b>{selected.length}/2</b>
            </p>
          </div>
        </div>

        <form className="nom-card" onSubmit={handleSubmit}>
          <section className="nom-section">
            <h2 className="nom-h2">Asal Kelas Minna-san</h2>

            <div className="nom-radioGrid" role="radiogroup" aria-label="Asal Kelas">
              {classOptions.map((opt) => (
                <label key={opt} className="nom-pill">
                  <input
                    type="radio"
                    name="kelas"
                    value={opt}
                    checked={kelas === opt}
                    onChange={() => setKelas(opt)}
                  />
                  <span className="nom-pillText">{opt}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="nom-section">
            <h2 className="nom-h2">Siapa Sensei Terfavorit menurut Minna-san?</h2>

            <div className="nom-grid" role="group" aria-label="Pilih 2 Sensei">
              {senseiOptions.map((s) => {
                const active = selected.includes(s.name);
                const blocked = !active && selected.length >= 2;

                return (
                  <button
                    type="button"
                    key={s.name}
                    className={`senseiCard ${active ? "is-active" : ""} ${blocked ? "is-blocked" : ""}`}
                    onClick={() => toggleSensei(s.name)}
                    disabled={blocked}
                  >
                    <div className="senseiInner">
                      <div className="senseiImgWrap">
                        <img src={s.img} alt={s.name} onError={(e) => (e.currentTarget.src = "/logo.png")} />
                        <div className="senseiGlow" />
                      </div>

                      <div className="senseiName">
                        {s.name} {active ? "✅" : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="nom-section">
            <h2 className="nom-h2">Apa yang membuat Sensei tersebut menjadi terbaik?</h2>
            <textarea
              className="nom-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tulis alasanmu di sini..."
              rows={5}
            />
          </section>

          <div className="nom-actions">
            <button className="nom-btn" type="submit" disabled={!canSubmit}>
              {isSubmitting ? "⏳ Menyimpan..." : "✅ Kirim Nominasi"}
            </button>

            <div className="nom-hint">
              * Wajib pilih kelas, <b>2 sensei</b>, dan isi alasan.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
