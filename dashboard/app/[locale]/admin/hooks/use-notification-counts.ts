'use client';

import { useEffect, useState } from 'react';

type NotificationCounts = {
  services: number;
  messages: number;
  contacts: number;
  leads: number;
  questionnaires: number;
  totalMessages: number;
};

export function useNotificationCounts() {
  const [counts, setCounts] = useState<NotificationCounts>({
    services: 0,
    messages: 0,
    contacts: 0,
    leads: 0,
    questionnaires: 0,
    totalMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch('/api/admin/notification-counts');
        if (response.ok) {
          const data = await response.json();
          setCounts(data);
        }
      } catch (error) {
        console.error('Failed to fetch notification counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { counts, loading };
}