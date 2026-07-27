import { useState } from 'react';
import { RiSearchLine, RiDeleteBin2Line, RiArrowLeftSLine, RiArrowRightSLine, RiLoader4Line } from 'react-icons/ri';

export default function DataTable({
  columns,           // [{ key, label, render, sortable }]
  data,              // array of rows
  total,             // total items
  page,
  limit,
  onPageChange,
  loading,
  search,
  onSearch,
  searchPlaceholder = 'Search...',
  selectedIds,
  onSelectionChange,
  onBulkDelete,
  emptyMessage = 'No data found',
  actions,           // JSX — buttons to show in header
}) {
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const totalPages = Math.ceil((total || 0) / (limit || 10));

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const toggleAll = (e) => {
    if (e.target.checked) onSelectionChange?.(data.map(r => r._id));
    else onSelectionChange?.([]);
  };

  const toggleRow = (id) => {
    const next = selectedIds?.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...(selectedIds || []), id];
    onSelectionChange?.(next);
  };

  return (
    <div className="admin-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          {onSearch && (
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={e => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="admin-input pl-9 w-52"
              />
            </div>
          )}
          {selectedIds?.length > 0 && onBulkDelete && (
            <button
              onClick={onBulkDelete}
              className="admin-btn-danger"
            >
              <RiDeleteBin2Line className="w-4 h-4" />
              Delete ({selectedIds.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {onSelectionChange && (
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    checked={selectedIds?.length === data?.length && data?.length > 0}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.sortable ? 'cursor-pointer select-none hover:text-primary-600' : ''}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {onSelectionChange && <td><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>}
                  {columns.map(col => (
                    <td key={col.key}><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : data?.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="text-center py-12 text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <RiSearchLine className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={row._id}>
                  {onSelectionChange && (
                    <td>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        checked={selectedIds?.includes(row._id)}
                        onChange={() => toggleRow(row._id)}
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total} results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <RiArrowLeftSLine className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                    page === p
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <RiArrowRightSLine className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
