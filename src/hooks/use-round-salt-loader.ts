import { getRoundSalt } from "@/lib/firestore/round-firestore-repository";
import { useEffect, useState } from "react";

export function useRoundSaltLoader(roomId: string | null, roundId: string | null) {
  const [roundSalt, setRoundSalt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId || !roundId) return;
    setLoading(true);
    getRoundSalt(roomId, roundId)
      .then(setRoundSalt)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roomId, roundId]);

  return { roundSalt, loading };
}
