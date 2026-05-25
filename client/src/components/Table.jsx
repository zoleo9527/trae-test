
export default function Table({ headers, children, emptyMessage = '暂无数据' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {children}
        </tbody>
      </table>
      {Array.isArray(children) && children.length === 0 && (
        <div className="text-center py-12 text-gray-400">{emptyMessage}</div>
      )}
    </div>
  );
}
