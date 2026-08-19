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

import { getSocket } from '../../utils/socket';
import { MathRenderer } from '../components/MathInput';

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
    subjectId: '',
    subjectName: '',
    topicName: '',
    subTopic: '',
    name: '',
    testType: 'full_length',
    pricingType: 'free',
    accessType: 'Free',
    price: 0,
    duration: 120,
    totalQuestions: 100,
    totalMarks: 100,
    negativeMarking: 0.25,
    description: '',
    status: 'active',
    publishAt: ''
  });

  // Exam / Category Modal State
  const [examModal, setExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({
    name: '', description: '', icon: 'shield', price: 0, isFree: true, status: 'active'
  });
  const [draggedExamIdx, setDraggedExamIdx] = useState(null);
  const [categoryPrices, setCategoryPrices] = useState({});

  useEffect(() => {
    if (exams.length > 0) {
      const prices = {};
      exams.forEach(ex => {
        prices[ex._id] = ex.price ?? 499;
      });
      setCategoryPrices(prices);
    }
  }, [exams]);

  const notifyMockTestsUpdated = () => {
    try {
      const socket = getSocket();
      socket.emit('mocktests_updated', { action: 'update' });
      window.dispatchEvent(new Event('mocktests-updated'));
    } catch { /* proceed */ }
  };

  const handleSaveExamPrice = async (examId, newPrice) => {
    try {
      await api.put(`/exams/${examId}`, { price: Number(newPrice) });
      Swal.fire('Saved!', 'Mock Test Category price updated successfully', 'success');
      notifyMockTestsUpdated();
      fetchExams();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update category price', 'error');
    }
  };

  const moveExam = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= exams.length) return;
    const updated = [...exams];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setExams(updated);
  };

  // Question Mapping Modal State
  const [mapModal, setMapModal] = useState(false);
  const [selectedTestDetails, setSelectedTestDetails] = useState(null);
  const [selectedQIds, setSelectedQIds] = useState([]);
  const [autoModal, setAutoModal] = useState(false);
  const [autoSelectForm, setAutoSelectForm] = useState({ easyCount: 20, mediumCount: 20, hardCount: 10 });

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

    const socket = getSocket();
    const handleUpdate = () => fetchAllData();

    socket.on('mocktests_updated', handleUpdate);
    socket.on('exams_updated', handleUpdate);

    return () => {
      socket.off('mocktests_updated', handleUpdate);
      socket.off('exams_updated', handleUpdate);
    };
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

  const [topicInput, setTopicInput] = useState('');

  // ── Exam Category Handlers ───────────────────────────────────────────────────
  const openCreateExam = () => {
    setEditingExam(null);
    setExamForm({ name: '', description: '', icon: 'landmark', price: 499, isFree: false, status: 'active', topics: [] });
    setTopicInput('');
    setExamModal(true);
  };

  const openEditExam = (ex) => {
    setEditingExam(ex);
    setExamForm({
      name: ex.name || '',
      description: ex.description || '',
      icon: ex.icon || 'landmark',
      price: ex.price || 0,
      isFree: ex.isFree !== false,
      status: ex.status || 'active',
      topics: Array.isArray(ex.topics) ? [...ex.topics] : []
    });
    setTopicInput('');
    setExamModal(true);
  };

  const addTopicToExamForm = () => {
    if (!topicInput.trim()) return;
    if (examForm.topics?.includes(topicInput.trim())) return;
    setExamForm(prev => ({ ...prev, topics: [...(prev.topics || []), topicInput.trim()] }));
    setTopicInput('');
  };

  const removeTopicFromExamForm = (topName) => {
    setExamForm(prev => ({ ...prev, topics: (prev.topics || []).filter(t => t !== topName) }));
  };

  const saveExam = async () => {
    if (!examForm.name.trim()) return Swal.fire('Error', 'Exam Category name is required', 'error');
    const { _id, __v, createdAt, updatedAt, ...cleanPayload } = examForm;
    try {
      if (editingExam) {
        await api.put(`/exams/${editingExam._id}`, cleanPayload);
        Swal.fire('Success', 'Exam Category updated successfully', 'success');
      } else {
        await api.post('/exams', cleanPayload);
        Swal.fire('Success', 'Exam Category created successfully', 'success');
      }
      setExamModal(false);
      setEditingExam(null);
      notifyMockTestsUpdated();
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
      notifyMockTestsUpdated();
      fetchExams();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const [allSubjects, setAllSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);

  const fetchSubjectsForModal = useCallback(async () => {
    try {
      const res = await api.get('/subjects', { params: { limit: 100 } });
      if (res.data?.success) {
        setAllSubjects(res.data.data || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchSubjectsForModal();
  }, [fetchSubjectsForModal]);

  const handleSubjectChangeInModal = (subjId) => {
    const selectedSubj = allSubjects.find(s => s._id === subjId);
    const firstTopic = Array.isArray(selectedSubj?.topicList) && selectedSubj.topicList.length > 0
      ? selectedSubj.topicList[0].name
      : (selectedSubj?.topics?.[0] || '');
    const firstTopicObj = selectedSubj?.topicList?.find(t => t.name === firstTopic);
    const firstSubTopic = firstTopicObj?.subTopics?.[0] || '';

    setTestForm(f => ({
      ...f,
      subjectId: subjId,
      subjectName: selectedSubj?.name || '',
      topicName: firstTopic,
      subTopic: firstSubTopic
    }));
    
    if (selectedSubj && Array.isArray(selectedSubj.topicList) && selectedSubj.topicList.length > 0) {
      setAvailableTopics(selectedSubj.topicList.map(t => t.name));
    } else if (selectedSubj && Array.isArray(selectedSubj.topics)) {
      setAvailableTopics(selectedSubj.topics.map(t => typeof t === 'string' ? t : t.name));
    } else {
      setAvailableTopics([]);
    }
  };

  // ── Mock Test Handlers ───────────────────────────────────────────────────────
  const openCreateTest = () => {
    setEditingTest(null);
    const defaultSubj = allSubjects[0];
    const firstTopic = Array.isArray(defaultSubj?.topicList) && defaultSubj.topicList.length > 0
      ? defaultSubj.topicList[0].name
      : (defaultSubj?.topics?.[0] || '');
    const firstTopicObj = defaultSubj?.topicList?.find(t => t.name === firstTopic);
    const firstSubTopic = firstTopicObj?.subTopics?.[0] || '';

    setTestForm({
      examination: exams[0]?._id || '',
      subjectId: defaultSubj?._id || '',
      subjectName: defaultSubj?.name || '',
      topicName: firstTopic,
      subTopic: firstSubTopic,
      name: '',
      testType: 'full_length',
      pricingType: 'free',
      accessType: 'Free',
      price: 0,
      duration: 120,
      totalQuestions: 100,
      totalMarks: 100,
      negativeMarking: 0.25,
      description: '',
      status: 'active',
      publishAt: ''
    });
    if (defaultSubj && Array.isArray(defaultSubj.topicList) && defaultSubj.topicList.length > 0) {
      setAvailableTopics(defaultSubj.topicList.map(t => t.name));
    } else {
      setAvailableTopics(defaultSubj?.topics || []);
    }
    setTestModal(true);
  };

  const openEditTest = (t) => {
    setEditingTest(t);
    const subjIdVal = t.subject?._id || t.subject || t.subjectId || '';
    const subjObj = allSubjects.find(s => s._id === subjIdVal);
    let mappedStatus = 'active';
    if (t.status === 'scheduled' || t.status === 'coming_soon') mappedStatus = 'coming_soon';
    else if (t.status === 'deactivated' || t.status === 'disabled' || t.status === 'draft') mappedStatus = 'disabled';

    setTestForm({
      examination: t.examination?._id || t.examination || '',
      subjectId: subjIdVal,
      subjectName: subjObj?.name || t.subjectName || t.subject?.name || '',
      topicName: t.topicName || '',
      subTopic: t.subTopic || '',
      name: t.name || t.title || '',
      testType: t.testType || (t.totalMarks >= 100 ? 'full_length' : 'sectional'),
      pricingType: t.pricingType || (t.accessType === 'Free' || t.price === 0 ? 'free' : 'paid'),
      accessType: t.accessType || (t.price > 0 ? 'Premium' : 'Free'),
      price: t.price || 0,
      duration: t.duration || (t.testType === 'full_length' ? 120 : 60),
      totalQuestions: t.totalQuestions || 100,
      totalMarks: t.totalMarks || 100,
      negativeMarking: t.negativeMarking || 0.25,
      description: t.description || '',
      status: mappedStatus,
      publishAt: t.publishAt ? new Date(t.publishAt).toISOString().slice(0, 16) : ''
    });
    if (subjObj && Array.isArray(subjObj.topicList) && subjObj.topicList.length > 0) {
      setAvailableTopics(subjObj.topicList.map(t => t.name));
    } else {
      setAvailableTopics(subjObj?.topics || []);
    }
    setTestModal(true);
  };

  const saveTest = async () => {
    // Ensure exam category exists or use fallback default
    const examId = testForm.examination || (exams.length > 0 ? exams[0]._id : undefined);
    const computedName = (testForm.subTopic || testForm.topicName || testForm.name || (testForm.subjectName ? `${testForm.subjectName} Mock Test` : 'Mock Test')).trim();

    if (testForm.status === 'coming_soon' && !testForm.publishAt) {
      return Swal.fire('Error', 'Please select Date and Time for Coming Soon status', 'error');
    }

    try {
      const isFull = testForm.testType === 'full_length';
      let backendStatus = 'published';
      if (testForm.status === 'coming_soon') backendStatus = 'scheduled';
      else if (testForm.status === 'disabled') backendStatus = 'deactivated';

      const currentQsCount = editingTest ? (editingTest.questions?.length ?? editingTest.completedQuestions ?? editingTest.totalQuestions ?? 0) : 0;

      const cleanPayload = {
        name: computedName,
        title: computedName,
        testType: testForm.testType || 'full_length',
        duration: Number(testForm.duration) || (isFull ? 120 : 60),
        totalQuestions: currentQsCount,
        completedQuestions: currentQsCount,
        totalMarks: currentQsCount * 1,
        negativeMarking: Number(testForm.negativeMarking) || 0.25,
        description: testForm.description || '',
        accessType: 'Free',
        price: 0,
        pricingType: 'free',
        status: backendStatus,
        publishAt: testForm.status === 'coming_soon' && testForm.publishAt ? new Date(testForm.publishAt).toISOString() : undefined,
      };

      if (examId) {
        cleanPayload.examination = examId;
      }
      if (testForm.subjectId && testForm.subjectId !== '') {
        cleanPayload.subject = testForm.subjectId;
        cleanPayload.subjectName = testForm.subjectName;
      }
      if (testForm.topicName && testForm.topicName !== '') {
        cleanPayload.topicName = testForm.topicName;
      }
      if (testForm.subTopic && testForm.subTopic !== '') {
        cleanPayload.subTopic = testForm.subTopic;
      }

      if (editingTest) {
        await api.put(`/mocktests/${editingTest._id}`, cleanPayload);
        Swal.fire('Success', 'Mock Test updated successfully', 'success');
      } else {
        await api.post('/mocktests', cleanPayload);
        Swal.fire('Success', 'Mock Test created successfully', 'success');
      }
      setTestModal(false);
      setEditingTest(null);
      notifyMockTestsUpdated();
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || err.message || 'Action failed', 'error');
    }
  };

  const deleteTest = async (testId) => {
    const res = await Swal.fire({ title: 'Delete this mock test?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/mocktests/${testId}`);
      Swal.fire('Deleted', 'Mock test deleted successfully', 'success');
      notifyMockTestsUpdated();
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // ── Mapping Handlers ────────────────────────────────────────────────────────
  const fetchAvailableBankQuestions = useCallback(async (subjectId, topicName, search) => {
    setLoadingBankQs(true);
    try {
      const params = { limit: 200 };
      if (subjectId) params.subject = subjectId;
      if (topicName) params.topic = topicName;
      if (search) params.search = search;
      const res = await api.get('/questions', { params });
      if (res.data?.success) {
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
      const res = await api.get(`/mocktests/${testId}`);
      if (res.data?.success) {
        const test = res.data.data;
        setSelectedTestDetails(test);
        const subjId = test.subject?._id || test.subject || test.subjectId || '';
        const topName = test.topicName || '';
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
      const res = await api.post(`/mocktests/${selectedTestDetails._id}/questions`, { questionIds: selectedQIds });
      Swal.fire('Mapped!', res.data?.message || 'Questions mapped successfully', 'success');
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
      await api.post(`/mocktests/${selectedTestDetails._id}/questions`, { questionIds: [qId] });
      loadTestForMapping(selectedTestDetails._id);
      fetchAvailableBankQuestions(mapSubjectFilter, mapTopicFilter, mapSearchQuery);
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
      fetchAvailableBankQuestions(mapSubjectFilter, mapTopicFilter, mapSearchQuery);
      fetchAllData();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Remove failed', 'error');
    }
  };

  const selectedMapSubjObj = allSubjects.find(s => String(s._id) === String(mapSubjectFilter) || s.name === mapSubjectFilter);
  const mapAvailableTopics = selectedMapSubjObj?.topics || [];

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
            <RiFileTextLine /> 📝 Mock Tests
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
            <RiPriceTag3Line /> 🏷 Mock Test Category Price
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
                  <th style={{ padding: '14px 18px' }}>Subject &amp; Topic</th>
                  <th style={{ padding: '14px 18px' }}>Paper Type &amp; Time</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
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
                    const qCount = Array.isArray(t.questions) ? t.questions.length : (t.completedQuestions ?? t.totalQuestions ?? 0);
                    const totalMarks = t.totalMarks !== undefined && t.totalMarks !== null ? t.totalMarks : (qCount * 1);
                    const isFullLength = t.testType === 'full_length' || totalMarks >= 100;
                    const examName = t.examination?.name || 'Odisha Exam';
                    const subjName = t.subjectName || t.subject?.name || 'General';
                    const topicName = t.topicName || 'General';
                    const subTopicName = t.subTopic || '';
                    const durationMins = t.duration || (isFullLength ? 120 : 60);
                    const isComingSoon = (t.status === 'scheduled' || t.status === 'coming_soon');
                    const isDisabled = (t.status === 'deactivated' || t.status === 'disabled' || t.status === 'draft');

                    return (
                      <tr key={t._id} style={{ borderBottom: '1px solid var(--line,#e2e8f0)' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--ink)' }}>{t.name || t.title}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#1957D6' }}>{examName}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>{subjName}</div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '2px 7px', borderRadius: 6 }}>
                              {topicName}
                            </span>
                            {subTopicName && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, background: '#f5f3ff', color: '#7c3aed', padding: '2px 7px', borderRadius: 6 }}>
                                ↳ {subTopicName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: isFullLength ? '#F3ECFE' : '#DCFCE7', color: isFullLength ? '#7C3AED' : '#16A34A' }}>
                              {isFullLength ? `FULL LENGTH (${totalMarks} M)` : `SECTIONAL (${totalMarks} M)`}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                              ⏱ {durationMins}m
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {isComingSoon ? (
                            <div>
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                                ⏰ COMING SOON
                              </span>
                              {t.publishAt && (
                                <div style={{ fontSize: 10, color: '#92400e', marginTop: 2, fontWeight: 700 }}>
                                  {new Date(t.publishAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {new Date(t.publishAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </div>
                          ) : isDisabled ? (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                              🛑 DISABLED
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                              ✓ ACTIVE
                            </span>
                          )}
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
         VIEW 2: MOCK TEST CATEGORY PRICE & BANNER TEXT SETTINGS
      ════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
          
          {/* Left Column: BANNER TEXT SETTINGS & STATS BADGES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 800, letterSpacing: 0.5, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiFontColor color="#2563eb" /> Banner Text Settings
              </h3>

              {/* EYEBROW LABEL */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Eyebrow Label <span style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8' }}>(Small text above heading)</span>
                </label>
                <input
                  value={config.bannerEyebrow}
                  onChange={e => setConfig(prev => ({ ...prev, bannerEyebrow: e.target.value }))}
                  placeholder="e.g. Mock Test Series"
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
                  placeholder="e.g. Full-Length & Sectional Mock Tests"
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
                  placeholder="Attempt 100-mark Full Length Mock Papers or targeted Sectional Tests..."
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
                        placeholder="100 Marks"
                        style={{ width: 110, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, textAlign: 'center' }}
                      />
                      <input
                        value={st.label}
                        onChange={e => updateStatBadge(idx, 'label', e.target.value)}
                        placeholder="Full Length"
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
                  {config.bannerEyebrow || 'Mock Test Series'}
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                  {config.bannerHeading || 'Full-Length & Sectional Mock Tests'}
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

          {/* Right Column: MOCK TEST CATEGORIES / EXAM CATEGORIES MANAGER */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RiLayoutGridLine /> MOCK TEST CATEGORIES &amp; PRICES
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Manage exam categories &amp; set category subscription prices for Mock Tests
                  </p>
                </div>
                <button
                  onClick={openCreateExam}
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <RiAddLine /> + Add Exam Category
                </button>
              </div>

              {/* Exam Categories Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px', width: 70 }}>REORDER</th>
                      <th style={{ padding: '10px 12px' }}>EXAM CATEGORY</th>
                      <th style={{ padding: '10px 12px', width: 170 }}>CATEGORY PRICE (₹)</th>
                      <th style={{ padding: '10px 12px' }}>STATUS</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((ex, idx) => (
                      <tr
                        key={ex._id || idx}
                        draggable
                        onDragStart={() => setDraggedExamIdx(idx)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => {
                          if (draggedExamIdx !== null && draggedExamIdx !== idx) {
                            moveExam(draggedExamIdx, idx);
                            setDraggedExamIdx(null);
                          }
                        }}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: draggedExamIdx === idx ? '#eff6ff' : 'transparent',
                          opacity: draggedExamIdx === idx ? 0.5 : 1
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'grab' }} title="Drag to reorder">
                            <RiDragMove2Line style={{ color: '#94a3b8' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{idx + 1}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{ex.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{ex.description || 'Mock Test Category'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>₹</span>
                            <input
                              type="number"
                              value={categoryPrices[ex._id] !== undefined ? categoryPrices[ex._id] : (ex.price ?? 499)}
                              onChange={e => setCategoryPrices(prev => ({ ...prev, [ex._id]: e.target.value }))}
                              style={{
                                width: 80, padding: '5px 8px', borderRadius: 6,
                                border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700
                              }}
                            />
                            <button
                              onClick={() => handleSaveExamPrice(ex._id, categoryPrices[ex._id] !== undefined ? categoryPrices[ex._id] : (ex.price ?? 499))}
                              style={{
                                padding: '5px 10px', borderRadius: 6, border: 'none',
                                background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                            background: ex.status === 'inactive' ? '#FEF1E4' : '#EAF1FD',
                            color: ex.status === 'inactive' ? '#EA7A1E' : '#1957D6'
                          }}>
                            {ex.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => moveExam(idx, idx - 1)}
                              disabled={idx === 0}
                              style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                              title="Move Up"
                            >
                              <RiArrowUpLine fontSize={13} />
                            </button>
                            <button
                              onClick={() => moveExam(idx, idx + 1)}
                              disabled={idx === exams.length - 1}
                              style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', opacity: idx === exams.length - 1 ? 0.3 : 1 }}
                              title="Move Down"
                            >
                              <RiArrowDownLine fontSize={13} />
                            </button>
                            <button onClick={() => openEditExam(ex)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Edit">
                              <RiEditLine fontSize={14} color="#2563eb" />
                            </button>
                            <button onClick={() => deleteExam(ex._id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Delete">
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

      {/* ── CREATE / EDIT MOCK TEST MODAL ── */}
      {testModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>{editingTest ? 'Edit Mock Test' : 'Create Mock Test'}</h3>
            
            {/* Exam Category */}
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

            {/* Subject & Topic Dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Subject *</label>
                <select
                  value={testForm.subjectId}
                  onChange={e => handleSubjectChangeInModal(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="">-- Select Subject --</option>
                  {allSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Topic / Chapter *</label>
                {availableTopics.length > 0 ? (
                  <select
                    value={testForm.topicName}
                    onChange={e => {
                      const selectedTopicName = e.target.value;
                      const subjObj = allSubjects.find(s => s._id === testForm.subjectId);
                      const topicObj = subjObj?.topicList?.find(t => (t.name || t) === selectedTopicName);
                      const firstSub = topicObj?.subTopics?.[0] || '';
                      setTestForm(f => ({
                        ...f,
                        topicName: selectedTopicName,
                        subTopic: firstSub
                      }));
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
                  >
                    <option value="">-- Select Topic --</option>
                    {availableTopics.map((top, idx) => (
                      <option key={idx} value={typeof top === 'string' ? top : top.name}>
                        {typeof top === 'string' ? top : top.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={testForm.topicName}
                    onChange={e => setTestForm(f => ({ ...f, topicName: e.target.value }))}
                    placeholder="e.g. Mathematics / General Studies"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                )}
              </div>
            </div>

            {/* Sub Topic Dropdown */}
            {(() => {
              const currentSubj = allSubjects.find(s => s._id === testForm.subjectId);
              const currentTopicObj = currentSubj?.topicList?.find(t => (t.name || t) === testForm.topicName);
              const currentSubTopics = Array.isArray(currentTopicObj?.subTopics) ? currentTopicObj.subTopics.filter(Boolean) : [];
              return (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Sub Topic {currentSubTopics.length > 0 ? '(Optional/Select)' : ''}
                  </label>
                  {currentSubTopics.length > 0 ? (
                    <select
                      value={testForm.subTopic || ''}
                      onChange={e => setTestForm(f => ({ ...f, subTopic: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
                    >
                      <option value="">-- Select Sub Topic --</option>
                      {currentSubTopics.map((sub, idx) => (
                        <option key={idx} value={sub}>{sub}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={testForm.subTopic || ''}
                      onChange={e => setTestForm(f => ({ ...f, subTopic: e.target.value }))}
                      placeholder="e.g. Percentage, Profit & Loss, Articles"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    />
                  )}
                </div>
              );
            })()}

            {/* Paper Type & Exam Duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Paper Type *</label>
                <select
                  value={testForm.testType}
                  onChange={e => {
                    const newType = e.target.value;
                    setTestForm(f => ({
                      ...f,
                      testType: newType,
                      duration: newType === 'full_length' ? 120 : 60
                    }));
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  <option value="full_length">Full Length (100 Marks)</option>
                  <option value="sectional">Sectional (&lt;100 Marks)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Exam Duration (Mins) *</label>
                <input
                  type="number"
                  min="1"
                  value={testForm.duration || 60}
                  onChange={e => setTestForm(f => ({ ...f, duration: Number(e.target.value) || 60 }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Status Dropdown (Active, Coming Soon, Disable) */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status *</label>
              <select
                value={testForm.status}
                onChange={e => setTestForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 700 }}
              >
                <option value="active">Active</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="disabled">Disable</option>
              </select>
            </div>

            {/* Coming Soon Date and Time */}
            {testForm.status === 'coming_soon' && (
              <div style={{ marginBottom: 16, background: '#fef3c7', padding: '12px', borderRadius: 8, border: '1px solid #fde68a' }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#92400e', display: 'block', marginBottom: 6 }}>
                  ⏰ Coming Soon Available Date &amp; Time *
                </label>
                <input
                  type="datetime-local"
                  value={testForm.publishAt || ''}
                  onChange={e => setTestForm(f => ({ ...f, publishAt: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #f59e0b', fontWeight: 700, background: '#fff' }}
                />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                  Test will display as &quot;Coming Soon&quot; to users until this scheduled date and time, after which attempts will automatically unlock.
                </p>
              </div>
            )}

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
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>{editingExam ? 'Edit Exam Category' : 'Add Exam Category'}</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category Name *</label>
              <input
                value={examForm.name}
                onChange={e => setExamForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. State PSC / SSSC (Odisha)"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label>
              <input
                value={examForm.description}
                onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description for category"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Icon Type</label>
                <select
                  value={examForm.icon}
                  onChange={e => setExamForm(f => ({ ...f, icon: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                >
                  <option value="landmark">🏛 Landmark / State PSC</option>
                  <option value="train">🚆 Train / SSC &amp; Railway</option>
                  <option value="university">🏦 University / Banking</option>
                  <option value="shield">🛡 Shield / Police &amp; Defence</option>
                  <option value="clipboard">📋 Clipboard / General</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category Price (₹)</label>
                <input
                  type="number"
                  value={examForm.price}
                  onChange={e => setExamForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
              <select
                value={examForm.status}
                onChange={e => setExamForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              >
                <option value="active">Active (Visible in User Panel)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
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
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '92vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Map Questions — {selectedTestDetails.name || selectedTestDetails.title}</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>
                  Mapped Questions: {(selectedTestDetails.questions || []).length}
                </p>
              </div>
              <button onClick={() => setMapModal(false)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 20 }}>
              
              {/* Left Column: Currently Mapped Questions */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 14, background: '#f8fafc' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                  Mapped Questions ({(selectedTestDetails.questions || []).length})
                </h4>
                <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(selectedTestDetails.questions || []).length === 0 ? (
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, padding: 20, textAlign: 'center' }}>No questions mapped yet. Select questions from Available Question Bank on the right.</p>
                  ) : (
                    (selectedTestDetails.questions || []).map((qItem, idx) => {
                      const qObj = qItem.question || qItem;
                      const qId = qObj._id || qItem._id;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 800, color: '#2563eb', marginRight: 6 }}>Q{idx + 1}.</span>
                            <span style={{ fontWeight: 700, color: '#0f172a', wordBreak: 'break-word' }}>
                              <MathRenderer text={qObj.questionText || 'Question text'} />
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestionFromTest(qId)}
                            style={{ border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, flexShrink: 0 }}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Question Bank Questions */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Available Question Bank</h4>
                  <button onClick={addSelectedQuestionsToTest} style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#16a34a', border: 'none', padding: '5px 12px', borderRadius: 6, cursor: 'pointer' }}>
                    + Add Selected ({selectedQIds.length})
                  </button>
                </div>

                {/* Subject & Topic Dropdowns */}
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
                      {allSubjects.map(s => (
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

                {/* Questions List */}
                <div style={{ maxHeight: 330, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {loadingBankQs ? (
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0, padding: 20, textAlign: 'center' }}>Loading Question Bank...</p>
                  ) : availableBankQs.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, padding: 20, textAlign: 'center' }}>No questions found for selected Subject/Topic.</p>
                  ) : (
                    availableBankQs.map(q => {
                      const mappedList = selectedTestDetails.questions || [];
                      const isMapped = mappedList.some(m => {
                        const mId = m.question?._id || m.question || m._id;
                        return String(mId) === String(q._id);
                      });
                      const isSelected = selectedQIds.includes(q._id);
                      const subjName = q.subject?.name || q.subjectName || '';
                      const topName = q.topic || q.topicName || '';

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
                              <MathRenderer text={q.questionText || 'Question'} />
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                              {subjName && <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#eff6ff', color: '#2563eb' }}>{subjName}</span>}
                              {topName && <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#f3ecfe', color: '#7c3aed' }}>{topName}</span>}
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

    </div>
  );
}
