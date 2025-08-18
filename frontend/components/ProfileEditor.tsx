import { useState } from 'react';

interface ProfileEditorProps {
  initialEmail: string;
  initialSkills?: string;
  initialRate?: number;
  onSave: (data: { email: string; skills: string; rate: number; portfolioFile?: File }) => void;
  loading?: boolean;
}

export default function ProfileEditor({ initialEmail, initialSkills = '', initialRate = 0, onSave, loading }: ProfileEditorProps) {
  const [email, setEmail] = useState(initialEmail);
  const [skills, setSkills] = useState(initialSkills);
  const [rate, setRate] = useState(initialRate.toString());
  const [portfolioFile, setPortfolioFile] = useState<File | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ email, skills, rate: Number(rate), portfolioFile });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 space-y-4 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Skills</label>
        <input
          type="text"
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          value={skills}
          onChange={e => setSkills(e.target.value)}
          placeholder="e.g. Solidity, React, Python"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Hourly Rate (USD)</label>
        <input
          type="number"
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
          value={rate}
          onChange={e => setRate(e.target.value)}
          min={0}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Portfolio (IPFS Upload)</label>
        <input
          type="file"
          className="mt-1 block w-full"
          onChange={e => setPortfolioFile(e.target.files?.[0])}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
} 