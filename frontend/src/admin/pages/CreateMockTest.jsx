import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  RiDragMoveLine, RiDeleteBin2Line, RiAddLine, RiSaveLine,
  RiCheckboxCircleLine, RiArrowLeftLine, RiEditLine, RiQuestionLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Modal from '../components/Modal';

function SortableQuestion({ item, onRemove, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id || item.question?._id || String(Math.random())
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const q = item.question || {};
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg group hover:border-primary-300 transition-colors">
      <button {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500 touch-none">
        <RiDragMoveLine className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" dangerouslySetInnerHTML={{ __html: q.questionText || 'Question text unavailable' }} />
        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400">
          <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-semibold">
            Section: {item.section || q.section || 'General'}
          </span>
          <span>• Mark: +{item.marks || q.marks || 1}</span>
          <span>• Negative: -{item.negativeMarks !== undefined ? item.negativeMarks : (q.negativeMarks || 0.25)}</span>
          {q.correctAnswer && (
            <span className="font-bold text-emerald-600 dark:text-emerald-400">Ans: Option {q.correctAnswer}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button onClick={onEdit} className="p-1.5 text-blue-500 hover:text-blue-700 transition-colors" title="Edit Question">
            <RiEditLine className="w-4 h-4" />
          </button>
        )}
        <button onClick={onRemove} className="p-1.5 text-red-400 hover:text-red-600 transition-colors" title="Delete Question">
          <RiDeleteBin2Line className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function CreateMockTest() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [exams, setExams] = useState([]);
  const [odishaExamOptions, setOdishaExamOptions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [testId, setTestId] = useState(id || null);

  // Bank Modal State
  const [bankModal, setBankModal] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankSelected, setBankSelected] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [bankFilters, setBankFilters] = useState({ subject: '', difficulty: '', search: '' });

  // Direct Custom Question Modal State
  const [customQModal, setCustomQModal] = useState(false);
  const [customSections, setCustomSections] = useState(['General', 'Reasoning', 'Math', 'English', 'GK', 'Computer']);
  const [isNewSection, setIsNewSection] = useState(false);

  // Form State
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Dropdown Toggles for Exam Paper Name
  const [isCustomMockName, setIsCustomMockName] = useState(false);
  const [isCustomExamPaper, setIsCustomExamPaper] = useState(false);

  const examPaperList = ['RI', 'ARI', 'AMINA', 'PEO', 'OSSSC_CGL', 'OPSC_OAS'];

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      customName: '',
      examination: '',
      testType: 'full_length',
      examPaper: 'RI',
      customExamPaper: '',
      duration: 60,
      totalQuestions: 100,
      negativeMarking: 0.25,
      pricingType: 'paid',
      price: 499,
      status: 'draft',
      shuffleQuestions: false,
      shuffleOptions: false,
      showResultImmediately: true,
      enableReview: true,
      allowResume: false,
      enableCalculator: false,
    }
  });

  // Direct Question Form
  const {
    register: registerQ,
    handleSubmit: handleSubmitQ,
    reset: resetQ,
    setValue: setValueQ,
    formState: { errors: errorsQ, isSubmitting: isSubmittingQ }
  } = useForm({
    defaultValues: {
      questionText: '',
      section: 'General',
      newSectionName: '',
      marks: 1,
      negativeMarks: 0.25,
      correctAnswer: 'A',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      explanation: '',
    }
  });

  const pricingType = watch('pricingType');
  const totalQuestions = watch('totalQuestions');
  const sensors = useSensors(useSensor(PointerSensor));

  const loadInitialData = useCallback(async () => {
    try {
      const [eRes, subRes, oRes] = await Promise.all([
        api.get('/examinations/dropdown'),
        api.get('/subjects/dropdown'),
        api.get('/odisha-exams/options').catch(() => ({ data: { data: {} } })),
      ]);
      setExams(eRes.data.data || []);
      setSubjects(subRes.data.data || []);
      if (oRes.data?.data?.mockTestNames) {
        setOdishaExamOptions(oRes.data.data.mockTestNames);
      }
    } catch {}

    if (isEditing) {
      try {
        const r = await api.get(`/mocktests/${id}`);
        const mt = r.data.data;
        reset({
          name: mt.name,
          customName: '',
          examination: mt.examination?._id || '',
          testType: mt.testType || 'full_length',
          examPaper: mt.examPaper || 'RI',
          customExamPaper: '',
          duration: mt.duration || 60,
          totalQuestions: mt.totalQuestions || 100,
          negativeMarking: mt.negativeMarking !== undefined ? mt.negativeMarking : 0.25,
          pricingType: mt.pricingType || 'paid',
          price: mt.price || 0,
          status: mt.status || 'draft',
          shuffleQuestions: mt.shuffleQuestions || false,
          shuffleOptions: mt.shuffleOptions || false,
          showResultImmediately: mt.showResultImmediately !== undefined ? mt.showResultImmediately : true,
          enableReview: mt.enableReview !== undefined ? mt.enableReview : true,
          allowResume: mt.allowResume || false,
          enableCalculator: mt.enableCalculator || false,
        });
        setQuestions(mt.questions || []);
        setTestId(mt._id);
      } catch {
        toast.error('Failed to load mock test details');
      }
    }
  }, [id, isEditing, reset]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const saveForm = async (values) => {
    setSaving(true);
    try {
      const finalName = isCustomMockName ? values.customName?.trim() : values.name;
      const finalExamPaper = isCustomExamPaper ? values.customExamPaper?.trim() : values.examPaper;

      if (!finalName) {
        toast.error('examPaper Name / Mock Test Name is required');
        setSaving(false);
        return;
      }

      const payload = {
        ...values,
        name: finalName,
        examPaper: finalExamPaper,
        price: values.pricingType === 'free' ? 0 : Number(values.price) || 0,
      };

      if (testId) {
        await api.put(`/mocktests/${testId}`, payload);
        toast.success('Mock Test saved successfully!');
      } else {
        const res = await api.post('/mocktests', payload);
        setTestId(res.data.data._id);
        toast.success('Mock Test created! Now add questions to enable publish.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const loadBankQuestions = async () => {
    setBankLoading(true);
    try {
      const { data } = await api.get('/questions', {
        params: { ...bankFilters, status: 'published', limit: 50 }
      });
      setBankQuestions(data.data);
    } catch {
      toast.error('Failed to load question bank');
    } finally {
      setBankLoading(false);
    }
  };

  const openBankModal = () => {
    setBankModal(true);
    loadBankQuestions();
  };

  const addFromBank = async () => {
    if (!testId) {
      toast.error('Please save the mock test draft first before adding questions');
      return;
    }
    if (!bankSelected.length) {
      toast.error('Select at least one question');
      return;
    }
    try {
      await api.post(`/mocktests/${testId}/questions`, { questionIds: bankSelected });
      toast.success(`${bankSelected.length} questions added from bank!`);
      setBankModal(false);
      setBankSelected([]);
      const res = await api.get(`/mocktests/${testId}`);
      setQuestions(res.data.data.questions || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add questions');
    }
  };

  const openAddCustomQuestionModal = () => {
    if (!testId) {
      toast.error('Please save the mock test draft first before adding custom questions');
      return;
    }
    setIsNewSection(false);
    resetQ({
      questionText: '',
      section: 'General',
      newSectionName: '',
      marks: 1,
      negativeMarks: watch('negativeMarking') || 0.25,
      correctAnswer: 'A',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      explanation: '',
    });
    setCustomQModal(true);
  };

  const onSaveCustomQuestion = async (values) => {
    try {
      const finalSection = isNewSection ? values.newSectionName?.trim() : values.section;
      if (!finalSection) {
        toast.error('Section is required');
        return;
      }

      const options = [
        { label: 'A', text: values.optionA },
        { label: 'B', text: values.optionB },
        { label: 'C', text: values.optionC },
        { label: 'D', text: values.optionD },
      ];

      const payload = {
        questionText: values.questionText,
        options,
        correctAnswer: values.correctAnswer,
        explanation: values.explanation,
        section: finalSection,
        marks: Number(values.marks) || 1,
        negativeMarks: Number(values.negativeMarks) !== undefined ? Number(values.negativeMarks) : 0.25,
      };

      const res = await api.post(`/mocktests/${testId}/questions/direct`, payload);
      toast.success('Custom question added to test!');
      setQuestions(res.data.data.questions || []);

      if (isNewSection && !customSections.includes(finalSection)) {
        setCustomSections(prev => [...prev, finalSection]);
      }
      setCustomQModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save question');
    }
  };

  const removeQuestion = async (questionId) => {
    if (!testId) return;
    try {
      await api.delete(`/mocktests/${testId}/questions/${questionId}`);
      setQuestions(prev => prev.filter(q => (q.question?._id || q._id) !== questionId));
      toast.success('Question removed');
    } catch {
      toast.error('Remove failed');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex(q => (q.question?._id || q._id) === active.id);
    const newIndex = questions.findIndex(q => (q.question?._id || q._id) === over.id);
    const reordered = arrayMove(questions, oldIndex, newIndex);
    setQuestions(reordered);

    try {
      await api.patch(`/mocktests/${testId}/questions/reorder`, {
        orderedIds: reordered.map(q => q.question?._id || q._id),
      });
    } catch {}
  };

  const handlePublish = async () => {
    if (questions.length < totalQuestions) {
      toast.error(`Please add all ${totalQuestions} questions before publishing (Currently: ${questions.length}/${totalQuestions})`);
      return;
    }
    setPublishing(true);
    try {
      await api.patch(`/mocktests/${testId}/publish`);
      toast.success('Mock Test published successfully!');
      navigate('/admin/mock-tests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const progress = Math.min(100, (questions.length / (totalQuestions || 1)) * 100);
  const canPublish = questions.length >= (totalQuestions || 1);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={() => navigate('/admin/mock-tests')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <RiArrowLeftLine className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
            {isEditing ? 'Edit Mock Test' : 'Create New Mock Test'}
          </h2>
          <p className="text-sm text-slate-500">Fill test properties then add questions to publish</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit(saveForm)}
            disabled={saving}
            className="admin-btn-secondary"
          >
            <RiSaveLine className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={!canPublish || publishing || !testId}
            className={`admin-btn-primary ${!canPublish ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!canPublish ? `Add ${totalQuestions - questions.length} more questions to publish` : 'Publish Test'}
          >
            <RiCheckboxCircleLine className="w-4 h-4" />
            {publishing ? 'Publishing...' : 'Publish Test'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="admin-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
              Mock Test Properties
            </h3>

            {/* 1. Exam Paper Category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="admin-label mb-0">Create New examPaper / Category *</label>
                <button
                  type="button"
                  onClick={() => setIsCustomExamPaper(!isCustomExamPaper)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                >
                  {isCustomExamPaper ? '← Select Existing' : '+ Type Custom Category'}
                </button>
              </div>
              {isCustomExamPaper ? (
                <input
                  {...register('customExamPaper', { required: isCustomExamPaper ? 'Custom Category required' : false })}
                  className="admin-input"
                  placeholder="e.g. RI, ARI, AMINA, PEO..."
                />
              ) : (
                <select {...register('examPaper')} className="admin-input">
                  {examPaperList.map(ep => (
                    <option key={ep} value={ep}>{ep}</option>
                  ))}
                  <option value="__custom__">+ Type Custom Category...</option>
                </select>
              )}
            </div>

            {/* 2. Test Type & Mock Test Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="admin-label">test type *</label>
                <select {...register('testType')} className="admin-input">
                  <option value="full_length">full Length Test</option>
                  <option value="sectional">sectional Test</option>
                  <option value="chapter_wise">chapter wise</option>
                  <option value="previous_year">previous year</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="admin-label mb-0">examPaper Name (Mock Test) *</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomMockName(!isCustomMockName)}
                    className="text-xs text-primary-600 font-semibold"
                  >
                    {isCustomMockName ? '← Select Existing' : '+ Create New'}
                  </button>
                </div>
                {isCustomMockName ? (
                  <input
                    {...register('customName', { required: isCustomMockName ? 'Mock Test Name is required' : false })}
                    className="admin-input font-mono text-sm"
                    placeholder="OSSSC_RI_mockTest-01"
                  />
                ) : (
                  <select {...register('name', { required: 'Mock Test Name required' })} className="admin-input font-mono text-sm">
                    {odishaExamOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="OSSSC_RI_mockTest-01">OSSSC_RI_mockTest-01</option>
                    <option value="OPSC_OAS_mockTest-01">OPSC_OAS_mockTest-01</option>
                    <option value="__custom__">+ Create new mock test name...</option>
                  </select>
                )}
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
            </div>

            {/* 3. Duration, Total Question, Negative Mark */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="admin-label">Duration (min) *</label>
                <input {...register('duration', { valueAsNumber: true, min: 1 })} type="number" min="1" className="admin-input" placeholder="60min" />
              </div>
              <div>
                <label className="admin-label">Total Question *</label>
                <input {...register('totalQuestions', { valueAsNumber: true, min: 1 })} type="number" min="1" className="admin-input" placeholder="100" />
              </div>
              <div>
                <label className="admin-label">negative Mark *</label>
                <input {...register('negativeMarking', { valueAsNumber: true })} type="number" step="0.25" className="admin-input" placeholder="-1 or 0.25" />
              </div>
            </div>

            {/* 4. Free / Paid Selection */}
            <div>
              <label className="admin-label">Free / Paid Selection *</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('pricingType')} type="radio" value="free" className="text-primary-600" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Free</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('pricingType')} type="radio" value="paid" className="text-primary-600" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Paid</span>
                </label>
              </div>

              {pricingType === 'paid' && (
                <div className="mt-3 relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input {...register('price', { valueAsNumber: true, min: 1 })} type="number" min="1" placeholder="499" className="admin-input pl-8 font-semibold" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Panel */}
        <div className="space-y-4">
          {/* Question Progress Card */}
          <div className="admin-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Question Status</span>
              <span className={`text-sm font-bold ${canPublish ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}`}>
                {questions.length} / {totalQuestions}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${canPublish ? 'bg-emerald-500' : 'bg-primary-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {canPublish
                ? '✅ All questions added! Click "Publish Test" when ready.'
                : `Add ${(totalQuestions || 0) - questions.length} more questions to enable publishing.`}
            </p>
          </div>

          {/* Question Addition Action Buttons */}
          <div className="admin-card p-5 space-y-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Add Questions to Test
            </p>
            <button
              type="button"
              onClick={openBankModal}
              disabled={!testId}
              className="admin-btn-secondary w-full justify-center py-2.5"
            >
              <RiAddLine className="w-4 h-4" /> Add From Question bank
            </button>

            <button
              type="button"
              onClick={openAddCustomQuestionModal}
              disabled={!testId}
              className="admin-btn-primary w-full justify-center py-2.5"
            >
              <RiQuestionLine className="w-4 h-4" /> Add Custom Question
            </button>

            {!testId && (
              <p className="text-xs text-amber-500 text-center font-medium">
                ⚠️ Click "Save Draft" above first to enable question addition
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Questions List Section */}
      {testId && (
        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Questions in Test ({questions.length})
            </h3>
            <span className="text-xs text-slate-400">Drag items to reorder questions</span>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <RiQuestionLine className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No questions added yet</p>
              <p className="text-xs text-slate-400 mt-1">Use "Add From Question bank" or "Add Custom Question" above</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={questions.map(q => q.question?._id || q._id || String(Math.random()))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {questions.map((item) => (
                    <SortableQuestion
                      key={item.question?._id || item._id}
                      item={item}
                      onRemove={() => removeQuestion(item.question?._id || item._id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* 1. Add From Question Bank Modal */}
      <Modal
        isOpen={bankModal}
        onClose={() => { setBankModal(false); setBankSelected([]); }}
        title="Add Questions from Question Bank"
        size="xl"
        footer={
          <>
            <p className="text-sm text-slate-500 mr-auto font-medium">{bankSelected.length} selected</p>
            <button onClick={() => setBankModal(false)} className="admin-btn-secondary">Cancel</button>
            <button onClick={addFromBank} disabled={!bankSelected.length} className="admin-btn-primary">
              Add Selected Questions
            </button>
          </>
        }
      >
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={bankFilters.subject}
            onChange={e => setBankFilters(f => ({ ...f, subject: e.target.value }))}
            className="admin-input w-40"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select
            value={bankFilters.difficulty}
            onChange={e => setBankFilters(f => ({ ...f, difficulty: e.target.value }))}
            className="admin-input w-36"
          >
            <option value="">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="difficult">Difficult</option>
          </select>
          <input
            value={bankFilters.search}
            onChange={e => setBankFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search questions..."
            className="admin-input flex-1 min-w-[200px]"
          />
          <button onClick={loadBankQuestions} className="admin-btn-primary">Search</button>
        </div>

        {bankLoading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bankQuestions.length === 0 && (
              <p className="text-center text-slate-400 py-10">No questions found in bank</p>
            )}
            {bankQuestions.map(q => (
              <label key={q._id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={bankSelected.includes(q._id)}
                  onChange={e => {
                    if (e.target.checked) setBankSelected(s => [...s, q._id]);
                    else setBankSelected(s => s.filter(x => x !== q._id));
                  }}
                  className="mt-0.5 rounded text-primary-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.questionText }} />
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400">
                    <span className="admin-badge-gray">{q.difficulty}</span>
                    {q.subject?.name && <span>• {q.subject.name}</span>}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </Modal>

      {/* 2. Direct Custom Question Modal */}
      <Modal
        isOpen={customQModal}
        onClose={() => setCustomQModal(false)}
        title="Add Custom Question to Test"
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setCustomQModal(false)} className="admin-btn-secondary">Cancel</button>
            <button
              form="custom-q-form"
              type="submit"
              disabled={isSubmittingQ}
              className="admin-btn-primary"
            >
              {isSubmittingQ ? 'Saving Question...' : 'Save Question'}
            </button>
          </>
        }
      >
        <form id="custom-q-form" onSubmit={handleSubmitQ(onSaveCustomQuestion)} className="space-y-4">
          {/* Question Text */}
          <div>
            <label className="admin-label">question text *</label>
            <textarea
              {...registerQ('questionText', { required: 'Question text is required' })}
              rows={3}
              className="admin-input resize-none"
              placeholder="Enter full question text here..."
            />
            {errorsQ.questionText && <p className="text-red-500 text-xs mt-1">{errorsQ.questionText.message}</p>}
          </div>

          {/* Section & Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="admin-label mb-0">section *</label>
                <button
                  type="button"
                  onClick={() => setIsNewSection(!isNewSection)}
                  className="text-xs text-primary-600 font-semibold"
                >
                  {isNewSection ? '← Select' : '+ Create option'}
                </button>
              </div>
              {isNewSection ? (
                <input
                  {...registerQ('newSectionName', { required: isNewSection ? 'Section name required' : false })}
                  className="admin-input"
                  placeholder="e.g. Computer"
                />
              ) : (
                <select {...registerQ('section')} className="admin-input">
                  {customSections.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                  <option value="__custom__">+ Create new section...</option>
                </select>
              )}
            </div>

            <div>
              <label className="admin-label">Mark *</label>
              <input {...registerQ('marks', { valueAsNumber: true })} type="number" step="0.5" className="admin-input" placeholder="1" />
            </div>

            <div>
              <label className="admin-label">Negative Mark *</label>
              <input {...registerQ('negativeMarks', { valueAsNumber: true })} type="number" step="0.25" className="admin-input" placeholder="0.25" />
            </div>
          </div>

          {/* A, B, C, D Options */}
          <div className="space-y-3">
            <label className="admin-label">A, B, C, D options *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Option A *</label>
                <input {...registerQ('optionA', { required: 'Option A required' })} className="admin-input" placeholder="Option A text" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Option B *</label>
                <input {...registerQ('optionB', { required: 'Option B required' })} className="admin-input" placeholder="Option B text" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Option C *</label>
                <input {...registerQ('optionC', { required: 'Option C required' })} className="admin-input" placeholder="Option C text" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Option D *</label>
                <input {...registerQ('optionD', { required: 'Option D required' })} className="admin-input" placeholder="Option D text" />
              </div>
            </div>
          </div>

          {/* Correct Option */}
          <div>
            <label className="admin-label">Correct Answer Option *</label>
            <select {...registerQ('correctAnswer')} className="admin-input font-bold">
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
              <option value="D">Option D</option>
            </select>
          </div>

          {/* Description / Explanation */}
          <div>
            <label className="admin-label">Description / Explanation</label>
            <textarea
              {...registerQ('explanation')}
              rows={2}
              className="admin-input resize-none"
              placeholder="Explanation for why this option is correct..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
