import { useEffect, useRef } from 'react';
import { useSoundAlert } from './useSoundAlert';

type StreamCallback = (data: any) => void;

export function useQueueStream(onQueueUpdate?: StreamCallback, onUserAlert?: StreamCallback) {
  const { playChime } = useSoundAlert();
  const updateRef = useRef(onQueueUpdate);
  const alertRef = useRef(onUserAlert);

  updateRef.current = onQueueUpdate;
  alertRef.current = onUserAlert;

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        es = new EventSource('/api/queues/stream');

        es.addEventListener('queue_update', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (updateRef.current) updateRef.current(data);
          } catch (err) {
            console.error('Error parsing queue_update SSE:', err);
          }
        });

        es.addEventListener('user_alert', (e) => {
          try {
            const data = JSON.parse(e.data);
            playChime();
            if (alertRef.current) alertRef.current(data);
          } catch (err) {
            console.error('Error parsing user_alert SSE:', err);
          }
        });

        es.onerror = () => {
          if (es) {
            es.close();
            es = null;
          }
          // Try reconnecting in 4 seconds
          reconnectTimeout = setTimeout(connect, 4000);
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (es) es.close();
    };
  }, []);
}
