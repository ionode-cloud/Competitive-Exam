import { useState, useEffect, useCallback, useRef } from 'react';
import { RiAddLine, RiEditLine, RiDeleteBin2Line, RiFileCopyLine, RiUploadLine, RiCloseLine, RiArrowLeftLine, RiBookOpenLine, RiFolderLine, RiArrowRightSLine, RiQuestionLine, RiImageLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import MathInput, { MathRenderer } from '../components/MathInput';

const diffBadge = (d) => {
  const map = { easy: 'admin-badge-green', moderate: 'admin-badge-yellow', difficult: 'admin-badge-red' };
  return <span className={map[d] || 'admin-badge-gray'}>{d}</span>;
};

const createEmptyQuestionBlock = () => ({
  questionText: '',
  questionImage: '',
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ],
  correctAnswer: 'A',
  explanation: '',
  explanationImage: '',
});

export default function QuestionBank() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null); // Selected subject object for card view
  const [selectedTopic, setSelectedTopic] = useState('');

  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ difficulty: '' });

  // View Mode: 'cards' (Subject Cards Grid), 'list' (Questions List for Selected Subject), 'form' (Full Page Create/Edit Form)
  const [viewMode, setViewMode] = useState('cards');
  const [editing, setEditing] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockImageUploading, setBlockImageUploading] = useState({}); // { blockIdx_field: true/false }

  // Top Bar Common Configuration State
  const [topMeta, setTopMeta] = useState({
    subject: '',
    topic: '',
    section: 'General',
    marks: 1,
    negativeMarks: 0.25,
    difficulty: 'moderate',
    status: 'published',
  });

  // Dynamic Array of Question Blocks
  const [questionBlocks, setQuestionBlocks] = useState([createEmptyQuestionBlock()]);

  // Store all subjects for dropdowns vs cards grid
  const [allSubjects, setAllSubjects] = useState([]);

  // Fetch subjects list for Cards Grid (Only show subjects that have questions added)
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get('/subjects', { params: { limit: 100 } });
      if (res.data.success) {
        const fullList = res.data.data || [];
        setAllSubjects(fullList);
        setSubjects(fullList);
      }
    } catch {
      toast.error('Failed to load subjects');
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Fetch questions for selected subject
  const fetchQuestions = useCallback(async () => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const { data } = await api.get('/questions', {
        params: {
          page,
          limit: 20,
          search,
          subject: selectedSubject._id,
          topic: selectedTopic || undefined,
          ...filters
        }
      });
      setQuestions(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedTopic, page, search, filters]);

  useEffect(() => {
    if (viewMode === 'list' && selectedSubject) {
      fetchQuestions();
    }
  }, [viewMode, selectedSubject, selectedTopic, fetchQuestions]);

  // Open card detailed view
  const handleSelectSubjectCard = (subj) => {
    setSelectedSubject(subj);
    setSelectedTopic('');
    setPage(1);
    setSearch('');
    setViewMode('list');
  };

  // Create Question (Pre-selects current subject if opened from subject view)
  const openCreate = (preSubject = null) => {
    const activeSubj = preSubject || selectedSubject || subjects[0];
    setEditing(null);
    setTopMeta({
      subject: activeSubj?._id || '',
      topic: selectedTopic || (activeSubj?.topics?.[0] || ''),
      section: 'General',
      marks: 1,
      negativeMarks: 0.25,
      difficulty: 'moderate',
      status: 'published',
    });
    setQuestionBlocks([createEmptyQuestionBlock()]);
    setViewMode('form');
  };

  // Edit Question
  const openEdit = (q) => {
    setEditing(q);
    setTopMeta({
      subject: q.subject?._id || q.subject || '',
      topic: q.topic || '',
      section: q.section || 'General',
      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0.25,
      difficulty: q.difficulty || 'moderate',
      status: q.status || 'published',
    });
    setQuestionBlocks([{
      questionText: q.questionText || '',
      questionImage: q.questionImage || '',
      options: q.options && q.options.length === 4 ? q.options : createEmptyQuestionBlock().options,
      correctAnswer: q.correctAnswer || 'A',
      explanation: q.explanation || '',
      explanationImage: q.explanationImage || '',
    }]);
    setViewMode('form');
  };

  // Block Handlers
  const handleAddQuestionBlock = () => {
    setQuestionBlocks(prev => [...prev, createEmptyQuestionBlock()]);
  };

  const handleRemoveQuestionBlock = (index) => {
    setQuestionBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const handleBlockChange = (blockIdx, field, value) => {
    setQuestionBlocks(prev => {
      const updated = [...prev];
      updated[blockIdx] = { ...updated[blockIdx], [field]: value };
      return updated;
    });
  };

  const handleOptionChange = (blockIdx, optIdx, value) => {
    setQuestionBlocks(prev => {
      const updated = [...prev];
      const opts = [...updated[blockIdx].options];
      opts[optIdx] = { ...opts[optIdx], text: value };
      updated[blockIdx] = { ...updated[blockIdx], options: opts };
      return updated;
    });
  };

  // Upload image for a block field (questionImage or explanationImage)
  const handleImageUpload = async (blockIdx, field, file) => {
    if (!file) return;
    const key = `${blockIdx}_${field}`;
    setBlockImageUploading(prev => ({ ...prev, [key]: true }));
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/questions/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success && data.url) {
        handleBlockChange(blockIdx, field, data.url);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Image upload failed');
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setBlockImageUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRemoveImage = (blockIdx, field) => {
    handleBlockChange(blockIdx, field, '');
  };

  const handleSubmitAll = async (e) => {
    if (e) e.preventDefault();
    if (!topMeta.subject) return toast.error('Please select a Subject');

    for (let i = 0; i < questionBlocks.length; i++) {
      const b = questionBlocks[i];
      if (!b.questionText.trim()) return toast.error(`Question #${i + 1} statement is required`);
      for (let j = 0; j < 4; j++) {
        if (!b.options[j].text.trim()) return toast.error(`Question #${i + 1} Option ${b.options[j].label} is required`);
      }
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        const payload = {
          ...topMeta,
          ...questionBlocks[0],
        };
        await api.put(`/questions/${editing._id}`, payload);
        toast.success('Question updated successfully!');
      } else {
        const payload = questionBlocks.map(q => ({
          ...topMeta,
          questionText: q.questionText,
          questionImage: q.questionImage || '',
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          explanationImage: q.explanationImage || '',
        }));

        await api.post('/questions', payload.length === 1 ? payload[0] : payload);
        toast.success(payload.length === 1 ? 'Question created successfully!' : `${payload.length} Questions created successfully!`);
      }

      fetchSubjects();
      if (selectedSubject) {
        setViewMode('list');
        fetchQuestions();
      } else {
        setViewMode('cards');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (q) => {
    const result = await Swal.fire({ title: 'Delete question?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/questions/${q._id}`);
      toast.success('Question deleted');
      fetchQuestions();
      fetchSubjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleDeleteSubjectCard = async (s, e) => {
    if (e) e.stopPropagation();
    const result = await Swal.fire({
      title: `Delete Subject "${s.name}"?`,
      text: 'Are you sure you want to delete this subject card from Question Bank?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete'
    });
    if (!result.isConfirmed) return;
    try {
      try {
        await api.delete(`/subjects/${s._id}`);
      } catch {
        await api.delete(`/subject-tests/subjects/${s._id}`);
      }
      toast.success(`Subject "${s.name}" deleted successfully`);
      setSubjects(prev => prev.filter(item => item._id !== s._id));
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  const handleDuplicate = async (id) => {
    try { await api.post(`/questions/${id}/duplicate`); toast.success('Duplicated!'); fetchQuestions(); fetchSubjects(); }
    catch { toast.error('Duplicate failed'); }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({ title: `Delete ${selectedIds.length} questions?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!result.isConfirmed) return;
    try {
      await api.delete('/questions/bulk', { data: { ids: selectedIds } });
      toast.success('Deleted'); setSelectedIds([]); fetchQuestions(); fetchSubjects();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/questions/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(data.message);
      fetchQuestions();
      fetchSubjects();
    } catch { toast.error('Import failed'); }
    e.target.value = '';
  };

  const columns = [
    {
      key: 'questionText', label: 'Question Statement', render: r => (
        <div className="max-w-md">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
            <MathRenderer text={r.questionText} />
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {r.topic && <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 font-semibold">Topic: {r.topic}</span>}
            {r.section && <span className="text-xs text-slate-400 font-medium">• Section: {r.section}</span>}
          </div>
        </div>
      )
    },
    { key: 'difficulty', label: 'Difficulty', render: r => diffBadge(r.difficulty) },
    {
      key: 'correctAnswer', label: 'Correct Answer', render: r => (
        <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center justify-center border border-emerald-300 dark:border-emerald-700">
          {r.correctAnswer}
        </span>
      )
    },
    { key: 'marks', label: 'Marks', render: r => <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">+{r.marks} / -{r.negativeMarks}</span> },
    {
      key: 'actions', label: 'Actions', render: r => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Edit Question"><RiEditLine className="w-4 h-4" /></button>
          <button onClick={() => handleDuplicate(r._id)} className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 transition-colors" title="Duplicate Question"><RiFileCopyLine className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Delete Question"><RiDeleteBin2Line className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     VIEW MODE 1: SUBJECT CARDS GRID (OVERVIEW)
  ══════════════════════════════════════════════════════════════════════════ */
  if (viewMode === 'cards') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Question Bank Subjects</h2>
            <p className="text-sm text-slate-500 mt-0.5">Select a Subject Card to view, add, edit, or delete questions</p>
          </div>
          <button onClick={() => openCreate()} className="admin-btn-primary px-5 py-2.5">
            <RiAddLine className="w-5 h-5" /> + Create Questions
          </button>
        </div>

        {/* SUBJECT CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(s => (
            <div
              key={s._id}
              onClick={() => handleSelectSubjectCard(s)}
              className="group bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-sm"
                      style={{ background: s.color || '#6366f1' }}
                    >
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {s.name}
                      </h3>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                        {s.questionCount || 0} Questions
                      </span>
                    </div>
                  </div>

                  {/* Top-Right Delete Button Icon */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSubjectCard(s, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete Subject"
                  >
                    <RiDeleteBin2Line className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {s.description || 'Subject practice questions bank.'}
                </p>

                {/* Topics Preview Badges */}
                <div className="space-y-1.5 mb-6">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Topics Covered:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {s.topics && s.topics.length > 0 ? (
                      s.topics.map((top, idx) => (
                        <span key={idx} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {top}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs italic text-slate-400">General practice questions</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Manage Questions <RiArrowRightSLine className="w-4 h-4" />
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreate(s);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <RiAddLine className="w-3.5 h-3.5" /> + Add
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSubjectCard(s, e)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-600 hover:text-white text-red-600 dark:bg-red-900/30 dark:hover:bg-red-600 dark:text-red-300 transition-colors flex items-center gap-1"
                    title="Delete Subject"
                  >
                    <RiDeleteBin2Line className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     VIEW MODE 2: QUESTIONS LIST FOR SELECTED SUBJECT
  ══════════════════════════════════════════════════════════════════════════ */
  if (viewMode === 'list' && selectedSubject) {
    const selectedSubjTopics = selectedSubject.topics || [];
    return (
      <div className="space-y-5">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('cards')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors flex items-center gap-1.5 text-sm"
            >
              <RiArrowLeftLine className="w-4 h-4" /> Back to Subject Cards
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: selectedSubject.color || '#6366f1' }}></span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedSubject.name} Questions
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Total {total} questions available in {selectedSubject.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="admin-btn-secondary cursor-pointer py-2">
              <RiUploadLine className="w-4 h-4" /> Import Excel
              <input type="file" accept=".xlsx,.csv" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={() => openCreate(selectedSubject)} className="admin-btn-primary px-5 py-2">
              <RiAddLine className="w-4 h-4" /> + Add Question
            </button>
          </div>
        </div>

        {/* Topic & Search Filter Bar */}
        <div className="admin-card p-4 flex flex-wrap items-center gap-3">
          <select
            value={selectedTopic}
            onChange={e => { setSelectedTopic(e.target.value); setPage(1); }}
            className="admin-input w-48 font-semibold"
          >
            <option value="">All Topics</option>
            {selectedSubjTopics.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
          </select>

          <select
            value={filters.difficulty}
            onChange={e => { setFilters(f => ({ ...f, difficulty: e.target.value })); setPage(1); }}
            className="admin-input w-40"
          >
            <option value="">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="difficult">Difficult</option>
          </select>

          {(selectedTopic || filters.difficulty) && (
            <button
              onClick={() => { setSelectedTopic(''); setFilters({ difficulty: '' }); setPage(1); }}
              className="admin-btn-secondary text-xs"
            >
              Clear Filters
            </button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={questions}
          total={total}
          page={page}
          limit={20}
          loading={loading}
          onPageChange={setPage}
          search={search}
          onSearch={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder={`Search in ${selectedSubject.name}...`}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onBulkDelete={handleBulkDelete}
          emptyMessage={`No questions in ${selectedSubject.name}. Click "+ Add Question" to create.`}
        />
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     VIEW MODE 3: FULL PAGE QUESTION FORM (CREATE / EDIT)
  ══════════════════════════════════════════════════════════════════════════ */
  const allSubjList = allSubjects.length > 0 ? allSubjects : subjects;
  const selectedSubjectObjInForm = allSubjList.find(s => String(s._id) === String(topMeta.subject));
  const availableTopicsInForm = selectedSubjectObjInForm?.topics || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Full Page Form Navigation Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(selectedSubject ? 'list' : 'cards')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors flex items-center gap-1.5 text-sm"
          >
            <RiArrowLeftLine className="w-4 h-4" /> {selectedSubject ? `Back to ${selectedSubject.name}` : 'Back to Subject Cards'}
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {editing ? 'Edit Question' : 'Create New Questions'}
            </h2>
            <p className="text-xs text-slate-500">
              {!editing ? `Full-page mode: ${questionBlocks.length} Question Block(s)` : 'Update question details'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMode(selectedSubject ? 'list' : 'cards')}
            className="px-4 py-2 rounded-lg font-semibold text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmitAll}
            disabled={isSubmitting}
            className="admin-btn-primary px-6 py-2"
          >
            {isSubmitting ? 'Saving Questions...' : editing ? 'Update Question' : `Save ${questionBlocks.length > 1 ? `${questionBlocks.length} Questions` : 'Question'}`}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitAll} className="space-y-6">

        {/* TOP GLOBAL CONFIGURATION BAR */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Global Question Settings
              </span>
              <p className="text-xs text-slate-500 mt-0.5">Applied to all question blocks below</p>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={handleAddQuestionBlock}
                className="px-4 py-2 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 shadow"
              >
                <RiAddLine className="w-4 h-4" /> + Add Another Question Field
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="admin-label text-xs font-bold">Subject *</label>
              <select
                value={topMeta.subject}
                onChange={e => setTopMeta(m => ({ ...m, subject: e.target.value }))}
                className="admin-input"
                required
              >
                <option value="">Select Subject</option>
                {(allSubjects.length > 0 ? allSubjects : subjects).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="admin-label text-xs font-bold">Topic Name</label>
              {availableTopicsInForm.length > 0 ? (
                <select
                  value={topMeta.topic}
                  onChange={e => setTopMeta(m => ({ ...m, topic: e.target.value }))}
                  className="admin-input"
                >
                  <option value="">Select Topic</option>
                  {availableTopicsInForm.map((t, i) => <option key={i} value={t}>{t}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={topMeta.topic}
                  onChange={e => setTopMeta(m => ({ ...m, topic: e.target.value }))}
                  className="admin-input"
                  placeholder="e.g. Percentage"
                />
              )}
            </div>

            <div>
              <label className="admin-label text-xs font-bold">Marks (+)</label>
              <input
                type="number"
                step="0.5"
                value={topMeta.marks}
                onChange={e => setTopMeta(m => ({ ...m, marks: Number(e.target.value) }))}
                className="admin-input font-bold"
                required
              />
            </div>

            <div>
              <label className="admin-label text-xs font-bold text-red-600 dark:text-red-400">Negative Marks (-)</label>
              <input
                type="number"
                step="0.25"
                value={topMeta.negativeMarks}
                onChange={e => setTopMeta(m => ({ ...m, negativeMarks: Number(e.target.value) }))}
                className="admin-input font-bold text-red-600 dark:text-red-400"
                required
              />
            </div>

            <div>
              <label className="admin-label text-xs font-bold">Difficulty</label>
              <select
                value={topMeta.difficulty}
                onChange={e => setTopMeta(m => ({ ...m, difficulty: e.target.value }))}
                className="admin-input"
              >
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="difficult">Difficult</option>
              </select>
            </div>
          </div>
        </div>

        {/* FULL PAGE QUESTION BLOCKS CARDS */}
        <div className="space-y-6">
          {questionBlocks.map((qBlock, blockIdx) => (
            <div key={blockIdx} className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">

              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-blue-600 text-white text-sm font-extrabold flex items-center justify-center shadow">
                    {blockIdx + 1}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Question #{blockIdx + 1} Statement &amp; Options
                  </h3>
                </div>

                {questionBlocks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestionBlock(blockIdx)}
                    className="text-xs text-red-500 hover:text-red-700 font-extrabold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <RiCloseLine className="w-4 h-4" /> Remove Question #{blockIdx + 1}
                  </button>
                )}
              </div>

              {/* Question Text Field */}
              <div>
                <label className="admin-label text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Question Text Statement *
                </label>
                <MathInput
                  rows={4}
                  value={qBlock.questionText}
                  onChange={val => handleBlockChange(blockIdx, 'questionText', val)}
                  placeholder={`Type statement for Question #${blockIdx + 1}...`}
                  required
                />
              </div>

              {/* Question Image Upload */}
              <div className="p-3 rounded-xl border border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/10 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                  <RiImageLine className="w-4 h-4" /> Question Image <span className="font-normal text-slate-400">(optional — shown with question in exam)</span>
                </label>
                {qBlock.questionImage ? (
                  <div className="flex items-start gap-3">
                    <img
                      src={qBlock.questionImage}
                      alt="Question"
                      className="h-24 w-auto rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(blockIdx, 'questionImage')}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-bold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <RiCloseLine className="w-4 h-4" /> Remove Image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    {blockImageUploading[`${blockIdx}_questionImage`] ? (
                      <span className="animate-pulse">Uploading...</span>
                    ) : (
                      <><RiUploadLine className="w-4 h-4" /> Upload Image (JPG, PNG, WebP)</>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={blockImageUploading[`${blockIdx}_questionImage`]}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(blockIdx, 'questionImage', file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Options Grid */}
              <div className="space-y-2 pt-2">
                <label className="admin-label text-sm font-bold text-slate-800 dark:text-slate-200">
                  Options (A, B, C, D) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {qBlock.options.map((opt, optIdx) => (
                    <div key={opt.label} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-xs font-extrabold flex items-center justify-center flex-shrink-0 text-slate-800 dark:text-slate-200">
                          {opt.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Option {opt.label}</span>
                      </div>
                      <MathInput
                        singleLine
                        value={opt.text}
                        onChange={val => handleOptionChange(blockIdx, optIdx, val)}
                        placeholder={`Option ${opt.label} text`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer & Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="admin-label text-sm font-bold text-slate-800 dark:text-slate-200">
                    Correct Answer Option *
                  </label>
                  <select
                    value={qBlock.correctAnswer}
                    onChange={e => handleBlockChange(blockIdx, 'correctAnswer', e.target.value)}
                    className="admin-input font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                  >
                    {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>Option {l}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="admin-label text-sm font-bold text-slate-800 dark:text-slate-200">
                    Explanation (Shown after exam submission)
                  </label>
                  <MathInput
                    rows={4}
                    value={qBlock.explanation}
                    onChange={val => handleBlockChange(blockIdx, 'explanation', val)}
                    placeholder="Enter step-by-step explanation..."
                  />
                </div>
              </div>

              {/* Explanation Image Upload */}
              <div className="p-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/10 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <RiImageLine className="w-4 h-4" /> Explanation Image <span className="font-normal text-slate-400">(optional — shown with explanation after submission)</span>
                </label>
                {qBlock.explanationImage ? (
                  <div className="flex items-start gap-3">
                    <img
                      src={qBlock.explanationImage}
                      alt="Explanation"
                      className="h-24 w-auto rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(blockIdx, 'explanationImage')}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-bold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <RiCloseLine className="w-4 h-4" /> Remove Image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors">
                    {blockImageUploading[`${blockIdx}_explanationImage`] ? (
                      <span className="animate-pulse">Uploading...</span>
                    ) : (
                      <><RiUploadLine className="w-4 h-4" /> Upload Explanation Image (JPG, PNG, WebP)</>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={blockImageUploading[`${blockIdx}_explanationImage`]}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(blockIdx, 'explanationImage', file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {!editing && (
            <button
              type="button"
              onClick={handleAddQuestionBlock}
              className="px-4 py-2 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5"
            >
              <RiAddLine className="w-4 h-4" /> + Add Another Question Field
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode(selectedSubject ? 'list' : 'cards')}
              className="px-4 py-2 rounded-lg font-semibold text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={isSubmitting}
              className="admin-btn-primary px-8 py-2.5 text-base"
            >
              {isSubmitting ? 'Saving...' : editing ? 'Update Question' : `Save ${questionBlocks.length > 1 ? `${questionBlocks.length} Questions` : 'Question'}`}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
