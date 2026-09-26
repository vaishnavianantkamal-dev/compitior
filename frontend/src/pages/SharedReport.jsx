import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import ReportView from '../components/ReportView.jsx';

export default function SharedReport() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPublic(id).then(setDoc).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="notice risk">{error}</p>;
  if (!doc) return <p className="empty">Loading report…</p>;
  return (
    <div className="report">
      <ReportView doc={doc} />
    </div>
  );
}
