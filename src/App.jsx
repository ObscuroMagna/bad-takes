import { useState, useCallback, useEffect, useRef } from "react";
import takes from "./takes";

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
    <div style={{ position: "relative", width: BOARD_W, height: BOARD_H + CLAP_TOP + CLAP_H }}>
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

const emojis = ["\u{1F525}", "\u{1F480}", "\u{1F624}", "\u{1F921}", "\u{1F4A9}", "\u{1F644}", "\u{1F631}", "\u{1FAE0}"];

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [showTake, setShowTake] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);
  const [takeOpacity, setTakeOpacity] = useState(0);
  const particleId = useRef(0);

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

    setIsOpen(true);

    setTimeout(() => {
      setIsOpen(false);
      setCurrentIndex((i) => (i + 1) % takes.length);
    }, 300);
  }, [isAnimating]);

  const handleClapperAnimationEnd = useCallback(() => {
    if (!isOpen && currentIndex >= 0) {
      setShowTake(true);
      spawnParticles();
      setTimeout(() => setTakeOpacity(1), 50);
      setTimeout(() => setIsAnimating(false), 200);
    }
  }, [isOpen, currentIndex, spawnParticles]);

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
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: -1,
          marginBottom: 8,
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
          marginBottom: 48,
        }}
      >
        {started
          ? `Take ${currentIndex + 1} of ${takes.length}`
          : "Click the clapperboard to start"}
      </p>

      <div
        style={{ position: "relative", marginBottom: 48, cursor: "pointer" }}
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

      <div
        style={{
          minHeight: 120,
          maxWidth: 500,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {showTake && currentIndex >= 0 && (
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "28px 36px",
              backdropFilter: "blur(10px)",
              opacity: takeOpacity,
              transform: takeOpacity === 1 ? "translateY(0)" : "translateY(10px)",
              transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
            }}
          >
            <p
              style={{
                color: "#f5f5f0",
                fontSize: 22,
                fontWeight: 600,
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              &ldquo;{takes[currentIndex]}&rdquo;
            </p>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    color: i < 1 + Math.floor(Math.random() * 2) ? "#ffd700" : "#333",
                  }}
                >
                  &#9733;
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {started && (
        <p
          style={{
            color: "#444",
            fontSize: 13,
            marginTop: 32,
            letterSpacing: 1,
          }}
        >
          CLICK CLAPPERBOARD FOR NEXT TAKE
        </p>
      )}
    </div>
  );
}
