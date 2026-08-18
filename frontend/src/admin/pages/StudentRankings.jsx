import { useState, useEffect, useCallback } from 'react';
import {
  RiTrophyLine, RiMedalLine, RiSearchLine, RiFilterLine,
  RiUserLine, RiDownloadLine, RiRefreshLine, RiBarChartLine,
  RiCheckLine, RiCloseLine, RiTimeLine, RiAwardLine, RiEyeLine
} from 'react-icons/ri';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function StudentRankings() {
  const [data, setData] = useState({
    mode: 'overall',
    stats: {
      totalRankedStudents: 0,
      totalCompletedAttempts: 0,
      averagePlatformScore: 0,
      topPerformer: null,
      totalCandidates: 0,
      highestScore: 0
    },
    testsList: [],
    rankings: []
  });

  const [loading, setLoading] = useState(true);
  const [selectedTestId, setSelectedTestId] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [activeCandidateDetail, setActiveCandidateDetail] = useState(null);

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/subject-tests/rankings/admin', {
        params: {
          testId: selectedTestId,
          search,
          sortBy
        }
      });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load student rankings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [selectedTestId, search, sortBy]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const handleExportCSV = () => {
    const rows = data.rankings || [];
    if (rows.length === 0) return toast.error('No ranking data to export');

    let csvContent = 'data:text/csv;charset=utf-8,';
    if (data.mode === 'test_specific') {
      csvContent += 'Rank,Candidate Name,Email,Phone,Score,Percentage,Accuracy,Correct,Wrong,Skipped,Time Taken (Sec),Date\n';
      rows.forEach(r => {
        csvContent += `"${r.rank}","${r.user?.name || ''}","${r.user?.email || ''}","${r.user?.phone || ''}","${r.score}","${r.percentage}%","${r.accuracy}%","${r.correctCount}","${r.incorrectCount}","${r.skippedCount}","${r.timeTakenSec}","${new Date(r.date).toLocaleDateString()}"\n`;
      });
    } else {
      csvContent += 'Rank,Candidate Name,Email,Phone,Total Score,Tests Attempted,Avg Percentage,Avg Accuracy,Badge,Last Active\n';
      rows.forEach(r => {
        csvContent += `"${r.rank}","${r.user?.name || ''}","${r.user?.email || ''}","${r.user?.phone || ''}","${r.totalScore}","${r.totalAttempts}","${r.avgPercentage}%","${r.avgAccuracy}%","${r.badge}","${new Date(r.lastActive).toLocaleDateString()}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `student_rankings_${selectedTestId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rankings exported to CSV');
  };

  const isTestSpecific = data.mode === 'test_specific';

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <RiTrophyLine className="text-amber-500 w-7 h-7" />
            Student Performance &amp; Rankings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time candidate score rankings, platform leaderboard, accuracy metrics, and test-wise performance breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRankings}
            className="admin-btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
            title="Refresh rankings"
          >
            <RiRefreshLine className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="admin-btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-sm"
          >
            <RiDownloadLine /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="admin-card p-4 flex items-center gap-4 bg-gradient-to-br from-blue-50/50 to-white dark:from-slate-800/80 dark:to-slate-800 border-blue-100 dark:border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl flex-shrink-0">
            <RiUserLine />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isTestSpecific ? 'Test Candidates' : 'Ranked Students'}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {isTestSpecific ? data.stats?.totalCandidates : data.stats?.totalRankedStudents || 0}
            </div>
          </div>
        </div>

        <div className="admin-card p-4 flex items-center gap-4 bg-gradient-to-br from-purple-50/50 to-white dark:from-slate-800/80 dark:to-slate-800 border-purple-100 dark:border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl flex-shrink-0">
            <RiBarChartLine />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isTestSpecific ? 'Average Score' : 'Platform Avg Score'}
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {data.stats?.averageScore || data.stats?.averagePlatformScore || 0} <span className="text-xs font-semibold text-slate-400">pts</span>
            </div>
          </div>
        </div>

        <div className="admin-card p-4 flex items-center gap-4 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-800/80 dark:to-slate-800 border-emerald-100 dark:border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl flex-shrink-0">
            <RiMedalLine />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isTestSpecific ? 'Highest Score' : 'Total Attempts'}
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {isTestSpecific ? `${data.stats?.highestScore || 0} pts` : (data.stats?.totalCompletedAttempts || 0)}
            </div>
          </div>
        </div>

        <div className="admin-card p-4 flex items-center gap-4 bg-gradient-to-br from-amber-50/50 to-white dark:from-slate-800/80 dark:to-slate-800 border-amber-100 dark:border-slate-700">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl flex-shrink-0">
            <RiAwardLine />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              #1 Top Candidate
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
              {data.stats?.topCandidate?.user?.name || data.stats?.topPerformer?.user?.name || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Controls Bar ── */}
      <div className="admin-card p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Test Selector Dropdown */}
          <div className="w-full md:w-80">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Select Exam / Ranking Scope:
            </label>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="admin-input text-xs w-full font-semibold"
            >
              <option value="all">🏆 All Tests (Overall Platform Leaderboard)</option>
              {data.testsList?.map(t => (
                <option key={t._id} value={t._id}>
                  [{t.type}] {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="w-full md:flex-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Search Candidate:
            </label>
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate by name, email, or mobile number..."
                className="admin-input text-xs pl-9 w-full"
              />
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="w-full md:w-48">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="admin-input text-xs w-full font-semibold"
            >
              <option value="score">Highest Score</option>
              <option value="accuracy">Highest Accuracy</option>
              {!isTestSpecific && <option value="attempts">Most Tests Attempted</option>}
              <option value="recent">Most Recent Activity</option>
              {isTestSpecific && <option value="time">Fastest Time Taken</option>}
            </select>
          </div>
        </div>
      </div>

      {/* ── Rankings Table ── */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <RiTrophyLine className="text-amber-500" />
              {isTestSpecific ? 'Exam-Specific Candidate Rankings' : 'Overall Platform Performance Leaderboard'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {data.rankings?.length || 0} ranked candidates based on criteria
            </p>
          </div>
          <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            {isTestSpecific ? 'Single Exam View' : 'Global Platform Scope'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table w-full text-left">
            <thead>
              <tr>
                <th className="w-16">Rank</th>
                <th>Candidate Information</th>
                {isTestSpecific ? (
                  <>
                    <th>Score / Total</th>
                    <th>Accuracy</th>
                    <th>Answers (C / W / S)</th>
                    <th>Time Taken</th>
                    <th>Date</th>
                    <th className="text-right">Action</th>
                  </>
                ) : (
                  <>
                    <th>Total Score</th>
                    <th>Tests Attempted</th>
                    <th>Avg Accuracy</th>
                    <th>Avg Score %</th>
                    <th>Badge Tier</th>
                    <th>Last Active</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={isTestSpecific ? 8 : 7} className="text-center py-12 text-slate-400">
                    <div className="spinner mx-auto mb-2 w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    Calculating student rankings...
                  </td>
                </tr>
              ) : data.rankings?.length === 0 ? (
                <tr>
                  <td colSpan={isTestSpecific ? 8 : 7} className="text-center py-12 text-slate-400">
                    <RiTrophyLine className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    No candidate exam attempts found matching your filter.
                  </td>
                </tr>
              ) : (
                data.rankings.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Rank Badge */}
                    <td className="font-black text-sm">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${
                        r.rank === 1
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-2 ring-amber-400'
                          : r.rank === 2
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 ring-1 ring-slate-400'
                          : r.rank === 3
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 ring-1 ring-orange-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                      </span>
                    </td>

                    {/* Candidate Info */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {(r.user?.name || 'ST').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            {r.user?.name || 'Anonymous Student'}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{r.user?.email || 'No email'}</span>
                            {r.user?.phone && <span>• {r.user.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Specific vs Overall Columns */}
                    {isTestSpecific ? (
                      <>
                        <td className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {r.score} pts
                        </td>
                        <td className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                          {r.accuracy}%
                        </td>
                        <td className="text-xs">
                          <div className="flex items-center gap-2 font-bold">
                            <span className="text-emerald-600">+{r.correctCount}</span>
                            <span className="text-rose-500">-{r.incorrectCount}</span>
                            <span className="text-slate-400">○{r.skippedCount}</span>
                          </div>
                        </td>
                        <td className="text-xs text-slate-500 font-semibold">
                          <span className="inline-flex items-center gap-1">
                            <RiTimeLine /> {Math.floor((r.timeTakenSec || 0) / 60)}m {(r.timeTakenSec || 0) % 60}s
                          </span>
                        </td>
                        <td className="text-xs text-slate-400">
                          {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="text-right">
                          <a
                            href={`/subject-test/result/${r.attemptId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md"
                          >
                            <RiEyeLine /> Solutions
                          </a>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                          {r.totalScore} <span className="text-xs font-medium text-slate-400">pts</span>
                        </td>
                        <td className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                          {r.totalAttempts} Tests
                        </td>
                        <td className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                          {r.avgAccuracy}%
                        </td>
                        <td className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                          {r.avgPercentage}%
                        </td>
                        <td>
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {r.badge}
                          </span>
                        </td>
                        <td className="text-xs text-slate-400">
                          {new Date(r.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
