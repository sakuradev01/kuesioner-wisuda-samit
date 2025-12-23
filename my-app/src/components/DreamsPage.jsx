import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./DreamsPage.css";
import { useNavigate } from "react-router-dom";
import { session } from "../auth/session";

function DreamsPage() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted to bypass autoplay policy
  const [doneLoading, setDoneLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Handle background music with better user interaction detection
    const audio = document.getElementById("backgroundMusic");

    const startMusic = () => {
      if (audio) {
        // Set volume to ensure it's audible
        audio.volume = 0.7;

        // Try muted autoplay first (browsers usually allow this)
        audio.muted = true;
        audio
          .play()
          .then(() => {
            console.log("✅ Muted audio started, now unmuting...");
            setIsPlaying(true);

            // Unmute after successful play
            setTimeout(() => {
              audio.muted = false;
              setIsMuted(false);
              console.log("✅ Audio unmuted successfully");
            }, 100);
          })
          .catch((error) => {
            console.log("❌ Even muted autoplay prevented:", error);
            setIsPlaying(false);

            // Try unmuted as backup
            setTimeout(() => {
              console.log("🔄 Trying unmuted audio...");
              audio.muted = false;
              audio
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setIsMuted(false);
                  console.log("✅ Unmuted audio started");
                })
                .catch((e) => {
                  console.log("❌ Unmuted audio failed:", e);
                });
            }, 500);
          });
      }
    };

    // Audio event listeners
    if (audio) {
      audio.addEventListener("loadeddata", () => {
        setAudioLoaded(true);
        console.log("Audio loaded successfully");
      });
      audio.addEventListener("play", () => {
        setIsPlaying(true);
        console.log("Audio is playing");
      });
      audio.addEventListener("pause", () => {
        setIsPlaying(false);
        console.log("Audio is paused");
      });
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        console.log("Audio ended");
      });
      audio.addEventListener("error", (e) => {
        console.log("Audio error:", e);
        setAudioLoaded(false);
      });
    }

    // Try multiple times to start music immediately
    startMusic();

    // Immediate unmute attempt
    setTimeout(() => {
      if (audio && audio.muted && isPlaying) {
        console.log("🔄 Quick unmute attempt...");
        audio.muted = false;
        setIsMuted(false);
      }
    }, 50);

    // Try again after a short delay
    setTimeout(() => {
      if (!isPlaying) {
        console.log("🔄 Trying audio again after delay...");
        startMusic();
      }
    }, 1000);

    // Final aggressive attempt
    setTimeout(() => {
      if (!isPlaying) {
        console.log("🔄 Final aggressive attempt...");
        if (audio) {
          audio.muted = false;
          audio.volume = 0.7;
          audio.currentTime = 0;
          audio
            .play()
            .then(() => {
              setIsPlaying(true);
              setIsMuted(false);
              console.log("✅ Final attempt successful!");
            })
            .catch((e) => {
              console.log("❌ All attempts failed:", e);
            });
        }
      }
    }, 2000);

    // Try when audio is fully loaded
    if (audio) {
      audio.addEventListener("canplaythrough", () => {
        if (!isPlaying) {
          console.log("🔄 Audio can play through, attempting to start...");
          startMusic();
        }
      });

      audio.addEventListener("loadeddata", () => {
        if (!isPlaying) {
          console.log("🔄 Audio data loaded, attempting to start...");
          setTimeout(() => startMusic(), 100);
        }
      });
    }

    // Backup: start music on ANY user interaction - NEVER REMOVE LISTENERS!
    const handleUserInteraction = () => {
      console.log("🎯 User interaction detected! Current playing status:", isPlaying);

      if (audio && !isPlaying) {
        setUserInteracted(true);
        console.log("🚀 Attempting to start audio after user interaction...");

        // Force unmute and play
        audio.muted = false;
        audio.volume = 0.7;
        setIsMuted(false);

        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            console.log("✅ Audio started successfully after user interaction");
          })
          .catch((error) => {
            console.log("❌ First attempt failed, trying aggressive method:", error);

            // Aggressive retry
            setTimeout(() => {
              audio.load();
              audio.muted = false;
              audio.volume = 0.7;
              audio.currentTime = 0;
              audio
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setIsMuted(false);
                  console.log("✅ Audio started on aggressive retry");
                })
                .catch((e) => console.log("❌ All attempts failed:", e));
            }, 100);
          });
      } else if (audio && isPlaying && audio.muted) {
        // If playing but muted, just unmute
        audio.muted = false;
        setIsMuted(false);
        console.log("🔊 Audio unmuted on user interaction");
      }
    };

    // Add multiple event listeners for user interaction - PERSISTENT!
    const addPersistentListeners = () => {
      document.addEventListener("click", handleUserInteraction, { passive: true });
      document.addEventListener("touchstart", handleUserInteraction, { passive: true });
      document.addEventListener("keydown", handleUserInteraction, { passive: true });
      document.addEventListener("mousemove", handleUserInteraction, { passive: true });
      document.addEventListener("scroll", handleUserInteraction, { passive: true });
      console.log("🎧 Persistent audio listeners added");
    };

    addPersistentListeners();

    // Re-add listeners every 5 seconds to ensure they persist
    const persistentInterval = setInterval(() => {
      if (!isPlaying) {
        console.log("🔄 Re-ensuring audio listeners are active");
        addPersistentListeners();
      }
    }, 5000);

    // Create particles effect
    const createParticle = () => {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.animationDuration = Math.random() * 3 + 2 + "s";
      particle.style.animationDelay = Math.random() * 2 + "s";

      const particlesContainer = document.getElementById("particles");
      if (particlesContainer) {
        particlesContainer.appendChild(particle);

        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
        }, 5000);
      }
    };

    // Create particles every 300ms
    const particleInterval = setInterval(createParticle, 300);

    return () => {
      clearInterval(particleInterval);
      clearInterval(persistentInterval);
      console.log("🧹 Component cleanup, but keeping audio listeners active");
    };
  }, []);

  // const handleDone = async () => {
  //   setDoneLoading(true);
  //   try {
  //     const token = session.getToken();
  //     const res = await fetch("http://localhost:3003/api/wisuda/dreams", {
  //       method: "POST",
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     const data = await res.json();
  //     if (!res.ok) return alert("❌ " + (data.message || "Gagal"));
  //     alert("✅ Terima kasih! Harapan sudah selesai.");
  //     navigate("/questionnaire", { replace: true });
  //   } catch (e) {
  //     alert("❌ API tidak bisa dihubungi");
  //   } finally {
  //     setDoneLoading(false);
  //   }
  // };

  // Manual audio control functions
  const toggleMusic = () => {
    const audio = document.getElementById("backgroundMusic");
    if (audio) {
      if (isPlaying) {
        audio.pause();
        console.log("🔇 Audio paused manually");
      } else {
        // Force unmute and play
        audio.muted = false;
        audio.volume = 0.7;
        setIsMuted(false);
        setUserInteracted(true);

        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            console.log("🔊 Audio started manually");
          })
          .catch((error) => {
            console.log("❌ Manual play failed:", error);
            // Aggressive retry for manual play
            setTimeout(() => {
              audio.load();
              audio.muted = false;
              audio.volume = 0.7;
              audio.currentTime = 0;
              audio
                .play()
                .then(() => {
                  setIsPlaying(true);
                  setIsMuted(false);
                  console.log("✅ Manual play successful on retry");
                })
                .catch((e) => console.log("❌ Manual retry failed:", e));
            }, 100);
          });
      }
    }
  };

  return (
    <div className="dreams-container">
      {/* Welcome Overlay */}
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="graduation-cap">🎓</div>
          <div className="welcome-text">第10回サミットの卒業式　</div>
          <div className="subtitle">Wisuda LPK SAMIT</div>

          <div className="warning-text">Harap naikkan volume HP Minna-san ya 😇</div>

          <div className="hiraku-button-container">
            <button className="hiraku-button group" onClick={() => setShowWelcome(false)}>
              <span className="button-text">開く</span>
              <div className="button-glow"></div>
              <div className="button-shine"></div>
            </button>
          </div>
        </div>
      )}

      {/* Particles Effect */}
      <div className="particles" id="particles"></div>

      {/* Main Content */}
      <div className="main-content">
        <div className="hero">
          <div className="family-title-container">
            <h2 className="family-title">
              家族のこと
              <div className="glitter-container">
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
                <span className="glitter"></span>
              </div>
            </h2>
            <div className="family-subtitle">教えてください</div>
          </div>
        </div>

        {/* Google Form Iframe */}
        <div className="form-container">
          <iframe
            className="graduation-form"
            src="https://docs.google.com/forms/d/e/1FAIpQLScGVHG4PM06VSHLAa5KlJ8v0eNp2nsnr_QWvhie3vzvy1aZPw/viewform?embedded=true"
            title="Graduation Form"
          ></iframe>
        </div>
      </div>

      {/* <div className="form-actions">
        <button className="done-btn" type="button" onClick={handleDone} disabled={doneLoading}>
            {doneLoading ? "⏳ Menyimpan..." : "✅ Selesai"}
        </button>
      </div> */}

      {/* Background Music */}
      <audio
        autoPlay
        loop
        preload="auto"
        id="backgroundMusic"
        playsInline
        muted={isMuted}
        controls={false}
        onLoadedData={() => console.log("🎵 Audio element loaded")}
        onCanPlay={() => console.log("🎵 Audio can start playing")}
        onPlay={() => {
          console.log("🎵 Audio started playing");
          setIsPlaying(true);
        }}
        onPause={() => {
          console.log("🎵 Audio paused");
          setIsPlaying(false);
        }}
        onError={(e) => console.log("❌ Audio error:", e)}
      >
        <source src="/memories-2.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

export default DreamsPage;
