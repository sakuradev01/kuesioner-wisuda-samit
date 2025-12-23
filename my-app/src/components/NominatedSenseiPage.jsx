import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { session } from "../auth/session";
import "./NominatedSenseiPage.css";

// IMPORTANT: default "" biar prod same-origin (/api/..)
const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function NominatedSenseiPage() {
  const navigate = useNavigate();

  const classOptions = useMemo(
    () => ["Tangerang A", "Tangerang B", "Tangerang C", "Tangerang D", "Fukushuu AB"],
    []
  );

  const senseiOptions = useMemo(
    () => [
      { name: "Eva Sensei", img: "/eva.png", role: "Japanese Instructor", field: "Bandung" },
      { name: "Fifi Sensei", img: "/fifi.png", role: "Japanese Instructor", field: "Yogyakarta" },
      { name: "Dedy Sensei", img: "/dedi.png", role: "Japanese Instructor", field: "Surabaya" },
      { name: "Marita Sensei", img: "/marita.png", role: "Japanese Instructor", field: "Surabaya" },
      { name: "Niko Sensei", img: "/niko.png", role: "Japanese Instructor", field: "Tangerang" },
      { name: "Sarah Sensei", img: "/sarah.png", role: "Japanese Instructor", field: "Tangerang" },
      { name: "Gagah Sensei", img: "/gagah.png", role: "Japanese Instructor", field: "Basic Level" },
      { name: "Gilang Sensei", img: "/gilang.png", role: "Japanese Instructor", field: "Basic Level" },
      { name: "Crystal Sensei", img: "/crystal.png", role: "Japanese Instructor", field: "Advance Level" },
      { name: "Saidah Sensei", img: "/saidah.png", role: "Japanese Instructor", field: "Advance Level" },
      { name: "Ega Sensei", img: "/ega.png", role: "Japanese Instructor", field: "SSW - Caregiver" },
      { name: "Derisna Sensei", img: "/derisna.png", role: "Japanese Instructor", field: "SSW - Food Service" },
    ],
    []
  );

  useEffect(() => {
    const run = async () => {
      try {
        const token = session.getToken();
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/wisuda/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const st = await res.json().catch(() => null);
        if (st?.isDone_nomination === 1 || st?.isDone_nomination === true) {
          navigate("/nominations/done", {
            replace: true,
            state: { formName: "Nominasi Sensei Terbaik" },
          });
        }
      } catch {}
    };
    run();
  }, [navigate]);

  // ===== wizard state =====
  const [step, setStep] = useState(1); // 1: class, 2: pick
  const [kelas, setKelas] = useState("");
  const [selected, setSelected] = useState([]); // min 1, max 2

  // ✅ alasan per sensei (jadi 2 input kalau pilih 2)
  const [reasonsByName, setReasonsByName] = useState({}); // { [senseiName]: string }

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== overlay / animation state =====
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [ghostPhase, setGhostPhase] = useState("init"); // init | play | fade
  const [ghosts, setGhosts] = useState([]);
  const [ghostedMap, setGhostedMap] = useState({});

  const cardRefs = useRef({}); // { [name]: HTMLElement }

  const toggleSensei = (name) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((x) => x !== name);
      if (prev.length >= 2) return prev;
      return [...prev, name];
    });
  };

  const canNextStep1 = !!kelas;
  const canNextStep2 = selected.length >= 1;

  const selectedInfo = selected
    .map((name) => senseiOptions.find((s) => s.name === name))
    .filter(Boolean);

  // FLIP transform-based animation (support 1 atau 2)
  const startPickToReason = () => {
    const count = selected.length;
    if (count < 1 || count > 2) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const targetW =
      count === 1 ? Math.min(320, Math.floor(vw * 0.78)) : Math.min(240, Math.floor(vw * 0.44));
    const targetH = Math.round(targetW * 1.5);
    const gap = count === 1 ? 0 : Math.min(16, Math.floor(vw * 0.03));

    const totalW = targetW * count + gap * (count - 1);
    const leftStart = Math.max(12, Math.floor((vw - totalW) / 2));
    const top = Math.max(70, Math.floor(vh * 0.12));

    const items = selected
      .map((name, idx) => {
        const el = cardRefs.current[name];
        if (!el) return null;

        const from = el.getBoundingClientRect();
        const to = {
          top,
          left: leftStart + idx * (targetW + gap),
          width: targetW,
          height: targetH,
        };

        const dx = from.left - to.left;
        const dy = from.top - to.top;
        const sx = from.width / to.width;
        const sy = from.height / to.height;

        const info = senseiOptions.find((s) => s.name === name);

        return {
          name,
          img: info?.img || "/logo.png",
          role: info?.role || "",
          field: info?.field || "",
          to,
          fromTransform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
        };
      })
      .filter(Boolean);

    if (items.length !== count) {
      setOverlayOpen(true);
      setShowSheet(true);
      return;
    }

    setOverlayOpen(true);
    setIsAnimating(true);
    setShowSheet(false);
    setGhostPhase("init");
    setGhosts(items);

    const m = {};
    selected.forEach((n) => (m[n] = true));
    setGhostedMap(m);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setGhostPhase("play"));
    });

    window.setTimeout(() => {
      setShowSheet(true);
      setGhostPhase("fade");
    }, 330);

    window.setTimeout(() => {
      setIsAnimating(false);
      setGhosts([]);
    }, 650);
  };

  const closeOverlayBackToPick = () => {
    setOverlayOpen(false);
    setShowSheet(false);
    setIsAnimating(false);
    setGhosts([]);
    setGhostedMap({});
    setGhostPhase("init");
  };

  const goNext = () => {
    if (step === 1 && canNextStep1) setStep(2);
    else if (step === 2 && canNextStep2) startPickToReason();
  };

  const goBack = () => {
    if (overlayOpen) return closeOverlayBackToPick();
    if (step === 2) setStep(1);
  };

  const reasonFor = (name) => (reasonsByName[name] ?? "");
  const setReasonFor = (name, val) => {
    setReasonsByName((prev) => ({ ...prev, [name]: val }));
  };

  const vote1Name = selected[0] || "";
  const vote2Name = selected[1] || "";

  const reason1 = vote1Name ? reasonFor(vote1Name).trim() : "";
  const reason2 = vote2Name ? reasonFor(vote2Name).trim() : "";

  const canSubmit =
    selected.length === 1 ? !!reason1 : selected.length === 2 ? !!reason1 && !!reason2 : false;

  const submitNomination = async () => {
    if (!kelas || selected.length < 1 || selected.length > 2 || !canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = session.getToken();

      const res = await fetch(`${API_BASE}/api/wisuda/nomination`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_class: kelas,
          vote1: vote1Name,
          vote2: vote2Name || null,
          reason1: reasonFor(vote1Name),
          reason2: vote2Name ? reasonFor(vote2Name) : null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        session.clearAll();
        navigate("/", { replace: true });
        return;
      }

      if (!res.ok) {
        alert("❌ " + (data.message || "Gagal menyimpan"));
        return;
      }

      alert("✅ Terima kasih! Nominasi tersimpan.");
      navigate("/nominations/done", {
        replace: true,
        state: { formName: "Nominasi Sensei Terbaik" },
      });
    } catch {
      alert("❌ API tidak bisa dihubungi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress3On = overlayOpen || isAnimating;

  return (
    <div className="nom-page">
      {(overlayOpen || isAnimating) && (
        <div className="nom-overlay">
          <div className={`nom-overlay-backdrop ${overlayOpen ? "is-on" : ""}`} />

          {/* FLIP ghosts */}
          {ghosts.map((it) => (
            <div
              key={it.name}
              className={`nom-ghost ${ghostPhase === "fade" ? "is-fade" : ""}`}
              data-phase={ghostPhase}
              style={{
                top: `${it.to.top}px`,
                left: `${it.to.left}px`,
                width: `${it.to.width}px`,
                height: `${it.to.height}px`,
                transform:
                  ghostPhase === "init"
                    ? it.fromTransform
                    : "translate(0px, 0px) scale(1, 1)",
              }}
            >
              <div className="senseiMedia senseiMedia--ghost">
                <img src={it.img} alt={it.name} onError={(e) => (e.currentTarget.src = "/logo.png")} />
                <div className="senseiShade" />
                <div className="senseiMeta">
                  <div className="senseiMetaTop">
                    <div className="senseiNameBig">{it.name}</div>
                  </div>
                  <div className="senseiRoleLine">
                    <span className="senseiRole">{it.role}</span>
                    <span className="senseiDot">•</span>
                    <span className="senseiField">{it.field}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Reason sheet */}
          {showSheet && (
            <div className="nom-sheet">
              <div className="nom-sheet-head">
                <div className="nom-sheet-title">Alasan Pilihan Minna-san ✨</div>
                <div className="nom-sheet-sub">
                  Kelas: <b>{kelas}</b>
                </div>
              </div>

              <div className={`nom-pickedRow ${selectedInfo.length === 1 ? "is-single" : ""}`}>
                {selectedInfo.map((s) => (
                  <div key={s.name} className="nom-pickedCard nom-pickedCard--portrait">
                    <div className="senseiMedia">
                      <img src={s.img} alt={s.name} onError={(e) => (e.currentTarget.src = "/logo.png")} />
                      <div className="senseiShade" />
                      <div className="senseiMeta">
                        <div className="senseiMetaTop">
                          <div className="senseiNameBig">{s.name}</div>
                        </div>
                        <div className="senseiRoleLine">
                          <span className="senseiRole">{s.role}</span>
                          <span className="senseiDot">•</span>
                          <span className="senseiField">{s.field}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ 2 input alasan (sesuai vote1/vote2) */}
              {selected.map((name, idx) => (
                <div key={name} style={{ marginTop: 10 }}>
                  <label className="nom-label">
                    Apa yang membuat <b>{name}</b> {idx === 0 ? "menjadi yang terbaik?" : "menjadi yang terbaik?"}
                  </label>
                  <textarea
                    className="nom-textarea nom-textarea--sheet"
                    value={reasonFor(name)}
                    onChange={(e) => setReasonFor(name, e.target.value)}
                    placeholder="Tulis alasanmu di sini..."
                    rows={4}
                    disabled={isSubmitting}
                  />
                </div>
              ))}

              <div className="nom-sheet-actions">
                <button
                  type="button"
                  className="nom-btn ghost"
                  onClick={closeOverlayBackToPick}
                  disabled={isSubmitting}
                >
                  ← Ubah Pilihan
                </button>

                <button type="button" className="nom-btn" onClick={submitNomination} disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "⏳ Menyimpan..." : "✅ Selesai & Kirim"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Background */}
      <div className={`nom-wrap ${overlayOpen ? "is-blurred" : ""}`}>
        <div className="nom-top">
          <div className="nom-titleWrap">
            <div className="nom-badge">SAMIT</div>
            <h1 className="nom-title">Nominasi Sensei Terbaik</h1>

            <div className="nom-progress">
              <span className={`dot ${step >= 1 ? "on" : ""}`} />
              <span className={`dot ${step >= 2 ? "on" : ""}`} />
              <span className={`dot ${progress3On ? "on" : ""}`} />
            </div>

            <p className="nom-subtitle">
              {step === 1 && "Pilih kelas dulu ya 🙌"}
              {step === 2 && (
                <>
                  Pilih <b>1–2</b> Sensei terfavoritmu ✨ — Dipilih: <b>{selected.length}/2</b>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="nom-card">
          {step === 1 && (
            <div className="step-panel" key="step-1">
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

              <div className="step-actions">
                <button type="button" className="nom-btn" onClick={goNext} disabled={!canNextStep1}>
                  Next →
                </button>
                <div className="nom-hint">* Wajib pilih kelas.</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-panel" key="step-2">
              <section className="nom-section">
                <h2 className="nom-h2">Siapa Sensei Terfavorit menurut Minna-san?</h2>

                <div className="nom-grid nom-grid--portrait" role="group" aria-label="Pilih Sensei (max 2)">
                  {senseiOptions.map((s) => {
                    const active = selected.includes(s.name);
                    const blocked = !active && selected.length >= 2;
                    const ghosted = !!ghostedMap[s.name];

                    return (
                      <button
                        type="button"
                        key={s.name}
                        ref={(el) => {
                          if (el) cardRefs.current[s.name] = el;
                        }}
                        className={[
                          "senseiCard",
                          "senseiCard--portrait",
                          active ? "is-active" : "",
                          blocked ? "is-blocked" : "",
                          ghosted ? "is-ghosted" : "",
                        ].join(" ")}
                        onClick={() => toggleSensei(s.name)}
                        disabled={blocked || overlayOpen}
                      >
                        <div className="senseiMedia">
                          <img src={s.img} alt={s.name} onError={(e) => (e.currentTarget.src = "/logo.png")} />
                          <div className="senseiShade" />

                          <div className="senseiMeta">
                            <div className="senseiMetaTop">
                              <div className="senseiNameBig">{s.name}</div>
                              {active && <div className="senseiCheck">✓</div>}
                            </div>

                            <div className="senseiRoleLine">
                              <span className="senseiRole">{s.role}</span>
                              <span className="senseiDot">•</span>
                              <span className="senseiField">{s.field}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="step-actions step-actions--row">
                <button type="button" className="nom-btn ghost" onClick={goBack} disabled={overlayOpen}>
                  ← Back
                </button>

                <button type="button" className="nom-btn" onClick={goNext} disabled={!canNextStep2 || overlayOpen}>
                  Next →
                </button>
              </div>

              <div className="nom-hint">
                * Boleh pilih <b>1 atau 2 sensei</b> untuk lanjut.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
