import { useState, useEffect, useCallback } from 'react';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBin2Line,
  RiFileList3Line,
  RiEyeLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiBookOpenLine,
  RiCheckLine,
  RiCloseLine,
  RiInformationLine,
  RiShieldCheckLine,
  RiQuestionLine,
  RiMagicLine,
  RiCheckboxCircleLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import { getSocket } from '../../utils/socket';
import Modal from '../components/Modal';

const DEFAULT_STANDARD_RULES = [
  'Read all questions and options carefully before selecting your final answer.',
  'Each question in this exam has only one correct option.',
  'Positive marks will be awarded for each correct answer (+1 mark or as specified).',
  'Negative marking will be deducted for each incorrect attempt (-0.25 marks or configured penalty).',
  'No marks are deducted for unattempted questions.',
  'Do not refresh, close, or navigate away from the browser during the active test session.',
  'The countdown timer starts as soon as you click the "I am ready to begin" button.',
  'You can switch questions and review marked answers using the question palette on the right panel.',
  'The exam will automatically submit when the timer reaches 00:00:00.'
];

export default function ManageInstructions() {
  const [instructions, setInstructions] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: 'General Examination Instructions',
    summary: 'Read all instructions carefully before commencing the test.',
    subjectId: 'all',
    subjectName: 'All Subjects',
    topicName: 'All Topics',
    subTopic: '',
    status: 'active',
    agreementText: 'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I agree to follow all examination instructions and rules.',
    instructions: [...DEFAULT_STANDARD_RULES]
  });

  // Fetch Subjects for dropdowns
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get('/subjects', { params: { limit: 100 } });
      if (res.data.success) {
        setAllSubjects(res.data.data || []);
      }
    } catch { /* silent */ }
  }, []);

  // Fetch Instructions List
  const fetchInstructions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (subjectFilter !== 'all') params.subjectId = subjectFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await api.get('/instructions', { params });
      if (res.data.success) {
        setInstructions(res.data.data || []);
        setTotal(res.data.pagination?.total || (res.data.data?.length || 0));
      }
    } catch {
      toast.error('Failed to load instructions');
    } finally {
      setLoading(false);
    }
  }, [page, search, subjectFilter, statusFilter]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fetchInstructions();
    const socket = getSocket();
    const handleUpdate = () => fetchInstructions();
    socket.on('instructions_updated', handleUpdate);
    return () => socket.off('instructions_updated', handleUpdate);
  }, [fetchInstructions]);

  // Handle Subject selection in Create/Edit form to cascade topics and subtopics
  const selectedSubjectObj = allSubjects.find(s => String(s._id) === String(form.subjectId) || s.name === form.subjectName);

  // Extract structured topic objects: [{ name: 'Topic Name', subTopics: ['Sub 1', 'Sub 2'] }]
  const structuredTopics = Array.isArray(selectedSubjectObj?.topicList) && selectedSubjectObj.topicList.length > 0
    ? selectedSubjectObj.topicList.map(t => typeof t === 'string' ? { name: t, subTopics: [] } : { name: t.name || '', subTopics: Array.isArray(t.subTopics) ? t.subTopics.filter(Boolean) : [] })
    : Array.isArray(selectedSubjectObj?.topics) && selectedSubjectObj.topics.length > 0
      ? selectedSubjectObj.topics.map(t => typeof t === 'string' ? { name: t, subTopics: [] } : { name: t.name || '', subTopics: Array.isArray(t.subTopics) ? t.subTopics.filter(Boolean) : [] })
      : [];

  const availableTopicNames = structuredTopics.map(t => t.name).filter(Boolean);
  const selectedTopicObj = structuredTopics.find(t => t.name === form.topicName);
  const availableSubTopics = Array.isArray(selectedTopicObj?.subTopics) ? selectedTopicObj.subTopics.filter(Boolean) : [];

  const handleSubjectChange = (sid) => {
    if (!sid) {
      setForm(prev => ({
        ...prev,
        subjectId: '',
        subjectName: '',
        topicName: '',
        subTopic: '',
        title: ''
      }));
      return;
    }

    const sObj = allSubjects.find(s => String(s._id) === String(sid));
    const sTopics = Array.isArray(sObj?.topicList) && sObj.topicList.length > 0
      ? sObj.topicList
      : Array.isArray(sObj?.topics) ? sObj.topics : [];
    
    const firstTop = sTopics[0];
    const firstTopName = typeof firstTop === 'string' ? firstTop : (firstTop?.name || '');
    const firstSubTopics = Array.isArray(firstTop?.subTopics) ? firstTop.subTopics.filter(Boolean) : [];
    const firstSubName = firstSubTopics[0] || '';

    setForm(prev => ({
      ...prev,
      subjectId: sid,
      subjectName: sObj ? sObj.name : '',
      topicName: firstTopName || '',
      subTopic: firstSubName || '',
      title: sObj ? `${sObj.name} Exam Instructions & Guidelines` : prev.title
    }));
  };

  const handleTopicChange = (topName) => {
    const matchedTop = structuredTopics.find(t => t.name === topName);
    const subList = Array.isArray(matchedTop?.subTopics) ? matchedTop.subTopics.filter(Boolean) : [];
    const firstSub = subList[0] || '';

    setForm(prev => ({
      ...prev,
      topicName: topName,
      subTopic: firstSub,
      title: topName && prev.subjectName
        ? `${prev.subjectName} - ${topName} Exam Instructions`
        : prev.title
    }));
  };

  const handleSubTopicChange = (subName) => {
    setForm(prev => ({
      ...prev,
      subTopic: subName,
      title: subName && prev.topicName
        ? `${prev.subjectName} - ${prev.topicName} (${subName}) Instructions`
        : prev.title
    }));
  };

  const openCreateModal = () => {
    setEditingDoc(null);
    const firstSubj = allSubjects[0];
    const sTopics = Array.isArray(firstSubj?.topicList) && firstSubj.topicList.length > 0
      ? firstSubj.topicList
      : Array.isArray(firstSubj?.topics) ? firstSubj.topics : [];
    const firstTop = sTopics[0];
    const firstTopName = typeof firstTop === 'string' ? firstTop : (firstTop?.name || '');
    const firstSubTopics = Array.isArray(firstTop?.subTopics) ? firstTop.subTopics.filter(Boolean) : [];
    const firstSubName = firstSubTopics[0] || '';

    setForm({
      title: firstSubj ? `${firstSubj.name} Exam Instructions & Guidelines` : 'Exam Instructions',
      summary: 'Read all instructions carefully before commencing the test.',
      subjectId: firstSubj ? String(firstSubj._id) : '',
      subjectName: firstSubj ? firstSubj.name : '',
      topicName: firstTopName || '',
      subTopic: firstSubName || '',
      status: 'active',
      agreementText: 'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I agree to follow all examination instructions and rules.',
      instructions: [...DEFAULT_STANDARD_RULES]
    });
    setModalOpen(true);
  };

  const openEditModal = (doc) => {
    setEditingDoc(doc);
    setForm({
      title: doc.title || 'Exam Instructions',
      summary: doc.summary || '',
      subjectId: doc.subjectId?._id || doc.subjectId || '',
      subjectName: doc.subjectName || (doc.subjectId?.name || ''),
      topicName: doc.topicName || '',
      subTopic: doc.subTopic || '',
      status: doc.status || 'active',
      agreementText: doc.agreementText || 'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I agree to follow all examination instructions and rules.',
      instructions: Array.isArray(doc.instructions) && doc.instructions.length > 0 ? [...doc.instructions] : [...DEFAULT_STANDARD_RULES]
    });
    setModalOpen(true);
  };

  const handleRuleChange = (index, value) => {
    const updated = [...form.instructions];
    updated[index] = value;
    setForm(prev => ({ ...prev, instructions: updated }));
  };

  const addRule = () => {
    setForm(prev => ({ ...prev, instructions: [...prev.instructions, ''] }));
  };

  const removeRule = (index) => {
    if (form.instructions.length <= 1) {
      return toast.error('Instruction must contain at least one guideline rule');
    }
    const updated = form.instructions.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, instructions: updated }));
  };

  const moveRule = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= form.instructions.length) return;
    const updated = [...form.instructions];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setForm(prev => ({ ...prev, instructions: updated }));
  };

  const loadStandardTemplate = () => {
    setForm(prev => ({
      ...prev,
      instructions: [...DEFAULT_STANDARD_RULES]
    }));
    toast.success('Loaded Standard Exam Template Rules');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.subjectId) {
      return toast.error('Please select a Subject from the Subjects Tab');
    }
    if (!form.title.trim()) {
      return toast.error('Instruction title is required');
    }

    const cleanRules = form.instructions.filter(r => r && r.trim().length > 0);
    if (cleanRules.length === 0) {
      return toast.error('Please enter at least one instruction guideline');
    }

    const payload = {
      ...form,
      instructions: cleanRules,
      subjectId: form.subjectId,
      subjectName: selectedSubjectObj?.name || form.subjectName,
      topicName: form.topicName || '',
      subTopic: form.subTopic || '',
    };

    try {
      if (editingDoc) {
        await api.put(`/instructions/${editingDoc._id}`, payload);
        toast.success('Instruction updated successfully');
      } else {
        await api.post('/instructions', payload);
        toast.success('Instruction created successfully');
      }
      setModalOpen(false);
      fetchInstructions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save instruction');
    }
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: 'Delete Instruction?',
      text: 'Are you sure you want to delete these exam instructions?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete',
    });

    if (res.isConfirmed) {
      try {
        await api.delete(`/instructions/${id}`);
        toast.success('Instruction deleted');
        fetchInstructions();
      } catch {
        toast.error('Failed to delete instruction');
      }
    }
  };

  return (
    <div style={{ padding: '24px 28px', minHeight: '85vh', background: 'var(--bg)' }}>
      {/* ── Top Header Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              <RiFileList3Line />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>Exam Instructions</h1>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                Customize and manage pre-exam guidelines, rules, and declarations according to Subject, Topic, and Sub-Topic
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '9px 18px',
            borderRadius: 9,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
          }}
        >
          <RiAddLine fontSize={17} /> + Create Instruction
        </button>
      </div>

      {/* ── Quick Summary Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', padding: '16px 20px', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Total Guidelines</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{total}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', padding: '16px 20px', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Active Instructions</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
            {instructions.filter(i => i.status === 'active').length}
          </div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', padding: '16px 20px', borderRadius: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Subjects Covered</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>
            {allSubjects.length}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by title, subject, topic, or sub-topic..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{
            flex: '1 1 240px',
            padding: '9px 14px',
            borderRadius: 8,
            border: '1px solid var(--line,#cbd5e1)',
            background: 'var(--card)',
            fontSize: 13,
            color: 'var(--ink)'
          }}
        />

        <select
          value={subjectFilter}
          onChange={e => { setSubjectFilter(e.target.value); setPage(1); }}
          style={{
            padding: '9px 14px',
            borderRadius: 8,
            border: '1px solid var(--line,#cbd5e1)',
            background: 'var(--card)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink)'
          }}
        >
          <option value="all">All Subjects</option>
          {allSubjects.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '9px 14px',
            borderRadius: 8,
            border: '1px solid var(--line,#cbd5e1)',
            background: 'var(--card)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink)'
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
        </select>

        {(search || subjectFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setSubjectFilter('all'); setStatusFilter('all'); setPage(1); }}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #fca5a5',
              background: '#fef2f2',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Instructions Table ── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 18px' }}>Instruction Title</th>
              <th style={{ padding: '14px 18px' }}>Target Scope (Subject › Topic › Sub-Topic)</th>
              <th style={{ padding: '14px 18px' }}>Rules Count</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 36, color: 'var(--muted)' }}>Loading instructions…</td></tr>
            ) : instructions.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 36, color: 'var(--muted)' }}>
                  No instructions found. Click "+ Create Instruction" to define rules for your subjects and topics.
                </td>
              </tr>
            ) : (
              instructions.map(item => {
                const sName = item.subjectName || (item.subjectId?.name || 'All Subjects');
                const tName = item.topicName || 'All Topics';
                const subName = item.subTopic || '';
                const rulesCount = item.instructions?.length || 0;

                return (
                  <tr key={item._id} style={{ borderBottom: '1px solid var(--line,#e2e8f0)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{item.title}</div>
                      {item.summary && (
                        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{item.summary}</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', padding: '3px 9px', borderRadius: 8 }}>
                          {sName}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 8 }}>
                          › {tName}
                        </span>
                        {subName && (
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#f5f3ff', color: '#7c3aed', padding: '3px 8px', borderRadius: 8 }}>
                            › ↳ {subName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, background: '#ecfdf5', color: '#059669', padding: '3px 9px', borderRadius: 12 }}>
                        {rulesCount} Rules
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {item.status === 'active' ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                          ✓ ACTIVE
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 12, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                          DRAFT
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => setPreviewDoc(item)}
                          title="Preview Pre-Exam CBT View"
                          style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: '#334155' }}
                        >
                          <RiEyeLine fontSize={14} color="#0284c7" /> Preview
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit Instruction"
                          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        >
                          <RiEditLine fontSize={14} color="#2563eb" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          title="Delete Instruction"
                          style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        >
                          <RiDeleteBin2Line fontSize={14} color="#ef4444" />
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

      {/* ── CREATE / EDIT INSTRUCTION MODAL ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDoc ? 'Edit Exam Instruction' : 'Create Exam Instruction'}
        size="lg"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Target Scope Fields: Subject, Topic, Sub-Topic (Strictly synchronized with Subject Tab) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiBookOpenLine /> Target Exam Scope (According to Subject Tab)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
              {/* Subject Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  1. Subject *
                </label>
                <select
                  value={form.subjectId}
                  onChange={e => handleSubjectChange(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, fontWeight: 700, background: '#fff' }}
                >
                  <option value="">-- Select Subject --</option>
                  {allSubjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Topic Dropdown (from Subject's topicList) */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  2. Topic / Section {availableTopicNames.length > 0 ? `(${availableTopicNames.length} Topics)` : ''}
                </label>
                {availableTopicNames.length > 0 ? (
                  <select
                    value={form.topicName}
                    onChange={e => handleTopicChange(e.target.value)}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, fontWeight: 700, background: '#fff' }}
                  >
                    <option value="">-- All Topics in this Subject --</option>
                    {availableTopicNames.map((top, idx) => (
                      <option key={idx} value={top}>{top}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.topicName}
                    onChange={e => setForm(prev => ({ ...prev, topicName: e.target.value }))}
                    disabled={!form.subjectId}
                    placeholder={!form.subjectId ? 'Select subject first' : 'Enter or select topic name'}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: !form.subjectId ? '#f1f5f9' : '#fff' }}
                  />
                )}
              </div>

              {/* Sub-Topic Dropdown (from Topic's subTopics in Subject tab) */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                  3. Sub Topic {availableSubTopics.length > 0 ? `(${availableSubTopics.length} Sub-Topics)` : '(Optional)'}
                </label>
                {availableSubTopics.length > 0 ? (
                  <select
                    value={form.subTopic}
                    onChange={e => handleSubTopicChange(e.target.value)}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13, fontWeight: 600, background: '#fff' }}
                  >
                    <option value="">-- All Sub-Topics in this Topic --</option>
                    {availableSubTopics.map((sub, idx) => (
                      <option key={idx} value={sub}>{sub}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.subTopic}
                    onChange={e => handleSubTopicChange(e.target.value)}
                    disabled={!form.subjectId || !form.topicName}
                    placeholder={!form.subjectId || !form.topicName ? 'None / All Sub-Topics' : 'Optional Sub-Topic name'}
                    style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: !form.subjectId || !form.topicName ? '#f1f5f9' : '#fff' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Title & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Instruction Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Mathematics Exam Instructions & Guidelines"
                required
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
              >
                <option value="active">Active (Visible)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Subheading / Summary */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Summary / Subtitle
            </label>
            <input
              type="text"
              value={form.summary}
              onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="e.g. Please read all candidate instructions carefully before starting the exam."
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>

          {/* ── Instruction Guidelines / Bullet Points ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                Instruction Guidelines &amp; Rules ({form.instructions.length}) *
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={loadStandardTemplate}
                  style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <RiMagicLine /> Load Standard Rules
                </button>
                <button
                  type="button"
                  onClick={addRule}
                  style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <RiAddLine /> + Add Rule
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
              {form.instructions.map((rule, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#64748b', width: 22, textAlign: 'center' }}>
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={rule}
                    onChange={e => handleRuleChange(idx, e.target.value)}
                    placeholder={`Guideline rule #${idx + 1}`}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12.5 }}
                  />
                  <button
                    type="button"
                    onClick={() => moveRule(idx, idx - 1)}
                    disabled={idx === 0}
                    title="Move Up"
                    style={{ padding: 6, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}
                  >
                    <RiArrowUpLine fontSize={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRule(idx, idx + 1)}
                    disabled={idx === form.instructions.length - 1}
                    title="Move Down"
                    style={{ padding: 6, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: idx === form.instructions.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === form.instructions.length - 1 ? 0.4 : 1 }}
                  >
                    <RiArrowDownLine fontSize={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    title="Delete Rule"
                    style={{ padding: 6, borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <RiCloseLine fontSize={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Agreement Checkbox Declaration Text */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              Candidate Agreement Declaration Statement
            </label>
            <textarea
              rows={2}
              value={form.agreementText}
              onChange={e => setForm(prev => ({ ...prev, agreementText: e.target.value }))}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5 }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
            >
              {editingDoc ? 'Save Changes' : 'Create Instruction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── PRE-EXAM CBT PREVIEW MODAL ── */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={`Candidate View Preview: ${previewDoc.title}`}
          size="lg"
        >
          <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
            {/* Header info badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12 }}>
                  PRE-EXAM INSTRUCTION SCREEN
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  {previewDoc.title}
                </h3>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Applicable to: <strong>{previewDoc.subjectName || 'All Subjects'}</strong> › <strong>{previewDoc.topicName || 'All Topics'}</strong> {previewDoc.subTopic && `› ↳ ${previewDoc.subTopic}`}
                </div>
              </div>
            </div>

            {/* Candidate Rules Box */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #cbd5e1', padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiInformationLine color="#2563eb" /> General Instructions:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13, lineHeight: 1.7 }}>
                {previewDoc.instructions?.map((rule, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* Agreement Declaration Box */}
            <div style={{ background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <input type="checkbox" checked readOnly style={{ marginTop: 3 }} />
              <div style={{ fontSize: 12.5, color: '#1e3a8a', fontWeight: 600 }}>
                {previewDoc.agreementText}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
