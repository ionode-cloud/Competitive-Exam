import { useEffect, useState } from 'react';
import {
  RiUserLine, RiFileTextLine, RiCheckboxCircleLine, RiDraftLine,
  RiQuestionLine, RiBookOpenLine, RiMoneyDollarCircleLine, RiTimeLine,
  RiLiveLine, RiCalendarLine, RiArrowUpLine, RiArrowDownLine
} from 'react-icons/ri';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api/axios';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'];

/* ─── Demo fallback data for empty state ─── */
const now = new Date();
const DEMO_REVENUE = Array.from({ length: 6 }, (_, i) => {
  const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
  return { name: MONTHS[m.getMonth()], revenue: Math.floor(12000 + Math.random() * 38000), orders: Math.floor(5 + Math.random() * 25) };
});
const DEMO_GROWTH = Array.from({ length: 6 }, (_, i) => {
  const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
  return { name: MONTHS[m.getMonth()], students: Math.floor(8 + i * 12 + Math.random() * 20) };
});
const DEMO_ATTEMPTS = [
  { name: 'OPSC OAS Prelim 2024', attempts: 1420 },
  { name: 'OSSSC RI 2024',        attempts: 987  },
  { name: 'Odisha Police SI',     attempts: 856  },
  { name: 'OSSC CGL 2024',        attempts: 634  },
  { name: 'OPSC APO 2024',        attempts: 412  },
];
const DEMO_PIE = [
  { name: 'Easy',     value: 35 },
  { name: 'Moderate', value: 45 },
  { name: 'Difficult', value: 20 },
];

/* ─── Custom tooltip ─── */
const CustomTooltipRevenue = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      <p className="text-blue-500 font-bold">₹{payload[0]?.value?.toLocaleString('en-IN')}</p>
      {payload[1] && <p className="text-slate-400 text-xs">{payload[1].value} orders</p>}
    </div>
  );
};
const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      <p className="text-purple-500 font-bold">{payload[0]?.value} students</p>
    </div>
  );
};
const CustomTooltipAttempts = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1 max-w-[180px] truncate">{label}</p>
      <p className="text-emerald-500 font-bold">{payload[0]?.value?.toLocaleString()} attempts</p>
    </div>
  );
};

