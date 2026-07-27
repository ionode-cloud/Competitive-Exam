import { useState, useEffect } from 'react';
import { RiDownloadLine } from 'react-icons/ri';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import api from '../api/axios';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const [revenue, setRevenue] = useState([]);
  const [students, setStudents] = useState([]);
  const [topTests, setTopTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/revenue'),
      api.get('/reports/students'),
      api.get('/reports/top-tests'),
    ]).then(([rRes, sRes, tRes]) => {
      setRevenue(rRes.data.data.map(d => ({ name: `${MONTHS[d._id.month - 1]} ${d._id.year}`, revenue: d.revenue, orders: d.orders })));
      setStudents(sRes.data.data.map(d => ({ name: MONTHS[d._id.month - 1], count: d.count })));
      setTopTests(tRes.data.data);
    }).catch(() => toast.error('Failed to load reports'))
    .finally(() => setLoading(false));
  }, []);

  const exportRevenue = async () => {
    try {
      const res = await api.get('/reports/export/revenue', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'revenue_report.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reports</h2>
        <button onClick={exportRevenue} className="admin-btn-secondary"><RiDownloadLine className="w-4 h-4" /> Export Revenue</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}/>
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Student Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={students}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
              <YAxis tick={{ fontSize: 10 }}/>
              <Tooltip/>
              <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Mock Tests */}
      <div className="admin-card">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Top Mock Tests by Attempts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>Mock Test</th><th>Exam</th><th>Attempts</th><th>Avg Score</th></tr></thead>
            <tbody>
              {topTests.map((t, i) => (
                <tr key={t._id}>
                  <td className="font-medium text-slate-800 dark:text-white"><span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold inline-flex items-center justify-center mr-2">{i+1}</span>{t.name}</td>
                  <td className="text-slate-500">{t.examination?.name}</td>
                  <td><span className="admin-badge-blue">{t.totalAttempts?.toLocaleString('en-IN')}</span></td>
                  <td>{t.averageScore?.toFixed(1) || '—'}</td>
                </tr>
              ))}
              {topTests.length === 0 && !loading && (
                <tr><td colSpan={4} className="text-center py-8 text-slate-400">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
