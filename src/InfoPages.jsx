import { useEffect } from "react";

const REPO_URL = "https://github.com/ObscuroMagna/bad-takes";
const SUBMIT_TAKE_URL = `${REPO_URL}/issues/new?template=submit-a-take.yml`;
const CONTACT_URL = `${REPO_URL}/issues/new?template=contact.yml`;

const linkStyle = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  color: "#888",
  fontSize: 12,
  fontFamily: "inherit",
  letterSpacing: 1,
  textTransform: "uppercase",
  cursor: "pointer",
  textDecoration: "none",
  transition: "color 0.2s ease",
};

const sepStyle = {
  color: "#333",
  fontSize: 12,
  userSelect: "none",
};

export function Footer({ onOpen }) {
  return (
    <footer
      style={{
        marginTop: "auto",
        paddingTop: 32,
        paddingBottom: 16,
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        position: "relative",
        zIndex: 2,
      }}
    >
      <button type="button" style={linkStyle} onClick={() => onOpen("about")}>
        About
      </button>
      <span style={sepStyle}>·</span>
      <button type="button" style={linkStyle} onClick={() => onOpen("privacy")}>
        Privacy
      </button>
      <span style={sepStyle}>·</span>
      <button type="button" style={linkStyle} onClick={() => onOpen("contact")}>
        Contact
      </button>
      <span style={sepStyle}>·</span>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
      >
        Source ↗
      </a>
    </footer>
  );
}

const MODAL_CONTENT = {
  about: {
    title: "About",
    body: (
      <>
        <p>
          <strong>Bad Takes</strong> is a clapperboard that flicks through
          some of the worst opinions on the internet. Tap it (or shake your
          phone) for the next take, then vote it up or down.
        </p>
        <p>
          Verdicts run from <em>TRASH</em> to <em>CERTIFIED BANGER</em>,
          decided by the up/down ratio across everyone who has voted. Your
          single vote nudges the rating; thousands of votes shape it.
        </p>
        <p>
          Bad Takes is open source. Anyone can read the code, suggest a new
          take, or build their own version.
        </p>
      </>
    ),
    cta: { label: "View the project on GitHub", href: REPO_URL },
  },
  privacy: {
    title: "Privacy",
    body: (
      <>
        <p>
          Bad Takes does not collect personal information about you. There are
          no accounts, no analytics, no tracking pixels, no advertising, and
          no cookies set by this site.
        </p>
        <p>
          <strong>What is stored:</strong>
        </p>
        <ul>
          <li>
            <strong>Vote totals</strong> for each take are saved on a server
            as anonymous running counts. They are not tied to you or to any
            identifier.
          </li>
          <li>
            <strong>A small amount of local state</strong> is kept on your
            device so the page can remember which takes you've already
            interacted with. It never leaves your browser.
          </li>
        </ul>
        <p>
          <strong>What is not stored:</strong> your name, email, location,
          IP address, or any other information that could identify you.
        </p>
        <p>
          Vote counts are stored using a hosted database service provided by
          Google. The service has access only to the anonymous vote totals,
          not to anything that could be linked back to you.
        </p>
      </>
    ),
  },
  submit: {
    title: "Submit a Take",
    body: (
      <>
        <p>
          Got a take so bad it deserves a spot in the lineup? Submissions are
          handled through GitHub, where anyone can read, comment on, and
          eventually help triage them.
        </p>
        <p>
          Clicking the button below opens a pre-filled submission form. You'll
          need a free GitHub account to send it. Keep submissions short and
          avoid anything that targets real people.
        </p>
      </>
    ),
    cta: { label: "Open submission form ↗", href: SUBMIT_TAKE_URL },
  },
  contact: {
    title: "Contact",
    body: (
      <>
        <p>
          Found a bug, have feedback, or want to get in touch about something
          else? Messages go through GitHub, where the conversation stays
          public and anyone helping out with the project can see it.
        </p>
        <p>
          For take submissions, use the <em>Submit a Take</em> link in the
          footer instead — that one goes to a different form built for new
          takes.
        </p>
        <p>
          Clicking the button below opens a contact form. You'll need a free
          GitHub account to send it.
        </p>
      </>
    ),
    cta: { label: "Open contact form ↗", href: CONTACT_URL },
  },
};

export function InfoModal({ type, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!type) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while modal open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [type, onClose]);

  if (!type) return null;
  const content = MODAL_CONTENT[type];
  if (!content) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
        animation: "badtakes-fade-in 0.18s ease-out",
      }}
    >
      <style>{`
        @keyframes badtakes-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes badtakes-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #161624 0%, #0f0f1a 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          maxWidth: 560,
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          color: "#d8d8d0",
          fontFamily: "inherit",
          fontSize: 15,
          lineHeight: 1.55,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,200,50,0.05)",
          animation: "badtakes-slide-up 0.22s ease-out",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "50%",
            width: 32,
            height: 32,
            color: "#999",
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
          }}
        >
          ×
        </button>
        <div style={{ padding: "28px 28px 24px" }}>
          <h2
            style={{
              color: "#f5f5f0",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: -0.5,
              margin: "0 0 16px",
            }}
          >
            {content.title}
          </h2>
          <div style={{ color: "#bfbfb8" }}>{content.body}</div>
          {content.cta && (
            <div style={{ marginTop: 22 }}>
              <a
                href={content.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "rgba(255,200,50,0.12)",
                  border: "1px solid rgba(255,200,50,0.35)",
                  color: "#ffc832",
                  textDecoration: "none",
                  padding: "10px 18px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  transition: "all 0.2s ease",
                }}
              >
                {content.cta.label}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
