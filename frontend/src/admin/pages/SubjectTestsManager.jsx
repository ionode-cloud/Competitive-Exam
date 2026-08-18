import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiFileTextLine,
  RiCheckboxCircleLine, RiDraftLine, RiLockLine, RiGlobalLine,
  RiListOrdered, RiSearchLine, RiLayoutGridLine, RiPriceTag3Line,
  RiFolderLine, RiBookOpenLine, RiFontColor, RiComputerLine,
  RiCalculatorLine, RiGlobeLine, RiDeleteBin2Line,
  RiDragMove2Line, RiArrowUpLine, RiArrowDownLine
} from 'react-icons/ri';
import { MathRenderer } from '../components/MathInput';

export default function SubjectTestsManager() {
  // Top View Mode: 'tests' or 'categories'
  const [viewMode, setViewMode] = useState('tests');

  // Dashboard Stats
  const [stats, setStats] = useState({
    totalTests: 0, publishedTests: 0, draftTests: 0, freeTests: 0, premiumTests: 0
  });

  // Main Data
  const [tests, setTests]         = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [globalSubjects, setGlobalSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);

  // Banner & Page Config
  const [config, setConfig] = useState({
    bannerEyebrow: 'Subject Test',
    bannerHeading: 'Subject-Wise Practice Tests',
    bannerSubtitle: 'Master every topic with focused subject tests — free & premium options for all Odisha exams.',
    bannerStats: [
      { n: '6', label: 'Subjects' },
      { n: '24+', label: 'Practice Tests' },
      { n: '12', label: 'Free Tests' },
    ],
  });
  const [savingConfig, setSavingConfig] = useState(false);

  // Filters
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter]   = useState('');
  const [searchQuery, setSearchQuery]                     = useState('');

  // Test Modal State
  const [testModal, setTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState({
    subjectId: '', topicId: '', topicName: '', title: '', code: '', description: '',
    testType: 'practice', difficulty: 'Medium', accessType: 'Free',
    duration: 25, positiveMarks: 1, negativeMarks: 0.25,
    status: 'draft'
  });

  // Subject / Category Modal State
  const [subjectModal, setSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjForm, setSubjForm] = useState({
    name: '', description: '', icon: 'book', color: '#1957D6', bg: '#EAF1FD', topics: []
  });
  const [topicInput, setTopicInput] = useState('');
  const [categoryPrices, setCategoryPrices] = useState({});

  const handleSaveCategoryPrice = async (catId, newPrice) => {
    try {
      const res = await api.put(`/subject-tests/subjects/${catId}/price`, { price: Number(newPrice) });
      if (res.data.success) {
        Swal.fire('Saved!', res.data.message || 'Category price updated', 'success');
        fetchSubjects();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update category price', 'error');
    }
  };

  // Question Mapping Modal State
  const [mapModal, setMapModal] = useState(false);
  const [selectedTestDetails, setSelectedTestDetails] = useState(null);
  const [selectedQIds, setSelectedQIds] = useState([]);
  const [autoModal, setAutoModal] = useState(false);
  const [autoSelectForm, setAutoSelectForm] = useState({ easyCount: 5, mediumCount: 5, hardCount: 2 });

  // Available Question Bank Modal Filter States
  const [mapSubjectFilter, setMapSubjectFilter] = useState('');
  const [mapTopicFilter, setMapTopicFilter] = useState('');
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [availableBankQs, setAvailableBankQs] = useState([]);
  const [loadingBankQs, setLoadingBankQs] = useState(false);

  // ── Data Fetching ─────────────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/subject-tests/config');
      if (res.data.success && res.data.data) {
        setConfig(res.data.data);
      }
    } catch { /* silent */ }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const [resCategories, resGlobal] = await Promise.all([
        api.get('/subject-tests/subjects'),
        api.get('/subjects', { params: { status: 'active', limit: 100 } })
      ]);
      if (resCategories.data?.success) setSubjects(resCategories.data.data || []);
      if (resGlobal.data?.success) setGlobalSubjects(resGlobal.data.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      const res = await api.get('/subject-tests/tests');
      if (res.data.success) {
        const list = res.data.data || [];
        setTests(list);
        setStats({
          totalTests: list.length,
          publishedTests: list.filter(t => t.status === 'published').length,
          draftTests: list.filter(t => t.status === 'draft').length,
          freeTests: list.filter(t => t.accessType === 'Free').length,
          premiumTests: list.filter(t => t.accessType === 'Premium').length,
        });
      }
    } catch { /* silent */ }
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await api.get('/subject-tests/questions');
      if (res.data.success) setQuestions(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchConfig(), fetchSubjects(), fetchTests(), fetchQuestions()]);
    setLoading(false);
  }, [fetchConfig, fetchSubjects, fetchTests, fetchQuestions]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Load test details for mapping
  const loadTestForMapping = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/subject-tests/tests/${id}`);
      if (res.data.success) setSelectedTestDetails(res.data.data);
    } catch { /* silent */ }
  };

  // ── Config Handlers ──────────────────────────────────────────────────────────
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.put('/subject-tests/config', config);
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

  // ── Subject / Category Handlers ──────────────────────────────────────────────
  const [draggedSubjectIdx, setDraggedSubjectIdx] = useState(null);

  const moveSubject = async (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= subjects.length) return;
    const updated = [...subjects];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setSubjects(updated);

    try {
      const orderedIds = updated.map(s => s._id);
      await api.put('/subject-tests/subjects/reorder', { orderedIds });
    } catch {
      fetchSubjects();
    }
  };

  const togglePyqVisibility = async (s) => {
    try {
      const newVal = !(s.showInPyqEbook !== false);
      await api.put(`/subject-tests/subjects/${s._id}`, { showInPyqEbook: newVal });
      setSubjects(prev => prev.map(item => item._id === s._id ? { ...item, showInPyqEbook: newVal } : item));
    } catch {
      fetchSubjects();
    }
  };

  const toggleSubjectStatus = async (s) => {
    try {
      const newStatus = (s.isActive === false || s.status === 'inactive') ? 'active' : 'inactive';
      const isAct = newStatus === 'active';
      await api.put(`/subject-tests/subjects/${s._id}`, { status: newStatus, isActive: isAct });
      setSubjects(prev => prev.map(item => item._id === s._id ? { ...item, status: newStatus, isActive: isAct } : item));
    } catch {
      fetchSubjects();
    }
  };

  const openCreateSubject = () => {
    setEditingSubject(null);
    setSubjForm({
      name: '', description: '', icon: 'book', color: '#1957D6', bg: '#EAF1FD', topics: [],
      showInPyqEbook: true, status: 'active', isActive: true
    });
    setTopicInput('');
    setSubjectModal(true);
  };

  const openEditSubject = (s) => {
    setEditingSubject(s);
    setSubjForm({
      name: s.name || '',
      description: s.description || '',
      icon: s.icon || 'book',
      color: s.color || '#1957D6',
      bg: s.bg || '#EAF1FD',
      topics: s.topics || [],
      showInPyqEbook: s.showInPyqEbook !== false,
      status: s.status || (s.isActive === false ? 'inactive' : 'active'),
      isActive: s.isActive !== false
    });
    setTopicInput('');
    setSubjectModal(true);
  };

  const addTopicToForm = () => {
    if (!topicInput.trim()) return;
    if (subjForm.topics.includes(topicInput.trim())) return;
    setSubjForm(prev => ({ ...prev, topics: [...prev.topics, topicInput.trim()] }));
    setTopicInput('');
  };

  const removeTopicFromForm = (topName) => {
    setSubjForm(prev => ({ ...prev, topics: prev.topics.filter(t => t !== topName) }));
  };

  const saveSubjectCategory = async () => {
    if (!subjForm.name.trim()) return Swal.fire('Error', 'Subject name is required', 'error');
    try {
      if (editingSubject) {
        await api.put(`/subject-tests/subjects/${editingSubject._id}`, subjForm);
        Swal.fire('Success', 'Subject category updated successfully', 'success');
      } else {
        await api.post('/subject-tests/subjects', subjForm);
        Swal.fire('Success', 'Subject category created successfully', 'success');
      }
      setSubjectModal(false);
      fetchSubjects();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Save subject failed', 'error');
    }
  };

  const deleteSubjectCategory = async (id) => {
    const res = await Swal.fire({ title: 'Delete Subject Category?', text: 'This will remove the category from Subject Tests', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/subject-tests/subjects/${id}`);
      Swal.fire('Deleted', 'Subject Test Category deleted', 'success');
      fetchSubjects();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // ── Test Handlers ───────────────────────────────────────────────────────────
  const openCreateTest = () => {
    setEditingTest(null);
    setTestForm({
      categoryId: '',
      subjectId: '',
      topicId: '',
      topicName: '',
      title: '',
      code: '',
      description: '',
      testType: 'practice',
      difficulty: 'Medium',
      accessType: 'Free',
      duration: 25,
      price: 49,
      status: 'published'
    });
    setTestModal(true);
  };

  const openEditTest = (t) => {
    setEditingTest(t);
    setTestForm({
      categoryId: t.categoryId?._id || t.categoryId || '',
      subjectId: t.subjectId?._id || t.subjectId || '',
      topicId: t.topicId?._id || t.topicId || '',
      topicName: t.topicId?.name || t.topicName || '',
      title: t.title || '',
      code: t.code || '',
      description: t.description || '',
      testType: t.testType || 'practice',
      difficulty: t.difficulty || 'Medium',
      accessType: t.accessType || 'Free',
      duration: t.duration || 25,
      price: t.price || 49,
      status: t.status || 'draft'
    });
    setTestModal(true);
  };

  const saveTest = async () => {
    if (!testForm.categoryId || !testForm.subjectId || (!testForm.topicId && !testForm.topicName) || !testForm.title.trim()) {
      return Swal.fire('Error', 'Subject Test Category, Subject, Topic, and Test Title are required', 'error');
    }
    try {
      const payload = { ...testForm };
      if (payload.topicId && !/^[0-9a-fA-F]{24}$/.test(payload.topicId)) {
        delete payload.topicId;
      }
      if (editingTest) {
        await api.put(`/subject-tests/tests/${editingTest._id}`, payload);
        Swal.fire('Success', 'Test updated successfully', 'success');
      } else {
        await api.post('/subject-tests/tests', payload);
        Swal.fire('Success', 'Test created successfully', 'success');
      }
      setTestModal(false);
      setEditingTest(null);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const publishTest = async (testId, status) => {
    try {
      const res = await api.patch(`/subject-tests/tests/${testId}/publish`, { status });
      if (res.data.success) {
        Swal.fire('Success', res.data.message, 'success');
        fetchAllData();
      }
    } catch (err) {
      Swal.fire('Publish Warning', err.response?.data?.message || 'Failed to publish test', 'warning');
    }
  };

  const deleteTest = async (testId) => {
    const res = await Swal.fire({ title: 'Archive this test?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/subject-tests/tests/${testId}`);
      Swal.fire('Archived', 'Test archived successfully', 'success');
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // ── Mapping Handlers ────────────────────────────────────────────────────────
  const fetchAvailableBankQuestions = useCallback(async (subjectId, topicName, search) => {
    setLoadingBankQs(true);
    try {
      const params = {};
      if (subjectId) params.subjectId = subjectId;
      if (topicName) params.topic = topicName;
      if (search) params.search = search;
      const res = await api.get('/subject-tests/questions', { params });
      if (res.data.success) {
        setAvailableBankQs(res.data.data || []);
      }
    } catch { /* silent */ }
    finally { setLoadingBankQs(false); }
  }, []);

  const openMappingModal = async (testId) => {
    setSelectedTestDetails(null);
    setSelectedQIds([]);
    setMapModal(true);
    try {
      const res = await api.get(`/subject-tests/tests/${testId}`);
      if (res.data.success) {
        const test = res.data.data;
        setSelectedTestDetails(test);
        const subjId = test.subjectId?._id || test.subjectId || '';
        const topName = test.topicName || test.topicId?.name || '';
        setMapSubjectFilter(subjId);
        setMapTopicFilter(topName);
        setMapSearchQuery('');
        fetchAvailableBankQuestions(subjId, topName, '');
      }
    } catch { /* silent */ }
  };

  const addSelectedQuestionsToTest = async () => {
    if (!selectedTestDetails) return;
    if (selectedQIds.length === 0) return Swal.fire('Warning', 'Select at least one question', 'warning');
    try {
      const res = await api.post(`/subject-tests/tests/${selectedTestDetails._id}/questions`, { questionIds: selectedQIds });
      Swal.fire('Mapped!', res.data.message, 'success');
      setSelectedQIds([]);
      loadTestForMapping(selectedTestDetails._id);
      fetchAvailableBankQuestions(mapSubjectFilter, mapTopicFilter, mapSearchQuery);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Mapping failed', 'error');
    }
  };

  const addSingleQuestionToTest = async (qId) => {
    if (!selectedTestDetails) return;
    try {
      const res = await api.post(`/subject-tests/tests/${selectedTestDetails._id}/questions`, { questionIds: [qId] });
      loadTestForMapping(selectedTestDetails._id);
      fetchAvailableBankQuestions(mapSubjectFilter, mapTopicFilter, mapSearchQuery);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Mapping failed', 'error');
    }
  };

  const handleAutoSelect = async () => {
    if (!selectedTestDetails) return;
    try {
      const res = await api.post(`/subject-tests/tests/${selectedTestDetails._id}/questions/auto-select`, autoSelectForm);
      Swal.fire('Auto Selected!', res.data.message, 'success');
      setAutoModal(false);
      loadTestForMapping(selectedTestDetails._id);
      fetchAvailableBankQuestions(mapSubjectFilter, mapTopicFilter, mapSearchQuery);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Auto selection failed', 'error');
    }
  };

  const removeQuestionFromTest = async (qId) => {
    if (!selectedTestDetails) return;
    try {
      await api.delete(`/subject-tests/tests/${selectedTestDetails._id}/questions/${qId}`);
      loadTestForMapping(selectedTestDetails._id);
      fetchAvailableBankQuestions(mapSubjectFilter, mapTopicFilter, mapSearchQuery);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Remove failed', 'error');
    }
  };

  const allAvailableSubjects = [...globalSubjects];
  subjects.forEach(s => {
    if (!allAvailableSubjects.some(gs => gs._id === s._id || gs.name.toLowerCase() === s.name.toLowerCase())) {
      allAvailableSubjects.push(s);
    }
  });

  const selectedMapSubjObj = allAvailableSubjects.find(s => String(s._id) === String(mapSubjectFilter) || s.name === mapSubjectFilter);
  const mapAvailableTopics = selectedMapSubjObj?.topics || [];

  // Filtered Tests List
  const filteredTests = tests.filter(t => {
    if (selectedSubjectFilter && (t.subjectId?._id !== selectedSubjectFilter && t.subjectId !== selectedSubjectFilter)) return false;
    if (selectedStatusFilter && t.status !== selectedStatusFilter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectedSubjObj = globalSubjects.find(s => s._id === testForm.subjectId || s.name === testForm.subjectId);
  const availableTopicNames = (selectedSubjObj?.topics || []).map(t => typeof t === 'string' ? t : t.name || t);

  return (
    <div style={{ padding: '24px 28px', minHeight: '85vh', background: 'var(--bg)' }}>
      
      {/* ── Top Page Header & View Switcher ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>Subject Test</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            Manage Subject Tests, banner settings, and subject categories
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
            <RiFileTextLine /> All Subject Tests
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
          <button
            onClick={() => setViewMode('prices')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              background: viewMode === 'prices' ? '#2563eb' : 'transparent',
              color: viewMode === 'prices' ? '#fff' : '#64748b',
              boxShadow: viewMode === 'prices' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <RiPriceTag3Line /> Subject Test Category Price
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
         VIEW 1: ALL SUBJECT TESTS MANAGEMENT
      ════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'tests' && (
        <>
          {/* 3 Stat Dashboard Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Tests', val: stats.totalTests, color: '#1957D6', bg: '#EAF1FD', icon: <RiFileTextLine /> },
              { label: 'Free Tests', val: stats.freeTests, color: '#0284C7', bg: '#E0F2FE', icon: <RiGlobalLine /> },
              { label: 'Premium Tests', val: stats.premiumTests, color: '#EA7A1E', bg: '#FEF1E4', icon: <RiLockLine /> },
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
                placeholder="Search test title..."
                style={{ border: 'none', background: 'transparent', outline: 'none', padding: '9px 0', width: '100%', fontSize: 13 }}
              />
            </div>

            <select
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 160 }}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>

            {(selectedSubjectFilter || searchQuery) && (
              <button
                onClick={() => { setSelectedSubjectFilter(''); setSearchQuery(''); }}
                style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}

            <button onClick={openCreateTest} className="btn btn-primary" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontWeight: 800, fontSize: 13 }}>
              <RiAddLine fontSize={16} /> + Create Subject Test
            </button>
          </div>

          {/* Tests Table */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 18px' }}>Test Title</th>
                  <th style={{ padding: '14px 18px' }}>Subject / Topic</th>
                  <th style={{ padding: '14px 18px' }}>Questions / Duration</th>
                  <th style={{ padding: '14px 18px' }}>Access</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Loading tests...</td></tr>
                ) : filteredTests.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No tests found. Click "+ Create Subject Test" to build your first test.</td></tr>
                ) : (
                  filteredTests.map(t => (
                    <tr key={t._id} style={{ borderBottom: '1px solid var(--line,#e2e8f0)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--ink)' }}>{t.title}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#1957D6' }}>{t.subjectId?.name || 'Subject'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.topicId?.name || t.topicName || 'Topic'}</div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>{t.totalQuestions} Qs • {t.duration} Mins</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: t.accessType === 'Free' ? '#E8F8EE' : '#FEF1E4', color: t.accessType === 'Free' ? '#0F9D58' : '#EA7A1E' }}>
                          {t.accessType === 'Free' ? 'FREE' : `₹${t.price || 49}`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button onClick={() => openMappingModal(t._id)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #2563eb', background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RiListOrdered /> Questions ({t.totalQuestions})
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
                  ))
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 800, letterSpacing: 0.5, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiFileTextLine /> Banner Text Settings
              </h3>

              {/* EYEBROW LABEL */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Eyebrow Label <span style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8' }}>(Small text above heading)</span>
                </label>
                <input
                  value={config.bannerEyebrow}
                  onChange={e => setConfig(prev => ({ ...prev, bannerEyebrow: e.target.value }))}
                  placeholder="e.g. Subject Test"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
                />
              </div>

              {/* MAIN HEADING */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Main Heading *
                </label>
                <input
                  value={config.bannerHeading}
                  onChange={e => setConfig(prev => ({ ...prev, bannerHeading: e.target.value }))}
                  placeholder="e.g. Subject-Wise Practice Tests"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700, outline: 'none' }}
                />
              </div>

              {/* SUBTITLE / DESCRIPTION */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Subtitle / Description
                </label>
                <textarea
                  rows={3}
                  value={config.bannerSubtitle}
                  onChange={e => setConfig(prev => ({ ...prev, bannerSubtitle: e.target.value }))}
                  placeholder="Master every topic with focused subject tests..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', lineHeight: 1.5 }}
                />
              </div>

              {/* STATS BADGES */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', margin: 0, textTransform: 'uppercase' }}>
                    Stats Badges
                  </label>
                  <button
                    onClick={addStatBadge}
                    style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    + Add
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {config.bannerStats?.map((st, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        value={st.n}
                        onChange={e => updateStatBadge(idx, 'n', e.target.value)}
                        placeholder="6"
                        style={{ width: 80, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, textAlign: 'center' }}
                      />
                      <input
                        value={st.label}
                        onChange={e => updateStatBadge(idx, 'label', e.target.value)}
                        placeholder="Subjects"
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                      />
                      <button
                        onClick={() => removeStatBadge(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                      >
                        <RiDeleteBin2Line fontSize={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* LIVE BANNER PREVIEW CARD */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: 20, color: '#fff' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#FDE68A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  {config.bannerEyebrow || 'Subject Test'}
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                  {config.bannerHeading || 'Subject-Wise Practice Tests'}
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                  {config.bannerSubtitle}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {config.bannerStats?.map((st, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 50 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#FFC93C' }}>{st.n}</div>
                      <div style={{ fontSize: 9, color: '#cbd5e1', marginTop: 2 }}>{st.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', borderRadius: 10, fontWeight: 800, fontSize: 14 }}
                >
                  {savingConfig ? 'Saving Settings...' : 'Save Banner Settings'}
                </button>
              </div>

            </div>
          </div>

          {/* Right Column: SUBJECT TEST CATEGORIES / SUBJECTS MANAGER */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RiLayoutGridLine /> SUBJECT TEST CATEGORIES
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Manage subjects displayed inside the Subject Test page
                  </p>
                </div>
                <button
                  onClick={openCreateSubject}
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <RiAddLine /> + Add Subject Category
                </button>
              </div>

              {/* Subject Categories Table with Drag & Drop */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px', width: 80 }}>REORDER</th>
                      <th style={{ padding: '10px 12px' }}>SUBJECT</th>
                      <th style={{ padding: '10px 12px' }}>DESCRIPTION</th>
                      <th style={{ padding: '10px 12px' }}>ICON</th>
                      <th style={{ padding: '10px 12px' }}>PYQ EBOOK</th>
                      <th style={{ padding: '10px 12px' }}>STATUS</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s, idx) => (
                      <tr
                        key={s._id || idx}
                        draggable
                        onDragStart={() => setDraggedSubjectIdx(idx)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => {
                          if (draggedSubjectIdx !== null && draggedSubjectIdx !== idx) {
                            moveSubject(draggedSubjectIdx, idx);
                            setDraggedSubjectIdx(null);
                          }
                        }}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: draggedSubjectIdx === idx ? '#eff6ff' : 'transparent',
                          opacity: draggedSubjectIdx === idx ? 0.5 : 1
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'grab' }} title="Drag to reorder">
                            <RiDragMove2Line style={{ color: '#94a3b8' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{idx + 1}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>{s.topics?.length || 0} Topics</div>
                        </td>
                        <td style={{ padding: '12px', maxWidth: 200 }}>
                          <div style={{ fontSize: 12, color: '#64748b' }} className="line-clamp-2">{s.description || '—'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {s.icon || 'book'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => togglePyqVisibility(s)}
                            style={{
                              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                              background: s.showInPyqEbook !== false ? '#E8F8EE' : '#F1F5F9',
                              color: s.showInPyqEbook !== false ? '#0F9D58' : '#64748B'
                            }}
                          >
                            {s.showInPyqEbook !== false ? 'Show' : 'Hide'}
                          </button>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => toggleSubjectStatus(s)}
                            style={{
                              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                              background: s.status === 'active' ? '#EAF1FD' : '#FEF1E4',
                              color: s.status === 'active' ? '#1957D6' : '#EA7A1E'
                            }}
                          >
                            {s.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => moveSubject(idx, idx - 1)}
                              disabled={idx === 0}
                              style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                              title="Move Up"
                            >
                              <RiArrowUpLine fontSize={13} />
                            </button>
                            <button
                              onClick={() => moveSubject(idx, idx + 1)}
                              disabled={idx === subjects.length - 1}
                              style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', opacity: idx === subjects.length - 1 ? 0.3 : 1 }}
                              title="Move Down"
                            >
                              <RiArrowDownLine fontSize={13} />
                            </button>
                            <button onClick={() => openEditSubject(s)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Edit">
                              <RiEditLine fontSize={14} color="#2563eb" />
                            </button>
                            <button onClick={() => deleteSubjectCategory(s._id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Delete">
                              <RiDeleteBinLine fontSize={14} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
         VIEW 3: SUBJECT TEST CATEGORY PRICE MANAGEMENT
      ════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'prices' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <RiPriceTag3Line style={{ color: '#2563eb' }} /> Subject Test Category Price Management
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Set subscription price for each Subject Test Category. The <strong>first test</strong> in each category is always <strong>FREE</strong> for students.
              All remaining tests will automatically require purchasing access to that specific Subject Test Category.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Category Name</th>
                  <th style={{ padding: '12px 16px' }}>Description</th>
                  <th style={{ padding: '12px 16px' }}>Access Rule</th>
                  <th style={{ padding: '12px 16px', width: 220 }}>Category Price (₹)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      No subject categories found.
                    </td>
                  </tr>
                ) : (
                  subjects.map(cat => (
                    <tr key={cat._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color || '#2563eb' }}></span>
                          {cat.name}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 12 }}>
                        {cat.description || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#0f9d58', background: '#e8f8ee', padding: '4px 10px', borderRadius: 20 }}>
                          1st Test Always Free
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: '#475569', fontSize: 15 }}>₹</span>
                          <input
                            type="number"
                            min="0"
                            value={categoryPrices[cat._id] !== undefined ? categoryPrices[cat._id] : (cat.price ?? 0)}
                            onChange={e => setCategoryPrices(prev => ({ ...prev, [cat._id]: e.target.value }))}
                            style={{ width: 120, padding: '7px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 800, fontSize: 14 }}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleSaveCategoryPrice(cat._id, categoryPrices[cat._id] !== undefined ? categoryPrices[cat._id] : (cat.price ?? 0))}
                          className="btn btn-primary"
                          style={{ padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}
                        >
                          Save Price
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT SUBJECT CATEGORY MODAL ── */}
      {subjectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>
              {editingSubject ? 'Edit Subject Category' : 'Add Subject Category'}
            </h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Title *</label>
              <input
                value={subjForm.name}
                onChange={e => setSubjForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Mathematics, Computer, English"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Short Description</label>
              <input
                value={subjForm.description}
                onChange={e => setSubjForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Previous computer science papers"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>PYQ Ebook Dropdown</label>
                <select
                  value={subjForm.showInPyqEbook ? 'show' : 'hide'}
                  onChange={e => setSubjForm(f => ({ ...f, showInPyqEbook: e.target.value === 'show' }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="show">Show in PYQ Ebook</option>
                  <option value="hide">Hide from PYQ Ebook</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
                <select
                  value={subjForm.status || 'active'}
                  onChange={e => setSubjForm(f => ({ ...f, status: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Icon Type</label>
                <select
                  value={subjForm.icon}
                  onChange={e => setSubjForm(f => ({ ...f, icon: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                >
                  <option value="calculator">Calculator (Math)</option>
                  <option value="laptop">Computer / Laptop</option>
                  <option value="font">Language / Text (Odia)</option>
                  <option value="book">Book (English)</option>
                  <option value="globe">Globe (GK)</option>
                  <option value="puzzle">Puzzle (Reasoning)</option>
                  <option value="flask">Flask (Science)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Theme Color</label>
                <input
                  type="color"
                  value={subjForm.color}
                  onChange={e => setSubjForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid #cbd5e1', cursor: 'pointer', padding: 2 }}
                />
              </div>
            </div>

            {/* Topics Array Editor */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Topics under this Subject</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  value={topicInput}
                  onChange={e => setTopicInput(e.target.value)}
                  placeholder="e.g. Percentage"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
                <button type="button" onClick={addTopicToForm} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 12, fontWeight: 800 }}>+ Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {subjForm.topics?.map((topName, idx) => (
                  <span key={idx} style={{ fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {topName}
                    <button type="button" onClick={() => removeTopicFromForm(topName)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setSubjectModal(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveSubjectCategory} className="btn btn-primary" style={{ flex: 1, padding: 10, borderRadius: 8, fontWeight: 800 }}>Save Category</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT TEST MODAL ── */}
      {testModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>{editingTest ? 'Edit Subject Test' : 'Create Subject Test'}</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject Test Category *</label>
              <select
                value={testForm.categoryId}
                onChange={e => setTestForm(f => ({ ...f, categoryId: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
              >
                <option value="">-- Choose Subject Test Category --</option>
                {subjects.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject *</label>
                <select
                  value={testForm.subjectId}
                  onChange={e => {
                    const sId = e.target.value;
                    const selectedSubj = globalSubjects.find(s => String(s._id) === sId);
                    let matchedCatId = testForm.categoryId;
                    if (selectedSubj) {
                      const matchCat = subjects.find(c => {
                        const sName = selectedSubj.name.toLowerCase();
                        const cName = c.name.toLowerCase();
                        return sName === cName || (sName.includes('math') && cName.includes('math')) || (sName.includes('comp') && cName.includes('comp')) || (sName.includes('gk') && cName.includes('gk')) || (sName.includes('eng') && cName.includes('eng')) || (sName.includes('odia') && cName.includes('odia')) || (sName.includes('reason') && cName.includes('reason'));
                      });
                      if (matchCat) matchedCatId = matchCat._id;
                    }
                    setTestForm(f => ({ ...f, subjectId: sId, categoryId: matchedCatId, topicId: '', topicName: '' }));
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Choose Subject --</option>
                  {globalSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Topic *</label>
                <select value={testForm.topicId || testForm.topicName || ''} onChange={e => {
                  const val = e.target.value;
                  setTestForm(f => ({ ...f, topicId: val, topicName: val }));
                }} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                  <option value="">-- Choose Topic --</option>
                  {availableTopicNames.map((topName, idx) => (
                    <option key={idx} value={topName}>{topName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Test Title *</label>
              <input value={testForm.title} onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Percentage Practice Set 01" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>



            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setTestModal(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveTest} className="btn btn-primary" style={{ flex: 1, padding: 10, borderRadius: 8, fontWeight: 800 }}>Save Test</button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUESTION MAPPING MODAL ── */}
      {mapModal && selectedTestDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Manage Questions for: {selectedTestDetails.title}</h3>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>Mapped Questions: {selectedTestDetails.mappedQuestions?.length || 0}</span>
              </div>
              <button onClick={() => setMapModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 20 }}>
              
              {/* Left Column: Mapped Questions */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Mapped Questions</h4>
                  <button onClick={() => setAutoModal(true)} style={{ padding: '5px 10px', borderRadius: 6, background: '#7C3AED', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <RiAddLine /> Auto Select
                  </button>
                </div>
                <div style={{ display: 'grid', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                  {selectedTestDetails.mappedQuestions?.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No questions mapped yet. Select questions from Available Question Bank on the right.</div>
                  ) : (
                    selectedTestDetails.mappedQuestions?.map((mq, idx) => (
                      <div key={mq.mapId || mq._id || idx} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: '#2563eb' }}>#{idx + 1} Question</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>
                            <MathRenderer text={mq.questionText} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestionFromTest(mq.mapId || mq._id)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 11, fontWeight: 800, flexShrink: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Available Question Bank */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Available Question Bank</h4>
                  <button onClick={addSelectedQuestionsToTest} className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 11, fontWeight: 800 }}>Add Selected ({selectedQIds.length})</button>
                </div>

                {/* Subject & Topic Selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 2 }}>Subject</label>
                    <select
                      value={mapSubjectFilter}
                      onChange={e => {
                        const sId = e.target.value;
                        setMapSubjectFilter(sId);
                        setMapTopicFilter('');
                        fetchAvailableBankQuestions(sId, '', mapSearchQuery);
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11, background: '#fff', fontWeight: 600 }}
                    >
                      <option value="">All Subjects</option>
                      {allAvailableSubjects.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 2 }}>Topic</label>
                    <select
                      value={mapTopicFilter}
                      onChange={e => {
                        const top = e.target.value;
                        setMapTopicFilter(top);
                        fetchAvailableBankQuestions(mapSubjectFilter, top, mapSearchQuery);
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11, background: '#fff', fontWeight: 600 }}
                    >
                      <option value="">All Topics</option>
                      {mapAvailableTopics.map((t, idx) => (
                        <option key={idx} value={typeof t === 'string' ? t : t.name}>{typeof t === 'string' ? t : t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Input */}
                <div style={{ marginBottom: 10 }}>
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={e => {
                      const q = e.target.value;
                      setMapSearchQuery(q);
                      fetchAvailableBankQuestions(mapSubjectFilter, mapTopicFilter, q);
                    }}
                    placeholder="Search available questions..."
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11, background: '#fff' }}
                  />
                </div>

                {/* Available Questions List */}
                <div style={{ display: 'grid', gap: 8, maxHeight: 330, overflowY: 'auto' }}>
                  {loadingBankQs ? (
                    <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 12 }}>Loading Question Bank...</div>
                  ) : availableBankQs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>No questions found for selected Subject/Topic.</div>
                  ) : (
                    availableBankQs.map(q => {
                      const isMapped = selectedTestDetails.mappedQuestions?.some(m => String(m._id) === String(q._id) || String(m.questionId) === String(q._id));
                      const isSelected = selectedQIds.includes(q._id);
                      return (
                        <div
                          key={q._id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: `1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                            background: isMapped ? '#f1f5f9' : isSelected ? '#eff6ff' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                              <MathRenderer text={q.questionText} />
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                              {q.subjectName && <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#eff6ff', color: '#2563eb' }}>{q.subjectName}</span>}
                              {q.topicName && <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#f3ecfe', color: '#7c3aed' }}>{q.topicName}</span>}
                              {isMapped && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#059669' }}>✓ Already Mapped</span>}
                            </div>
                          </div>

                          {!isMapped && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedQIds(prev => prev.includes(q._id) ? prev.filter(id => id !== q._id) : [...prev, q._id]);
                                }}
                                title="Select for batch add"
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                              />
                              <button
                                type="button"
                                onClick={() => addSingleQuestionToTest(q._id)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: '#16a34a',
                                  color: '#fff',
                                  fontWeight: 900,
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3
                                }}
                                title="Add to test"
                              >
                                <RiAddLine /> + Add
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto Select Modal */}
      {autoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Auto Select Questions</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Easy Questions Count</label>
              <input type="number" value={autoSelectForm.easyCount} onChange={e => setAutoSelectForm(f => ({ ...f, easyCount: Number(e.target.value) }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Medium Questions Count</label>
              <input type="number" value={autoSelectForm.mediumCount} onChange={e => setAutoSelectForm(f => ({ ...f, mediumCount: Number(e.target.value) }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Hard Questions Count</label>
              <input type="number" value={autoSelectForm.hardCount} onChange={e => setAutoSelectForm(f => ({ ...f, hardCount: Number(e.target.value) }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setAutoModal(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAutoSelect} className="btn btn-primary" style={{ flex: 1, padding: 10, borderRadius: 8, fontWeight: 800 }}>⚡ Auto Select</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
