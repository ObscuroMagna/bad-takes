import { useState, useCallback, useEffect, useRef } from "react";
import takes from "./takes";
import useVotes from "./useVotes";

// Shared stripe elements for both clapper bars.
// yOffset shifts the stripe origin so skewX alignment is continuous across bars.
function ClapperStripes({ invert, yOffset = 0 }) {
  const STRIPE_W = 36;
  const count = 14;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: yOffset,
        bottom: -yOffset,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * STRIPE_W - 60,
            top: -20,
            width: STRIPE_W,
            bottom: -20,
            background:
              (invert ? i % 2 !== 0 : i % 2 === 0) ? "#1a1a1a" : "#f5f5f0",
            transform: "skewX(-20deg)",
          }}
        />
      ))}
    </div>
  );
}

// Clapperboard component
function Clapperboard({ isOpen, onAnimationEnd }) {
  const BOARD_W = 340;
  const BOARD_H = 230;
  const CLAP_H = 28;
  const CLAP_TOP = 10;

  return (
    <div style={{ position: "relative", width: BOARD_W, height: BOARD_H + CLAP_TOP + CLAP_H, overflow: "visible", flexShrink: 0 }}>
      {/* Board body */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: BOARD_W,
          height: BOARD_H,
          background: "#1a1a1a",
          borderRadius: 12,
          border: "3px solid #333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Diagonal stripes background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            background:
              "repeating-linear-gradient(45deg, #fff, #fff 10px, transparent 10px, transparent 20px)",
          }}
        />
        {/* Film details on board */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 16,
            right: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {[
            { label: "PROD", value: "BAD TAKES" },
            { label: "DIRECTOR", value: "THE INTERNET" },
            { label: "DATE", value: new Date().toLocaleDateString() },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderBottom: "1px solid #333",
                paddingBottom: 4,
              }}
            >
              <span
                style={{
                  color: "#888",
                  fontSize: 11,
                  fontFamily: "monospace",
                  width: 70,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Clapper top (animated) */}
      <div
        onTransitionEnd={onAnimationEnd}
        style={{
          position: "absolute",
          top: isOpen ? 0 : CLAP_TOP,
          left: 0,
          width: BOARD_W,
          height: CLAP_H,
          transformOrigin: "0% 100%",
          transform: isOpen ? "rotate(-30deg)" : "rotate(0deg)",
          transition: isOpen
            ? "transform 0.15s ease-out, top 0.15s ease-out"
            : "transform 0.25s cubic-bezier(0.2, 0, 0.8, 1.6), top 0.25s cubic-bezier(0.2, 0, 0.8, 1.6)",
          zIndex: 10,
          cursor: "pointer",
          overflow: "hidden",
          borderRadius: "6px 6px 0 0",
          boxShadow: isOpen
            ? "0 4px 16px rgba(0,0,0,0.3)"
            : "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <ClapperStripes invert={false} />
      </div>

      {/* Bottom clapper bar (static, sits at top of board) */}
      <div
        style={{
          position: "absolute",
          top: CLAP_TOP + CLAP_H,
          left: 0,
          width: BOARD_W,
          height: CLAP_H,
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        <ClapperStripes invert={true} yOffset={-CLAP_H} />
      </div>
    </div>
  );
}

// Floating emoji particles
function Particle({ emoji, startX }) {
  const [style, setStyle] = useState({
    position: "absolute",
    fontSize: 24,
    left: startX,
    bottom: 0,
    opacity: 1,
    transition: "none",
    pointerEvents: "none",
    zIndex: 100,
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      setStyle((s) => ({
        ...s,
        bottom: 200 + Math.random() * 200,
        left: startX + (Math.random() - 0.5) * 120,
        opacity: 0,
        transform: `rotate(${(Math.random() - 0.5) * 60}deg)`,
        transition: "all 1.2s ease-out",
      }));
    });
  }, [startX]);

  return <div style={style}>{emoji}</div>;
}

// Detect phone shake via DeviceMotion API
function useShake(onShake, threshold = 25) {
  const lastShake = useRef(0);

  useEffect(() => {
    function handleMotion(e) {
      const { x, y, z } = e.accelerationIncludingGravity || {};
      if (x == null) return;

      const force = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (force > threshold && now - lastShake.current > 800) {
        lastShake.current = now;
        onShake();
      }
    }

    // iOS 13+ requires permission request
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      function requestOnTap() {
        DeviceMotionEvent.requestPermission()
          .then((state) => {
            if (state === "granted") {
              window.addEventListener("devicemotion", handleMotion);
            }
          })
          .catch(() => {});
        window.removeEventListener("click", requestOnTap);
      }
      window.addEventListener("click", requestOnTap);
      return () => {
        window.removeEventListener("click", requestOnTap);
        window.removeEventListener("devicemotion", handleMotion);
      };
    }

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [onShake, threshold]);
}

// Generate a short opaque hash from a take string (no spoilers)
function hashTake(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36).padStart(6, "0");
}

// Build a lookup map: hash -> index
const hashToIndex = Object.fromEntries(takes.map((t, i) => [hashTake(t), i]));

// Read initial take from URL hash
function getInitialIndex() {
  const hash = window.location.hash.slice(1);
  if (hash && hashToIndex[hash] !== undefined) return hashToIndex[hash];
  return -1;
}

const emojis = ["\u{1F525}", "\u{1F480}", "\u{1F624}", "\u{1F921}", "\u{1F4A9}", "\u{1F644}", "\u{1F631}", "\u{1FAE0}"];

export default function App() {
  const [initialFromUrl] = useState(getInitialIndex() >= 0);
  const [currentIndex, setCurrentIndex] = useState(getInitialIndex);
  const [isOpen, setIsOpen] = useState(false);
  const [showTake, setShowTake] = useState(initialFromUrl);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);
  const [takeOpacity, setTakeOpacity] = useState(initialFromUrl ? 1 : 0);
  const { getVote, voted, castVote, resetVoted } = useVotes(takes.length, currentIndex);
  const [copied, setCopied] = useState(false);
  const particleId = useRef(0);
  const clapSound = useRef(null);

  // Preload clap sound once
  useEffect(() => {
    clapSound.current = new Audio("/clap.mp3");
    clapSound.current.preload = "auto";
  }, []);

  const playClap = useCallback(() => {
    if (clapSound.current) {
      clapSound.current.currentTime = 0;
      clapSound.current.play().catch(() => {});
    }
  }, []);

  // Sync URL hash with current take
  useEffect(() => {
    if (currentIndex >= 0) {
      window.location.hash = hashTake(takes[currentIndex]);
    }
  }, [currentIndex]);

  // Trigger next take on phone shake
  useShake(useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true);
      setShowTake(false);
      setTakeOpacity(0);
      resetVoted();
      setIsOpen(true);
      setTimeout(() => {
        setIsOpen(false);
        setCurrentIndex((prev) => {
          let next;
          do { next = Math.floor(Math.random() * takes.length); } while (next === prev && takes.length > 1);
          return next;
        });
      }, 300);
    }
  }, [isAnimating, resetVoted]));

  const spawnParticles = useCallback(() => {
    const newParticles = Array.from({ length: 6 }).map(() => ({
      id: particleId.current++,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: 100 + Math.random() * 140,
    }));
    setParticles((p) => [...p, ...newParticles]);
    setTimeout(
      () =>
        setParticles((p) =>
          p.filter((pp) => !newParticles.find((np) => np.id === pp.id))
        ),
      1500
    );
  }, []);

  const nextTake = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setShowTake(false);
    setTakeOpacity(0);
    resetVoted();

    setIsOpen(true);

    setTimeout(() => {
      setIsOpen(false);
      setCurrentIndex((prev) => {
        let next;
        do { next = Math.floor(Math.random() * takes.length); } while (next === prev && takes.length > 1);
        return next;
      });
    }, 300);
  }, [isAnimating]);

  const handleClapperAnimationEnd = useCallback(() => {
    if (!isOpen && currentIndex >= 0) {
      playClap();
      setShowTake(true);
      spawnParticles();
      setTimeout(() => setTakeOpacity(1), 50);
      setTimeout(() => setIsAnimating(false), 200);
    }
  }, [isOpen, currentIndex, spawnParticles, playClap]);

  const started = currentIndex >= 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: 24,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Spotlight effect */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "120%",
          height: "60%",
          background:
            "radial-gradient(ellipse at center, rgba(255,200,50,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <h1
        style={{
          color: "#f5f5f0",
          fontSize: "clamp(32px, 8vw, 48px)",
          fontWeight: 900,
          letterSpacing: -1,
          marginBottom: 4,
          textShadow: "0 2px 20px rgba(255,200,50,0.2)",
        }}
      >
        BAD TAKES
      </h1>
      <p
        style={{
          color: "#666",
          fontSize: 14,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        {started
          ? "Another hot take from the internet"
          : "Click the clapperboard to start"}
      </p>

      <div
        style={{
          position: "relative",
          marginBottom: 20,
          cursor: "pointer",
          height: 268,
          width: 340,
          flexShrink: 0,
        }}
        onClick={nextTake}
      >
        <Clapperboard
          isOpen={isOpen}
          onAnimationEnd={handleClapperAnimationEnd}
        />
        {particles.map((p) => (
          <Particle key={p.id} emoji={p.emoji} startX={p.x} />
        ))}
      </div>

      {/* Bottom section — fixed height so layout never shifts */}
      <div
        style={{
          height: 320,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "100%",
        }}
      >
      {/* Take display: vote buttons flanking film strip */}
      <div
        style={{
          minHeight: 180,
          maxWidth: 800,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "min(24px, 3vw)",
          padding: "0 8px",
        }}
      >
        {showTake && currentIndex >= 0 && (
          <>
            {/* Upvote button — left side */}
            <button
              onClick={() => castVote("up")}
              style={{
                background: voted === "up" ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.03)",
                border: voted === "up" ? "2px solid rgba(76,175,80,0.5)" : "2px solid rgba(255,255,255,0.08)",
                borderRadius: "50%",
                width: "min(56px, 12vw)",
                height: "min(56px, 12vw)",
                minWidth: "min(56px, 12vw)",
                cursor: voted ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s ease",
                opacity: takeOpacity * (voted && voted !== "up" ? 0.3 : 1),
                transform: `scale(${voted === "up" ? 1.2 : takeOpacity})`,
              }}
            >
              <span style={{ fontSize: "min(26px, 6vw)" }}>{"\u{1F44D}"}</span>
            </button>

            {/* Take text — film strip frame */}
            <div
              style={{
                flex: 1,
                opacity: takeOpacity,
                transform: takeOpacity === 1 ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
                transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
                position: "relative",
              }}
            >
              {/* Film strip container */}
              <div
                style={{
                  position: "relative",
                  background: "#111",
                  borderRadius: 6,
                  border: "2px solid #222",
                  padding: "20px min(48px, 8vw)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 160,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
                }}
              >
                {/* Left sprocket holes */}
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 12,
                    bottom: 12,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-evenly",
                    gap: 6,
                  }}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: 10,
                        borderRadius: 2,
                        background: "#0a0a0a",
                        border: "1px solid #1a1a1a",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
                      }}
                    />
                  ))}
                </div>

                {/* Right sprocket holes */}
                <div
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 12,
                    bottom: 12,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-evenly",
                    gap: 6,
                  }}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 14,
                        height: 10,
                        borderRadius: 2,
                        background: "#0a0a0a",
                        border: "1px solid #1a1a1a",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
                      }}
                    />
                  ))}
                </div>

                {/* Film frame lines — top and bottom */}
                <div style={{ position: "absolute", top: 6, left: 28, right: 28, height: 1, background: "#2a2a2a" }} />
                <div style={{ position: "absolute", bottom: 6, left: 28, right: 28, height: 1, background: "#2a2a2a" }} />

                {/* Take content — single line, scales to fit */}
                <div style={{ textAlign: "center", padding: "8px 0", width: "100%", overflow: "hidden" }}>
                  <p
                    ref={(el) => {
                      if (!el) return;
                      // Reset scale to measure natural width
                      el.style.transform = "none";
                      const parent = el.parentElement;
                      const parentW = parent.clientWidth;
                      const textW = el.scrollWidth;
                      if (textW > parentW) {
                        el.style.transform = `scaleX(${parentW / textW})`;
                      }
                    }}
                    style={{
                      color: "#f5f5f0",
                      fontSize: "clamp(24px, 5vw, 40px)",
                      fontWeight: 800,
                      lineHeight: 1.3,
                      margin: 0,
                      letterSpacing: -0.5,
                      textShadow: "0 2px 24px rgba(0,0,0,0.5)",
                      whiteSpace: "nowrap",
                      transformOrigin: "center center",
                    }}
                  >
                    &ldquo;{takes[currentIndex]}&rdquo;
                  </p>

                  {/* Star rating */}
                  {(() => {
                    const { up, down } = getVote(currentIndex);
                    const total = up + down;
                    const rating = total === 0 ? 0 : Math.round((up / total) * 5);
                    return (
                      <div
                        style={{
                          marginTop: 14,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 16,
                              color: i < rating ? "#ffd700" : "#333",
                              transition: "color 0.3s ease",
                            }}
                          >
                            &#9733;
                          </span>
                        ))}
                        {total > 0 && (
                          <span
                            style={{
                              color: "#555",
                              fontSize: 11,
                              marginLeft: 6,
                              fontFamily: "monospace",
                            }}
                          >
                            ({total} vote{total !== 1 ? "s" : ""})
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Subtle film grain overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 6,
                  opacity: 0.04,
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Downvote button — right side */}
            <button
              onClick={() => castVote("down")}
              style={{
                background: voted === "down" ? "rgba(244,67,54,0.15)" : "rgba(255,255,255,0.03)",
                border: voted === "down" ? "2px solid rgba(244,67,54,0.5)" : "2px solid rgba(255,255,255,0.08)",
                borderRadius: "50%",
                width: "min(56px, 12vw)",
                height: "min(56px, 12vw)",
                minWidth: "min(56px, 12vw)",
                cursor: voted ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s ease",
                opacity: takeOpacity * (voted && voted !== "down" ? 0.3 : 1),
                transform: `scale(${voted === "down" ? 1.2 : takeOpacity})`,
              }}
            >
              <span style={{ fontSize: "min(26px, 6vw)" }}>{"\u{1F44E}"}</span>
            </button>
          </>
        )}
      </div>

      {/* Share / Copy URL buttons */}
      {showTake && currentIndex >= 0 && (
        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 12,
            opacity: takeOpacity,
            transition: "opacity 0.4s ease-out",
          }}
        >
          {typeof navigator.share === "function" && (
            <button
              onClick={() => {
                navigator.share({
                  title: "Bad Takes",
                  text: `"${takes[currentIndex]}" \u2014 rate this bad take!`,
                  url: window.location.href,
                }).catch(() => {});
              }}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "8px 18px",
                cursor: "pointer",
                color: "#999",
                fontSize: 13,
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 16 }}>{"\u{1F4E4}"}</span> Share
            </button>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }).catch(() => {});
            }}
            style={{
              background: copied ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.05)",
              border: copied ? "1px solid rgba(76,175,80,0.4)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "8px 18px",
              cursor: "pointer",
              color: copied ? "#8f8" : "#999",
              fontSize: 13,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
          >
            <span style={{ fontSize: 16 }}>{copied ? "\u{2705}" : "\u{1F517}"}</span>
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}

      {started && (
        <p
          style={{
            color: "#444",
            fontSize: 13,
            marginTop: 20,
            letterSpacing: 1,
          }}
        >
          TAP CLAPPERBOARD OR SHAKE FOR NEXT TAKE
        </p>
      )}
      </div>
    </div>
  );
}
