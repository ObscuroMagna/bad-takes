import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import useVotes from "./useVotes";
import useTakes from "./useTakes";

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

// Popcorn kernel colors (buttery palette)
const POPCORN_COLORS = [
  "#fff8dc", "#fffacd", "#ffefd5", "#fff5e1",
  "#f5deb3", "#ffe4b5", "#ffffff", "#fdf5e6",
];

// Rare drop emoji pool
const RARE_EMOJIS = ["🔥", "💀", "🤡", "💩", "😱", "🎬", "🍿", "⭐"];
const RARE_CHANCE = 0.12;

// Popcorn particle — CSS blob with random lumpy shape
function PopcornKernel({ startX, color }) {
  const size = useRef(8 + Math.random() * 10);
  const br = useRef(
    [30 + Math.random() * 40, 30 + Math.random() * 40,
     30 + Math.random() * 40, 30 + Math.random() * 40]
      .map((v) => v + "%").join(" ")
  );
  const duration = useRef(0.8 + Math.random() * 0.6);

  const [style, setStyle] = useState({
    position: "absolute",
    left: startX,
    bottom: 0,
    width: size.current,
    height: size.current * (0.8 + Math.random() * 0.4),
    background: color,
    borderRadius: br.current,
    boxShadow: "0 1px 3px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(200,170,100,0.3)",
    opacity: 1,
    transition: "none",
    pointerEvents: "none",
    zIndex: 100,
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      setStyle((s) => ({
        ...s,
        bottom: 150 + Math.random() * 200,
        left: startX + (Math.random() - 0.5) * 200,
        opacity: 0,
        transform: `rotate(${(Math.random() - 0.5) * 360}deg) scale(${0.5 + Math.random() * 0.5})`,
        transition: `all ${duration.current}s cubic-bezier(0.2, 0.8, 0.3, 1)`,
      }));
    });
  }, [startX]);

  return <div style={style} />;
}