/* ─── Stat card ─── */
const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="stat-card group hover:-translate-y-0.5 transition-transform duration-200">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color} shadow-md`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      {sub && (
        <p className={`text-xs flex items-center gap-0.5 mt-0.5 ${trend === 'down' ? 'text-red-400' : 'text-emerald-500'}`}>
          {trend === 'down' ? <RiArrowDownLine className="w-3 h-3" /> : <RiArrowUpLine className="w-3 h-3" />}
          {sub}
        </p>
      )}
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="stat-card animate-pulse">
    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
    </div>
  </div>
);

/* ─── Chart card wrapper ─── */
const ChartCard = ({ title, badge, children }) => (
  <div className="admin-card p-5">
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{title}</h3>
      {badge && (
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  /* Use real data if available, otherwise show demo data */
  const monthlyRevenueData = (charts.monthlyRevenue?.length
    ? charts.monthlyRevenue.map(d => ({ name: MONTHS[d._id.month - 1], revenue: d.revenue, orders: d.orders }))
    : DEMO_REVENUE);

  const studentGrowthData = (charts.studentGrowth?.length
    ? charts.studentGrowth.map(d => ({ name: MONTHS[d._id.month - 1], students: d.count }))
    : DEMO_GROWTH);

  const testAttemptsData = (charts.mockTestAttempts?.length
    ? charts.mockTestAttempts.map(d => ({ name: d.name, attempts: d.attempts }))
    : DEMO_ATTEMPTS);

  const isDemoRevenue  = !charts.monthlyRevenue?.length;
  const isDemoGrowth   = !charts.studentGrowth?.length;
  const isDemoAttempts = !charts.mockTestAttempts?.length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {loading ? (
          Array(10).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={RiUserLine}              label="Total Students"  value={stats.totalStudents  || 0} sub="Active learners"   color="bg-blue-500"    />
            <StatCard icon={RiFileTextLine}          label="Total Mock Tests" value={stats.totalMockTests || 0}                       color="bg-purple-500"  />
            <StatCard icon={RiCheckboxCircleLine}    label="Published Tests"  value={stats.publishedTests || 0}                       color="bg-emerald-500" />
            <StatCard icon={RiDraftLine}             label="Draft Tests"      value={stats.draftTests     || 0}                       color="bg-amber-500"   />
            <StatCard icon={RiQuestionLine}          label="Total Questions"  value={stats.questionCount  || 0}                       color="bg-rose-500"    />
            <StatCard icon={RiBookOpenLine}          label="Subjects"         value={stats.subjectCount   || 0}                       color="bg-cyan-500"    />
            <StatCard icon={RiMoneyDollarCircleLine} label="Total Revenue"    value={`₹${(stats.totalRevenue   || 0).toLocaleString('en-IN')}`} color="bg-green-600"   />
            <StatCard icon={RiTimeLine}              label="Today's Revenue"  value={`₹${(stats.todayRevenue   || 0).toLocaleString('en-IN')}`} color="bg-indigo-500"  />
            <StatCard icon={RiLiveLine}              label="Live Exams"       value={stats.liveExams      || 0}                       color="bg-red-500"     />
            <StatCard icon={RiCalendarLine}          label="Scheduled"        value={stats.pendingExams   || 0}                       color="bg-orange-500"  />
          </>
        )}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Revenue — Area Chart */}
        <ChartCard title="Monthly Revenue" badge={isDemoRevenue ? 'Sample Data' : 'Last 6 months'}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyRevenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
              />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Area
                type="monotone" dataKey="revenue"
                stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#revenueGrad)" dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {isDemoRevenue && (
            <p className="text-center text-xs text-slate-400 mt-2">Add purchases to see real revenue data</p>
          )}
        </ChartCard>

        {/* Student Growth — Bar Chart */}
        <ChartCard title="Student Growth" badge={isDemoGrowth ? 'Sample Data' : 'Last 6 months'}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={studentGrowthData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={32}>
              <defs>
                <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={1}   />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltipBar />} />
              <Bar dataKey="students" fill="url(#studentGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {isDemoGrowth && (
            <p className="text-center text-xs text-slate-400 mt-2">Register students to see real growth data</p>
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Mock Tests by Attempts — Horizontal Bar (spans 2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard title="Top Mock Tests by Attempts" badge={isDemoAttempts ? 'Sample Data' : 'Top 5'}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={testAttemptsData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                barSize={14}
              >
                <defs>
                  <linearGradient id="attemptGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name" type="category"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                  width={130}
                  tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v}
                />
                <Tooltip content={<CustomTooltipAttempts />} />
                <Bar dataKey="attempts" fill="url(#attemptGrad)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {isDemoAttempts && (
              <p className="text-center text-xs text-slate-400 mt-2">Publish mock tests to see attempt rankings</p>
            )}
          </ChartCard>
        </div>

        {/* Question Difficulty — Donut */}
        <ChartCard title="Question Difficulty" badge="Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <defs>
                {COLORS.map((c, i) => (
                  <linearGradient key={i} id={`pie${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={c} stopOpacity={1}   />
                    <stop offset="100%" stopColor={c} stopOpacity={0.75} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={DEMO_PIE}
                cx="50%" cy="44%"
                innerRadius={55} outerRadius={82}
                dataKey="value"
                paddingAngle={3}
                strokeWidth={0}
              >
                {DEMO_PIE.map((_, i) => <Cell key={i} fill={`url(#pie${i})`} />)}
              </Pie>
              <Legend
                iconSize={9} iconType="circle"
                formatter={v => <span style={{ fontSize: 11, color: '#94a3b8' }}>{v}</span>}
              />
              <Tooltip formatter={v => [`${v}%`, 'Share']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Latest Registrations */}
        <div className="admin-card">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Latest Registrations</h3>
            <span className="text-xs text-slate-400">Last 5</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {(data?.recentStudents || []).length === 0 && !loading && (
              <p className="px-5 py-8 text-center text-slate-400 text-sm">No registrations yet</p>
            )}
            {(data?.recentStudents || []).map(s => (
              <div key={s._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {s.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
                  <p className="text-xs text-slate-400 truncate">{s.email}</p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="admin-card">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Recent Payments</h3>
            <span className="text-xs text-slate-400">Last 5</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {(data?.recentPayments || []).length === 0 && !loading && (
              <p className="px-5 py-8 text-center text-slate-400 text-sm">No payments yet</p>
            )}
            {(data?.recentPayments || []).map(p => (
              <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <RiMoneyDollarCircleLine className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{p.student?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{p.productName}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-600">₹{p.finalAmount?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
