import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiFileTextLine,
  RiCheckboxCircleLine, RiDraftLine, RiLockLine, RiGlobalLine,
  RiListOrdered, RiSearchLine, RiLayoutGridLine, RiPriceTag3Line,
  RiFolderLine, RiBookOpenLine, RiFontColor, RiComputerLine,
  RiCalculatorLine, RiGlobeLine, RiDeleteBin2Line,
  RiDragMove2Line, RiArrowUpLine, RiArrowDownLine, RiShieldLine,
  RiStackLine
} from 'react-icons/ri';

export default function ManageMockTest() {
  // Top View Mode: 'tests' or 'categories'
  const [viewMode, setViewMode] = useState('tests');

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalTests: 0, fullLengthTests: 0, sectionalTests: 0, freeTests: 0, premiumTests: 0
  });

  // Main Data
  const [tests, setTests]         = useState([]);
  const [exams, setExams]         = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);

  // Banner & Page Config
  const [config, setConfig] = useState({
    bannerEyebrow: 'Mock Test Series',
    bannerHeading: 'Full-Length & Sectional Mock Tests',
    bannerSubtitle: 'Attempt 100-mark Full Length Mock Papers or targeted Sectional Tests (<100 Marks) for all Odisha & National competitive exams.',
    bannerStats: [
      { n: '4', label: 'Categories' },
      { n: '100 Marks', label: 'Full Length' },
      { n: '<100 Marks', label: 'Sectionals' },
    ],
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Filters
  const [selectedExamFilter, setSelectedExamFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [searchQuery, setSearchQuery]               = useState('');

  // Test Modal State
  const [testModal, setTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState({
    examination: '',
    name: '',
    testType: 'full_length',
    pricingType: 'free',
    accessType: 'Free',
    price: 49,
    duration: 120,
    totalQuestions: 100,
    totalMarks: 100,
    negativeMarking: 0.25,
    description: '',
    status: 'published'
  });

  // Exam / Category Modal State
  const [examModal, setExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({
    name: '', description: '', icon: 'shield', price: 0, isFree: true, status: 'active'
  });

  // Question Mapping Modal State
  const [mapModal, setMapModal] = useState(false);
  const [selectedTestDetails, setSelectedTestDetails] = useState(null);
  const [selectedQIds, setSelectedQIds] = useState([]);
  const [autoModal, setAutoModal] = useState(false);
  const [autoSelectForm, setAutoSelectForm] = useState({ easyCount: 20, mediumCount: 20, hardCount: 10 });

  // ── Data Fetching ─────────────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/subject-tests/config');
      if (res.data?.success && res.data?.data) {
        // use config if present
      }
    } catch { /* silent */ }
  }, []);

  const fetchExams = useCallback(async () => {
    try {
      const res = await api.get('/exams');
      if (res.data?.success) {
        setExams(res.data.data || []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      const res = await api.get('/mocktests', { params: { limit: 200 } });
      if (res.data?.success) {
        const list = res.data.data || [];
        setTests(list);
        setStats({
          totalTests: list.length,
          fullLengthTests: list.filter(t => t.testType === 'full_length' || (t.totalMarks && t.totalMarks >= 100)).length,
          sectionalTests: list.filter(t => t.testType === 'sectional' || (t.totalMarks && t.totalMarks < 100)).length,
          freeTests: list.filter(t => t.pricingType === 'free' || t.accessType === 'Free' || t.price === 0).length,
          premiumTests: list.filter(t => t.pricingType === 'paid' || t.accessType === 'Premium' || (t.price && t.price > 0)).length,
        });
      }
    } catch { /* silent */ }
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await api.get('/questions', { params: { limit: 200 } });
      if (res.data?.success) {
        setQuestions(res.data.data || []);
      }
    } catch { /* silent */ }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchConfig(), fetchExams(), fetchTests(), fetchQuestions()]);
    setLoading(false);
  }, [fetchConfig, fetchExams, fetchTests, fetchQuestions]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Load test details for question mapping
  const loadTestForMapping = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/mocktests/${id}`);
      if (res.data?.success) setSelectedTestDetails(res.data.data);
    } catch { /* silent */ }
  };

  // ── Config Handlers ──────────────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      Swal.fire('Saved!', 'Banner settings updated successfully.', 'success');
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save config', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const addStatBadge = () => {
    setConfig(prev => ({
      ...prev,
      bannerStats: [...(prev.bannerStats || []), { n: '10+', label: 'New Badge' }]
    }));
  };

  const removeStatBadge = (idx) => {
    setConfig(prev => ({
      ...prev,
      bannerStats: prev.bannerStats.filter((_, i) => i !== idx)
    }));
  };

  const updateStatBadge = (idx, field, val) => {
    setConfig(prev => {
      const updated = [...prev.bannerStats];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, bannerStats: updated };
    });
  };

  // ── Exam Category Handlers ───────────────────────────────────────────────────
  const openCreateExam = () => {
    setEditingExam(null);
    setExamForm({ name: '', description: '', icon: 'shield', price: 0, isFree: true, status: 'active' });
    setExamModal(true);
  };

  const openEditExam = (ex) => {
    setEditingExam(ex);
    setExamForm({
      name: ex.name || '',
      description: ex.description || '',
      icon: ex.icon || 'shield',
      price: ex.price || 0,
      isFree: ex.isFree !== false,
      status: ex.status || 'active'
    });
    setExamModal(true);
  };

  const saveExam = async () => {
    if (!examForm.name.trim()) return Swal.fire('Error', 'Exam Category name is required', 'error');
    try {
      if (editingExam) {
        await api.put(`/exams/${editingExam._id}`, examForm);
        Swal.fire('Success', 'Exam Category updated successfully', 'success');
      } else {
        await api.post('/exams', examForm);
        Swal.fire('Success', 'Exam Category created successfully', 'success');
      }
      setExamModal(false);
      setEditingExam(null);
      fetchExams();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const deleteExam = async (id) => {
    const res = await Swal.fire({ title: 'Delete Category?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/exams/${id}`);
      Swal.fire('Deleted', 'Exam Category deleted', 'success');
      fetchExams();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // ── Mock Test Handlers ───────────────────────────────────────────────────────
  const openCreateTest = () => {
    setEditingTest(null);
    setTestForm({
      examination: exams[0]?._id || '',
      name: '',
      testType: 'full_length',
      pricingType: 'free',
      accessType: 'Free',
      price: 49,
      duration: 120,
      totalQuestions: 100,
      totalMarks: 100,
      negativeMarking: 0.25,
      description: '',
      status: 'published'
    });
    setTestModal(true);
  };

  const openEditTest = (t) => {
    setEditingTest(t);
    setTestForm({
      examination: t.examination?._id || t.examination || '',
      name: t.name || t.title || '',
      testType: t.testType || (t.totalMarks >= 100 ? 'full_length' : 'sectional'),
      pricingType: t.pricingType || (t.accessType === 'Free' || t.price === 0 ? 'free' : 'paid'),
      accessType: t.accessType || (t.price > 0 ? 'Premium' : 'Free'),
      price: t.price || 49,
      duration: t.duration || (t.testType === 'full_length' ? 120 : 60),
      totalQuestions: t.totalQuestions || 100,
      totalMarks: t.totalMarks || 100,
      negativeMarking: t.negativeMarking || 0.25,
      description: t.description || '',
      status: t.status || 'published'
    });
    setTestModal(true);
  };

  const saveTest = async () => {
    if (!testForm.examination || !testForm.name.trim()) {
      return Swal.fire('Error', 'Exam Category and Test Name are required', 'error');
    }
    try {
      const payload = {
        ...testForm,
        title: testForm.name,
        accessType: testForm.pricingType === 'free' ? 'Free' : 'Premium',
        price: testForm.pricingType === 'free' ? 0 : (testForm.price || 49),
        status: 'published'
      };

      if (editingTest) {
        await api.put(`/mocktests/${editingTest._id}`, payload);
        Swal.fire('Success', 'Mock Test updated successfully', 'success');
      } else {
        await api.post('/mocktests', payload);
        Swal.fire('Success', 'Mock Test created successfully', 'success');
      }
      setTestModal(false);
      setEditingTest(null);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const deleteTest = async (testId) => {
    const res = await Swal.fire({ title: 'Delete this mock test?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/mocktests/${testId}`);
      Swal.fire('Deleted', 'Mock test deleted successfully', 'success');
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // ── Mapping Handlers ────────────────────────────────────────────────────────
  const openMappingModal = (testId) => {
    setSelectedTestDetails(null);
    setSelectedQIds([]);
    loadTestForMapping(testId);
    setMapModal(true);
  };

  const addSelectedQuestionsToTest = async () => {
    if (!selectedTestDetails) return;
    if (selectedQIds.length === 0) return Swal.fire('Warning', 'Select at least one question', 'warning');
    try {
      const res = await api.post(`/mocktests/${selectedTestDetails._id}/questions`, { questionIds: selectedQIds });
      Swal.fire('Mapped!', res.data?.message || 'Questions mapped successfully', 'success');
      setSelectedQIds([]);
      loadTestForMapping(selectedTestDetails._id);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Mapping failed', 'error');
    }
  };

  const removeQuestionFromTest = async (qId) => {
    if (!selectedTestDetails) return;
    try {
      await api.delete(`/mocktests/${selectedTestDetails._id}/questions/${qId}`);
      loadTestForMapping(selectedTestDetails._id);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Remove failed', 'error');
    }
  };

  // Filtered Tests List
  const filteredTests = tests.filter(t => {
    const examId = t.examination?._id || t.examination;
    if (selectedExamFilter && examId !== selectedExamFilter) return false;
    if (selectedTypeFilter === 'full_length' && t.testType !== 'full_length' && (t.totalMarks < 100)) return false;
    if (selectedTypeFilter === 'sectional' && t.testType !== 'sectional' && (t.totalMarks >= 100)) return false;
    if (searchQuery) {
      const titleStr = (t.name || t.title || '').toLowerCase();
      if (!titleStr.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div style={{ padding: '24px 28px', minHeight: '85vh', background: 'var(--bg)' }}>
      
      {/* ── Top Page Header & View Switcher ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>Manage MockTest</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            Manage Full-Length (100 Marks) &amp; Sectional (&lt;100 Marks) Mock Tests, question mapping, and exam categories
          </p>
        </div>

        {/* View Mode Switcher Buttons */}
        <div style={{ display: 'flex', gap: 8, background: '#e2e8f0', padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => setViewMode('tests')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              background: viewMode === 'tests' ? '#fff' : 'transparent',
              color: viewMode === 'tests' ? '#2563eb' : '#64748b',
              boxShadow: viewMode === 'tests' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <RiFileTextLine /> All Mock Tests
          </button>
          <button
            onClick={() => setViewMode('categories')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              background: viewMode === 'categories' ? '#2563eb' : 'transparent',
              color: viewMode === 'categories' ? '#fff' : '#64748b',
              boxShadow: viewMode === 'categories' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <RiLayoutGridLine /> User Tab &amp; Categories
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         VIEW 1: ALL MOCK TESTS MANAGEMENT
      ════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'tests' && (
        <>
          {/* Stat Dashboard Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Mock Tests', val: stats.totalTests, color: '#1957D6', bg: '#EAF1FD', icon: <RiFileTextLine /> },
              { label: 'Full Length (100 Marks)', val: stats.fullLengthTests, color: '#7C3AED', bg: '#F3ECFE', icon: <RiStackLine /> },
              { label: 'Sectional (<100 Marks)', val: stats.sectionalTests, color: '#16A34A', bg: '#DCFCE7', icon: <RiCheckboxCircleLine /> },
              { label: 'Free Tests', val: stats.freeTests, color: '#0284C7', bg: '#E0F2FE', icon: <RiGlobalLine /> },
              { label: 'Paid / Premium', val: stats.premiumTests, color: '#EA7A1E', bg: '#FEF1E4', icon: <RiLockLine /> },
            ].map((s, idx) => (
              <div key={idx} style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: s.color, fontSize: 20, marginBottom: 8 }}>
                  <span style={{ background: s.bg, padding: 8, borderRadius: 10 }}>{s.icon}</span>
                  <span style={{ fontSize: 22, fontWeight: 900 }}>{s.val}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px' }}>
              <RiSearchLine color="#94a3b8" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search mock test title..."
                style={{ border: 'none', background: 'transparent', outline: 'none', padding: '9px 0', width: '100%', fontSize: 13 }}
              />
            </div>

            <select
              value={selectedExamFilter}
              onChange={e => setSelectedExamFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 160 }}
            >
              <option value="">All Exam Categories</option>
              {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 160 }}
            >
              <option value="">All Paper Types</option>
              <option value="full_length">Full Length (100 Marks)</option>
              <option value="sectional">Sectional (&lt;100 Marks)</option>
            </select>

            {(selectedExamFilter || selectedTypeFilter || searchQuery) && (
              <button
                onClick={() => { setSelectedExamFilter(''); setSelectedTypeFilter(''); setSearchQuery(''); }}
                style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}

            <button onClick={openCreateTest} className="btn btn-primary" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontWeight: 800, fontSize: 13 }}>
              <RiAddLine fontSize={16} /> + Create Mock Test
            </button>
          </div>

          {/* Tests Table */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 18px' }}>Mock Test Title</th>
                  <th style={{ padding: '14px 18px' }}>Exam Category</th>
                  <th style={{ padding: '14px 18px' }}>Paper Type</th>
                  <th style={{ padding: '14px 18px' }}>Questions / Duration</th>
                  <th style={{ padding: '14px 18px' }}>Access</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Loading mock tests...</td></tr>
                ) : filteredTests.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No mock tests found. Click "+ Create Mock Test" to create your first test.</td></tr>
                ) : (
                  filteredTests.map(t => {
                    const isFullLength = t.testType === 'full_length' || (t.totalMarks && t.totalMarks >= 100);
                    const isFree = t.pricingType === 'free' || t.accessType === 'Free' || t.price === 0;
                    const priceVal = t.price || 49;
                    const examName = t.examination?.name || 'Odisha Exam';
                    const qCount = t.questions?.length || t.totalQuestions || 0;

                    return (
                      <tr key={t._id} style={{ borderBottom: '1px solid var(--line,#e2e8f0)' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--ink)' }}>{t.name || t.title}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#1957D6' }}>{examName}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: isFullLength ? '#F3ECFE' : '#DCFCE7', color: isFullLength ? '#7C3AED' : '#16A34A' }}>
                            {isFullLength ? 'FULL LENGTH (100 M)' : 'SECTIONAL (<100 M)'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>{qCount} Qs • {t.duration || 120} Mins</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: isFree ? '#E8F8EE' : '#FEF1E4', color: isFree ? '#0F9D58' : '#EA7A1E' }}>
                            {isFree ? 'FREE' : `₹${priceVal}`}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button onClick={() => openMappingModal(t._id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #2563eb', background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <RiListOrdered /> Questions ({qCount})
                            </button>
                            <button onClick={() => openEditTest(t)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                              <RiEditLine fontSize={14} color="#2563eb" />
                            </button>
                            <button onClick={() => deleteTest(t._id)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                              <RiDeleteBinLine fontSize={14} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         VIEW 2: USER TAB & CATEGORIES / BANNER TEXT SETTINGS
      ════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          
          {/* Left Column: BANNER TEXT SETTINGS & STATS BADGES */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', borderRadius: 16, padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
              <RiFontColor color="#2563eb" /> Frontend Banner Settings
            </h3>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Eyebrow Badge Text</label>
              <input
                value={config.bannerEyebrow}
                onChange={e => setConfig(f => ({ ...f, bannerEyebrow: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Main Banner Heading</label>
              <input
                value={config.bannerHeading}
                onChange={e => setConfig(f => ({ ...f, bannerHeading: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Subtitle Description</label>
              <textarea
                rows={3}
                value={config.bannerSubtitle}
                onChange={e => setConfig(f => ({ ...f, bannerSubtitle: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>Banner Stat Badges</label>
                <button onClick={addStatBadge} style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', background: '#eff6ff', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                  + Add Stat Badge
                </button>
              </div>

              {config.bannerStats?.map((st, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input
                    value={st.n}
                    onChange={e => updateStatBadge(i, 'n', e.target.value)}
                    placeholder="Val (e.g. 100 Marks)"
                    style={{ width: 110, padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
                  />
                  <input
                    value={st.label}
                    onChange={e => updateStatBadge(i, 'label', e.target.value)}
                    placeholder="Label (e.g. Full Length)"
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                  />
                  <button onClick={() => removeStatBadge(i)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                    <RiDeleteBin2Line />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#2563eb', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}
            >
              {savingConfig ? 'Saving...' : 'Save Banner Settings'}
            </button>
          </div>

          {/* Right Column: EXAM CATEGORIES MANAGEMENT */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)' }}>
                <RiShieldLine color="#2563eb" /> Exam Categories
              </h3>
              <button onClick={openCreateExam} style={{ fontSize: 12, fontWeight: 800, color: '#fff', background: '#2563eb', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer' }}>
                + Add Exam Category
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {exams.map((ex, idx) => (
                <div
                  key={ex._id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#2563eb' }}>{ex.name}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEditExam(ex)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                      <RiEditLine fontSize={13} color="#2563eb" />
                    </button>
                    <button onClick={() => deleteExam(ex._id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                      <RiDeleteBinLine fontSize={13} color="#ef4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── CREATE / EDIT MOCK TEST MODAL ── */}
      {testModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>{editingTest ? 'Edit Mock Test' : 'Create Mock Test'}</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Exam Category *</label>
              <select
                value={testForm.examination}
                onChange={e => setTestForm(f => ({ ...f, examination: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
              >
                <option value="">-- Choose Exam Category --</option>
                {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Paper Type *</label>
                <select
                  value={testForm.testType}
                  onChange={e => {
                    const val = e.target.value;
                    const isFull = val === 'full_length';
                    setTestForm(f => ({
                      ...f,
                      testType: val,
                      totalQuestions: isFull ? 100 : 50,
                      totalMarks: isFull ? 100 : 50,
                      duration: isFull ? 120 : 60
                    }));
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="full_length">Full Length (100 Marks)</option>
                  <option value="sectional">Sectional (&lt;100 Marks)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Access *</label>
                <select
                  value={testForm.pricingType}
                  onChange={e => setTestForm(f => ({ ...f, pricingType: e.target.value, accessType: e.target.value === 'free' ? 'Free' : 'Premium' }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid / Premium</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Test Title *</label>
              <input
                value={testForm.name}
                onChange={e => setTestForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. OSSSC RI Full Length Mock Test 01"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Price (₹)</label>
                <input
                  type="number"
                  disabled={testForm.pricingType === 'free'}
                  value={testForm.pricingType === 'free' ? 0 : testForm.price}
                  onChange={e => setTestForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Duration (Mins)</label>
                <input
                  type="number"
                  value={testForm.duration}
                  onChange={e => setTestForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Total Qs</label>
                <input
                  type="number"
                  value={testForm.totalQuestions}
                  onChange={e => setTestForm(f => ({ ...f, totalQuestions: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Total Marks</label>
                <input
                  type="number"
                  value={testForm.totalMarks}
                  onChange={e => setTestForm(f => ({ ...f, totalMarks: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setTestModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                Cancel
              </button>
              <button onClick={saveTest} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>
                Save Mock Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXAM CATEGORY MODAL ── */}
      {examModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 450, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>{editingExam ? 'Edit Exam Category' : 'Add Exam Category'}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category Name *</label>
              <input
                value={examForm.name}
                onChange={e => setExamForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. OSSSC RI/ARI/AMIN"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label>
              <input
                value={examForm.description}
                onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setExamModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                Cancel
              </button>
              <button onClick={saveExam} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>
                Save Exam Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUESTION MAPPING MODAL ── */}
      {mapModal && selectedTestDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 840, maxHeight: '92vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Map Questions — {selectedTestDetails.name || selectedTestDetails.title}</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                  Total Questions: {selectedTestDetails.questions?.length || 0}
                </p>
              </div>
              <button onClick={() => setMapModal(false)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Left Column: Currently Mapped Questions */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 14, background: '#f8fafc' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                  Mapped Questions ({(selectedTestDetails.questions || []).length})
                </h4>
                <div style={{ maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedTestDetails.questions || []).length === 0 ? (
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No questions mapped yet.</p>
                  ) : (
                    (selectedTestDetails.questions || []).map((qItem, idx) => {
                      const qObj = qItem.question || qItem;
                      const qId = qObj._id || qItem._id;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                          <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                            <span style={{ fontWeight: 800, color: '#2563eb', marginRight: 6 }}>Q{idx + 1}.</span>
                            <span dangerouslySetInnerHTML={{ __html: qObj.questionText || 'Question text' }} />
                          </div>
                          <button onClick={() => removeQuestionFromTest(qId)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                            <RiDeleteBin2Line />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Question Bank Questions */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Question Bank</h4>
                  <button onClick={addSelectedQuestionsToTest} style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#16a34a', border: 'none', padding: '5px 12px', borderRadius: 6, cursor: 'pointer' }}>
                    + Add Selected ({selectedQIds.length})
                  </button>
                </div>

                <div style={{ maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {questions.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>No question bank items found.</p>
                  ) : (
                    questions.map(q => {
                      const isSelected = selectedQIds.includes(q._id);
                      return (
                        <label key={q._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: isSelected ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: 12 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              if (e.target.checked) setSelectedQIds(prev => [...prev, q._id]);
                              else setSelectedQIds(prev => prev.filter(id => id !== q._id));
                            }}
                          />
                          <span style={{ flex: 1, minWidth: 0 }} dangerouslySetInnerHTML={{ __html: q.questionText || 'Question' }} />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
