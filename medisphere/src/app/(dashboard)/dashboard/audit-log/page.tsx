'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, Filter, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, buildQueryString, getErrorMessage } from '@/lib/api-client';

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-700',
  READ: 'bg-blue-50 text-blue-700',
  UPDATE: 'bg-amber-50 text-amber-700',
  DELETE: 'bg-red-50 text-red-700',
  LOGIN: 'bg-gray-50 text-gray-600',
};

const ITEMS_PER_PAGE = 6;

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [auditEntriesData, setAuditEntriesData] = useState<any[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const qs = buildQueryString({ page, limit: ITEMS_PER_PAGE, search: search || undefined });
        const res = await api.get<any>(`/api/audit-logs${qs}`);
        if (cancelled) return;
        const items = res.data ?? res.auditLogs ?? res.logs ?? [];
        const mapped = items.map((e: any) => {
          const firstName = e.user?.firstName ?? '';
          const lastName = e.user?.lastName ?? '';
          return {
            id: e.id,
            timestamp: e.timestamp
              ? e.timestamp.includes('T')
                ? new Date(e.timestamp).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : e.timestamp
              : '',
            user: `${firstName} ${lastName}`.trim() || e.userName || 'Unknown',
            action: e.action ?? '',
            resource: e.resource ?? '',
            resourceId: e.resourceId ?? e.resource_id ?? '',
            details: e.details ?? e.detail ?? '',
          };
        });
        setAuditEntriesData(mapped);
        setTotalEntries(res.total ?? items.length);
        setTotalPages(res.totalPages ?? Math.ceil((res.total ?? items.length) / ITEMS_PER_PAGE));
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [search, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  if (loading && auditEntriesData.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-3 text-gray-500">Loading audit log...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log Viewer</h1>
          <p className="text-gray-500 mt-1">Searchable compliance audit trail</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}. Please ensure the database is running.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log Viewer</h1>
        <p className="text-gray-500 mt-1">Searchable compliance audit trail</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search audit entries..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Audit Entries
            <span className="text-sm font-normal text-gray-400 ml-2">({totalEntries} entries)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Action</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Resource</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Resource ID</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditEntriesData.map((entry, index) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{entry.timestamp}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{entry.user}</td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', actionColors[entry.action])}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{entry.resource}</td>
                    <td className="py-3 px-4 text-gray-500 font-mono">{entry.resourceId}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{entry.details}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg transition-colors',
                      p === page
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
