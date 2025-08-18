interface Milestone {
  description: string;
  amount: number;
  funded: boolean;
  released: boolean;
}

export default function MilestoneList({ milestones }: { milestones: Milestone[] }) {
  if (!milestones.length) {
    return <div className="text-gray-500 text-center py-4">No milestones defined.</div>;
  }
  return (
    <div className="divide-y divide-gray-200 bg-white rounded-lg shadow">
      {milestones.map((m, i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3">
          <div>
            <div className="font-medium text-gray-800">{m.description}</div>
            <div className="text-sm text-gray-500">Amount: <span className="text-green-700 font-semibold">${m.amount}</span></div>
          </div>
          <div className="mt-2 sm:mt-0">
            {m.released ? (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Released</span>
            ) : m.funded ? (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Funded</span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-semibold">Pending</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 