interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, total, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex justify-center mt-6">
      <ul className="inline-flex items-center space-x-1">
        <li>
          <button
            className="px-3 py-1 rounded-l bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            Prev
          </button>
        </li>
        {pages.map(p => (
          <li key={p}>
            <button
              className={`px-3 py-1 ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
              onClick={() => onPageChange(p)}
              disabled={p === page}
            >
              {p}
            </button>
          </li>
        ))}
        <li>
          <button
            className="px-3 py-1 rounded-r bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
} 