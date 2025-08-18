import { useState, useEffect } from 'react';
import { Project } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function useProjects(page = 1, pageSize = 10) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/projects/?skip=${(page - 1) * pageSize}&limit=${pageSize}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then(data => {
        const items = Array.isArray(data) ? data : (data.items || []);
        const totalVal = Array.isArray(data) ? data.length : (data.total || items.length || 0);
        setProjects(items);
        setTotal(totalVal);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  return { projects, loading, error, total };
}