// Emoji particle for rare drops
function EmojiParticle({ emoji, startX }) {
  const [style, setStyle] = useState({
    position: "absolute",
    fontSize: 22 + Math.random() * 10,
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
        bottom: 180 + Math.random() * 220,
        left: startX + (Math.random() - 0.5) * 180,
        opacity: 0,
        transform: `rotate(${(Math.random() - 0.5) * 90}deg) scale(${0.6 + Math.random() * 0.6})`,
        transition: `all ${1 + Math.random() * 0.5}s ease-out`,
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

// Responsive wrapper — scales the 340px clapperboard to fit narrow screens
const CLAP_NATIVE_W = 340;
const CLAP_NATIVE_H = 268;

function ClapperWrap({ children, onClick }) {
  const [scale, setScale] = useState(1);
  const wrapRef = useRef(null);

  useEffect(() => {
    function measure() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleW = Math.min(1, (vw - 48) / CLAP_NATIVE_W);
      const scaleH = Math.min(1, (vh * 0.33) / CLAP_NATIVE_H);
      setScale(Math.min(scaleW, scaleH));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      ref={wrapRef}
      onClick={onClick}
      style={{
        position: "relative",
        marginBottom: "min(20px, 2vh)",
        cursor: "pointer",
        width: CLAP_NATIVE_W * scale,
        height: CLAP_NATIVE_H * scale,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Simple mobile breakpoint hook
function useIsMobile(breakpoint = 600) {
  const [mobile, setMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    function onResize() { setMobile(window.innerWidth < breakpoint); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return mobile;
}

// (theme emojis/colors are defined above as POPCORN_COLORS and RARE_EMOJIS)

export default function App() {
  const isMobile = useIsMobile();
  const { takes, loading } = useTakes();

  // Build hash lookup whenever takes change
  const hashToIndex = useMemo(
    () => Object.fromEntries(takes.map((t, i) => [hashTake(t), i])),
    [takes]
  );

  // Resolve initial take from URL hash (only on first load after takes arrive)
  const resolvedInitial = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [showTake, setShowTake] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);
  const [takeOpacity, setTakeOpacity] = useState(0);
  const activeHash = currentIndex >= 0 ? hashTake(takes[currentIndex]) : null;
  const { getVote, voted, castVote, resetVoted } = useVotes(activeHash);

  // Once takes are loaded, check if URL hash matches a take
  useEffect(() => {
    if (loading || resolvedInitial.current) return;
    resolvedInitial.current = true;
    const hash = window.location.hash.slice(1);
    if (hash && hashToIndex[hash] !== undefined) {
      setCurrentIndex(hashToIndex[hash]);
      setShowTake(true);
      setTakeOpacity(1);
    }
  }, [loading, hashToIndex]);
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
    const isRare = Math.random() < RARE_CHANCE;
    const newParticles = [];

    // Always spawn popcorn kernels
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: particleId.current++,
        type: "popcorn",
        color: POPCORN_COLORS[Math.floor(Math.random() * POPCORN_COLORS.length)],
        x: 100 + Math.random() * 140,
      });
    }

    // Rare drop: add bonus emoji burst
    if (isRare) {
      for (let i = 0; i < 8; i++) {
        newParticles.push({
          id: particleId.current++,
          type: "emoji",
          emoji: RARE_EMOJIS[Math.floor(Math.random() * RARE_EMOJIS.length)],
          x: 80 + Math.random() * 180,
        });
      }
    }

    setParticles((p) => [...p, ...newParticles]);
    setTimeout(
      () =>
        setParticles((p) =>
          p.filter((pp) => !newParticles.find((np) => np.id === pp.id))
        ),
      1800
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
        justifyContent: "flex-start",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "min(24px, 3vh) 16px 16px",
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

      {/* Top spacer — pushes content down to roughly center, fixed size so it never shifts */}
      <div style={{ flexShrink: 0, height: isMobile ? "8vh" : "12vh" }} />

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
          fontSize: "clamp(11px, 3vw, 14px)",
          letterSpacing: "clamp(2px, 1vw, 4px)",
          textTransform: "uppercase",
          marginBottom: "min(12px, 1.5vh)",
        }}
      >
        {started
          ? "Another hot take from the internet"
          : "Click the clapperboard to start"}
      </p>

      <ClapperWrap onClick={nextTake}>
        <Clapperboard
          isOpen={isOpen}
          onAnimationEnd={handleClapperAnimationEnd}
        />
        {particles.map((p) =>
          p.type === "emoji" ? (
            <EmojiParticle key={p.id} emoji={p.emoji} startX={p.x} />
          ) : (
            <PopcornKernel key={p.id} startX={p.x} color={p.color} />
          )
        )}
      </ClapperWrap>

      {/* Bottom section — min-height reserves space so layout doesn't shift */}
      <div
        style={{
          minHeight: 240,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "100%",
        }}
      >
      {/* Take display area */}
      <div
        style={{
          minHeight: isMobile ? 160 : 180,
          maxWidth: 800,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 8px",
        }}
      >
        {showTake && currentIndex >= 0 && (
          <>
            {/* Desktop: row with flanking buttons. Mobile: just the film strip */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? 0 : 24,
              }}
            >
              {/* Trash vote button — desktop only (left side) */}
              {!isMobile && (
                <button
                  onClick={() => castVote("down")}
                  style={{
                    background: voted === "down" ? "rgba(244,67,54,0.15)" : "rgba(255,255,255,0.03)",
                    border: voted === "down" ? "2px solid rgba(244,67,54,0.5)" : "2px solid rgba(255,255,255,0.08)",
                    borderRadius: "50%",
                    width: 64,
                    height: 64,
                    minWidth: 64,
                    cursor: voted ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s ease",
                    opacity: takeOpacity * (voted && voted !== "down" ? 0.3 : 1),
                    transform: `scale(${voted === "down" ? 1.15 : takeOpacity})`,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{"\u{1F5D1}\uFE0F"}</span>
                </button>
              )}

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
                    padding: isMobile ? "16px 36px" : "20px min(48px, 8vw)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: isMobile ? 100 : 160,
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
                    {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
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
                    {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
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

                  {/* Take content — scales to fit on desktop, wraps on mobile */}
                  <div style={{ textAlign: "center", padding: "8px 0", width: "100%", overflow: "hidden" }}>
                    <p
                      ref={isMobile ? undefined : (el) => {
                        if (!el) return;
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
                        fontSize: isMobile ? "clamp(16px, 4.5vw, 24px)" : "clamp(24px, 5vw, 40px)",
                        fontWeight: 800,
                        lineHeight: 1.3,
                        margin: 0,
                        letterSpacing: -0.5,
                        textShadow: "0 2px 24px rgba(0,0,0,0.5)",
                        whiteSpace: isMobile ? "normal" : "nowrap",
                        transformOrigin: "center center",
                      }}
                    >
                      &ldquo;{takes[currentIndex]}&rdquo;
                    </p>
                  </div>

                  {/* Verdict rating */}
                  {(() => {
                    const { up, down } = getVote(activeHash);
                    const total = up + down;
                    const ratio = total === 0 ? 0.5 : up / total;
                    const verdicts = [
                      { icon: "\u{1F5D1}\uFE0F", label: "TRASH", color: "#f44336" },
                      { icon: "\u{267B}\uFE0F", label: "PRETTY BAD", color: "#ff7043" },
                      { icon: "\u{1F610}", label: "MEH", color: "#999" },
                      { icon: "\u{1F451}", label: "SOLID TAKE", color: "#ffb300" },
                      { icon: "\u{1F3C6}", label: "CERTIFIED BANGER", color: "#ffd700" },
                    ];
                    const level = total === 0 ? -1 : ratio <= 0.2 ? 0 : ratio <= 0.4 ? 1 : ratio <= 0.6 ? 2 : ratio <= 0.8 ? 3 : 4;
                    return (
                      <div
                        style={{
                          marginTop: 12,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 8,
                          minHeight: 32,
                        }}
                      >
                        {total > 0 ? (
                          <>
                            <span style={{ fontSize: 22 }}>{verdicts[level].icon}</span>
                            <span
                              style={{
                                color: verdicts[level].color,
                                fontSize: 12,
                                fontWeight: 700,
                                letterSpacing: 2,
                                fontFamily: "monospace",
                                textTransform: "uppercase",
                              }}
                            >
                              {verdicts[level].label}
                            </span>
                            <span
                              style={{
                                color: "#444",
                                fontSize: 11,
                                fontFamily: "monospace",
                              }}
                            >
                              ({total} vote{total !== 1 ? "s" : ""})
                            </span>
                          </>
                        ) : (
                          <span
                            style={{
                              color: "#444",
                              fontSize: 11,
                              fontFamily: "monospace",
                              letterSpacing: 1,
                            }}
                          >
                            CAST YOUR VOTE
                          </span>
                        )}
                      </div>
                    );
                  })()}
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

              {/* Trophy vote button — desktop only (right side) */}
              {!isMobile && (
                <button
                  onClick={() => castVote("up")}
                  style={{
                    background: voted === "up" ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.03)",
                    border: voted === "up" ? "2px solid rgba(255,215,0,0.5)" : "2px solid rgba(255,255,255,0.08)",
                    borderRadius: "50%",
                    width: 64,
                    height: 64,
                    minWidth: 64,
                    cursor: voted ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s ease",
                    opacity: takeOpacity * (voted && voted !== "up" ? 0.3 : 1),
                    transform: `scale(${voted === "up" ? 1.15 : takeOpacity})`,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{"\u{1F3C6}"}</span>
                </button>
              )}
            </div>

            {/* Mobile vote buttons — below the film strip */}
            {isMobile && (
              <div
                style={{
                  display: "flex",
                  gap: 32,
                  marginTop: 16,
                  opacity: takeOpacity,
                  transition: "opacity 0.4s ease-out",
                }}
              >
                <button
                  onClick={() => castVote("down")}
                  style={{
                    background: voted === "down" ? "rgba(244,67,54,0.15)" : "rgba(255,255,255,0.03)",
                    border: voted === "down" ? "2px solid rgba(244,67,54,0.5)" : "2px solid rgba(255,255,255,0.08)",
                    borderRadius: "50%",
                    width: 56,
                    height: 56,
                    cursor: voted ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s ease",
                    opacity: voted && voted !== "down" ? 0.3 : 1,
                    transform: `scale(${voted === "down" ? 1.15 : 1})`,
                  }}
                >
                  <span style={{ fontSize: 26 }}>{"\u{1F5D1}\uFE0F"}</span>
                </button>
                <button
                  onClick={() => castVote("up")}
                  style={{
                    background: voted === "up" ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.03)",
                    border: voted === "up" ? "2px solid rgba(255,215,0,0.5)" : "2px solid rgba(255,255,255,0.08)",
                    borderRadius: "50%",
                    width: 56,
                    height: 56,
                    cursor: voted ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s ease",
                    opacity: voted && voted !== "up" ? 0.3 : 1,
                    transform: `scale(${voted === "up" ? 1.15 : 1})`,
                  }}
                >
                  <span style={{ fontSize: 26 }}>{"\u{1F3C6}"}</span>
                </button>
              </div>
            )}
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
       