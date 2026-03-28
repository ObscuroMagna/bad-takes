import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import { ref, onValue, runTransaction } from "firebase/database";

/**
 * Real-time vote hook backed by Firebase Realtime Database.
 *
 * Returns { votes, voted, castVote, resetVoted }
 *   votes   – object keyed by take index, e.g. { 0: { up: 3, down: 1 }, ... }
 *   voted   – "up" | "down" | null  (current user's vote for activeTakeIndex)
 *   castVote(direction)  – record a vote for the active take
 *   resetVoted()         – clear local voted state (call when moving to next take)
 */
export default function useVotes(takeCount, activeTakeIndex) {
  const [votes, setVotes] = useState({});
  const [voted, setVoted] = useState(null);

  // Subscribe to real-time vote updates
  useEffect(() => {
    const votesRef = ref(db, "votes");
    const unsub = onValue(votesRef, (snapshot) => {
      setVotes(snapshot.val() || {});
    });
    return unsub;
  }, []);

  // Cast a vote using a transaction (atomic increment, safe for concurrent users)
  const castVote = useCallback(
    (direction) => {
      if (voted || activeTakeIndex < 0) return;
      setVoted(direction);

      const voteRef = ref(db, `votes/${activeTakeIndex}/${direction}`);
      runTransaction(voteRef, (current) => (current || 0) + 1);
    },
    [voted, activeTakeIndex]
  );

  const resetVoted = useCallback(() => setVoted(null), []);

  // Helper to read counts safely
  const getVote = useCallback(
    (index) => ({
      up: votes[index]?.up || 0,
      down: votes[index]?.down || 0,
    }),
    [votes]
  );

  return { votes, getVote, voted, castVote, resetVoted };
}
