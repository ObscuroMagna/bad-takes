import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";
import fallbackTakes from "./takes";

/**
 * Fetches takes from Firebase Realtime Database.
 * Falls back to the hardcoded list in takes.js if Firebase
 * is empty, unreachable, or still loading.
 *
 * Firebase structure:  takes/0: "Hot dogs are sandwiches", takes/1: "...", ...
 *
 * Returns { takes, loading }
 *   takes   – array of take strings
 *   loading – true while waiting for the first Firebase response
 */
export default function useTakes() {
  const [takes, setTakes] = useState(fallbackTakes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const takesRef = ref(db, "takes");
    const unsub = onValue(
      takesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Firebase might store as an array or an object keyed by index
          const arr = Array.isArray(data)
            ? data.filter(Boolean)
            : Object.values(data).filter(Boolean);
          if (arr.length > 0) {
            setTakes(arr);
          }
        }
        setLoading(false);
      },
      () => {
        // On error, keep fallback takes
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { takes, loading };
}
