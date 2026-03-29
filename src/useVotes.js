import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import { ref, onValue, runTransaction } from "firebase/database";

/**
 * Real-time vote hook backed by Firebase Realtime Database.
 * Votes are keyed by take hash (not index) so they survive reordering.
 *
 * Returns { votes, getVote, voted, castVote, resetVoted }
 *   votes   – object keyed by take hash, e.g. { "1ta3tzf": { up: 9 }, ... }
 *   getVote(hash) – returns { up, down } for a given take hash
 *   voted   – "up" | "down" | null  (current user's vote for activeHash)
 *   castVote(direction)  – record a vote for the active take
 *   resetVoted()         – clear local voted state (call when moving to next take)
 */
export default function useVotes(activeHash) {
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
      if (voted || !activeHash) return;
      setVoted(direction);

      const voteRef = ref(db, `votes/${activeHash}/${direction}`);
      runTransaction(voteRef, (current) => (current || 0) + 1);
    },
    [voted, activeHash]
  );

  const resetVoted = useCallback(() => setVoted(null), []);

  // Helper to read counts safely
  const getVote = useCallback(
    (hash) => ({
      up: votes[hash]?.up || 0,
      down: votes[hash]?.down || 0,
    }),
    [votes]
  );

  return { votes, getVote, voted, castVote, resetVoted };
}
