import { Race } from '@/app/types/Race';
import { db } from '@/firebase/firebaseConfig';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface UseRacesReturn {
  races: Race[];
  loading: boolean;
  error: string | null;
}

export function useRaces(): UseRacesReturn {
  const [races,   setRaces]   = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    // onSnapshot = atualização em tempo real.
    // Se adicionar/editar uma corrida no Firestore, o app atualiza sozinho.
    const racesQuery = query(
      collection(db, 'races'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(
      racesQuery,
      snapshot => {
        const data: Race[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Race, 'id'>),
        }));
        setRaces(data);
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // limpa o listener ao desmontar
  }, []);

  return { races, loading, error };
}
