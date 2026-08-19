import { useState, useEffect, useCallback } from 'react';
import { RiAddLine, RiEditLine, RiDeleteBin2Line, RiCloseLine, RiFolder3Line, RiGitCommitLine } from 'react-icons/ri';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { getSocket } from '../../utils/socket';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // Dynamic Topics and Sub-topics list: [{ name: '', subTopics: [''] }]
  const [topicsList, setTopicsList] = useState([{ name: '', subTopics: [''] }]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/subjects', { params: { page, limit: 10, search } });
      setSubjects(data.data || []);
      setTotal(data.pagination?.total || (data.data?.length || 0));
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => {
    fetchSubjects();
    const socket = getSocket();
    const handleUpdate = () => fetchSubjects();
    socket.on('subjects_updated', handleUpdate);
    return () => socket.off('subjects_updated', handleUpdate);
  }, [fetchSubjects]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '' });
    setTopicsList([{ name: '', subTopics: [''] }]);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    reset({ name: s.name, description: s.description || '' });

    // Extract existing topics and their sub-topics
    if (Array.isArray(s.topicList) && s.topicList.length > 0) {
      setTopicsList(s.topicList.map(t => ({
        name: t.name || '',
        subTopics: Array.isArray(t.subTopics) && t.subTopics.length > 0 ? [...t.subTopics] : ['']
      })));
    } else if (Array.isArray(s.topics) && s.topics.length > 0) {
      setTopicsList(s.topics.map(t => ({
        name: typeof t === 'string' ? t : t.name || '',
        subTopics: Array.isArray(t.subTopics) && t.subTopics.length > 0 ? [...t.subTopics] : ['']
      })));
    } else {
      setTopicsList([{ name: '', subTopics: [''] }]);
    }

    setModalOpen(true);
  };

  // --- TOPICS & SUB-TOPICS HANDLERS ---

  const handleAddTopic = () => {
    setTopicsList(prev => [...prev, { name: '', subTopics: [''] }]);
  };

  const handleRemoveTopic = (tIndex) => {
    setTopicsList(prev => prev.filter((_, i) => i !== tIndex));
  };

  const handleTopicNameChange = (tIndex, value) => {
    setTopicsList(prev => {
      const updated = [...prev];
      updated[tIndex] = { ...updated[tIndex], name: value };
      return updated;
    });
  };

  const handleAddSubTopic = (tIndex) => {
    setTopicsList(prev => {
      const updated = [...prev];
      const currentSubs = Array.isArray(updated[tIndex].subTopics) ? [...updated[tIndex].subTopics] : [];
      updated[tIndex] = { ...updated[tIndex], subTopics: [...currentSubs, ''] };
      return updated;
    });
  };

  const handleSubTopicChange = (tIndex, stIndex, value) => {
    setTopicsList(prev => {
      const updated = [...prev];
      const currentSubs = [...(updated[tIndex].subTopics || [])];
      currentSubs[stIndex] = value;
      updated[tIndex] = { ...updated[tIndex], subTopics: currentSubs };
      return updated;
    });
  };

  const handleRemoveSubTopic = (tIndex, stIndex) => {
    setTopicsList(prev => {
      const updated = [...prev];
      const currentSubs = (updated[tIndex].subTopics || []).filter((_, i) => i !== stIndex);
      updated[tIndex] = { ...updated[tIndex], subTopics: currentSubs.length > 0 ? currentSubs : [''] };
      return updated;
    });
  };

  const onSubmit = async (values) => {
    try {
      // Clean and sanitize topics and nested sub-topics
      const cleanTopicList = topicsList
        .map(t => ({
          name: (t.name || '').trim(),
          subTopics: (t.subTopics || []).map(st => (st || '').trim()).filter(Boolean)
        }))
        .filter(t => t.name.length > 0);

      const cleanTopics = cleanTopicList.map(t => t.name);

      const payload = {
        name: values.name?.trim(),
        description: values.description?.trim(),
        topicList: cleanTopicList,
        topics: cleanTopics,
      };

      if (editing) await api.put(`/subjects/${editing._id}`, payload);
      else await api.post('/subjects', payload);
      
      toast.success(editing ? 'Subject updated successfully!' : 'Subject created successfully!');
      setModalOpen(false);
      fetchSubjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (s) => {
    const result = await Swal.fire({
      title: `Delete "${s.name}"?`,
      text: 'This will also delete associated tests and chapters.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    });
    if (!result.isConfirmed) return;
    try { await api.delete(`/subjects/${s._id}`); toast.success('Subject deleted'); fetchSubjects(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const columns = [
    { key: 'name', label: 'Subject', render: r => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: r.color || '#6366f1' }}>
          {r.name.charAt(0)}
        </div>
        <div>
          <span className="font-semibold text-slate-800 dark:text-white block">{r.name}</span>
          {r.description && <span className="text-xs text-slate-400 max-w-xs truncate block">{r.description}</span>}
        </div>
      </div>
    )},
    { key: 'topics', label: 'Topics & Sub-Topics', render: r => {
      const items = (Array.isArray(r.topicList) && r.topicList.length > 0)
        ? r.topicList
        : (r.topics || []).map(t => typeof t === 'string' ? { name: t, subTopics: [] } : t);

      if (!items || items.length === 0) {
        return <span className="text-xs text-slate-400 italic">No topics</span>;
      }

      return (
        <div className="space-y-1.5 max-w-md py-1">
          {items.map((top, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-1 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                <RiFolder3Line className="w-3 h-3 text-blue-500" />
                {top.name}
              </span>
              {Array.isArray(top.subTopics) && top.subTopics.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center ml-0.5">
                  <span className="text-slate-400 text-[10px]">›</span>
                  {top.subTopics.map((st, sIdx) => (
                    <span key={sIdx} className="px-1.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                      {st}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }},
    { key: 'questionCount', label: 'Questions', render: r => <span className="admin-badge-blue">{r.questionCount || 0}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(r)} title="Edit Subject" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"><RiEditLine className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(r)} title="Delete Subject" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><RiDeleteBin2Line className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subjects</h2>
      <DataTable columns={columns} data={subjects} total={total} page={page} limit={10} loading={loading} onPageChange={setPage}
        search={search} onSearch={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search subjects..."
        emptyMessage="No subjects. Create your first subject."
        actions={<button onClick={openCreate} className="admin-btn-primary"><RiAddLine className="w-4 h-4" /> Add Subject</button>}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Subject' : 'Create Subject'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="admin-btn-secondary">Cancel</button>
            <button form="subject-form" type="submit" disabled={isSubmitting} className="admin-btn-primary">
              {isSubmitting ? 'Saving...' : editing ? 'Update Subject' : 'Create Subject'}
            </button>
          </>
        }
      >
        <form id="subject-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="admin-label">Subject Name *</label>
            <input
              {...register('name', { required: 'Subject name is required' })}
              className="admin-input"
              placeholder="e.g. Mathematics, Reasoning, Odia, GK..."
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="admin-label">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="admin-input resize-none"
              placeholder="Brief subject details or syllabus overview..."
            />
          </div>

          {/* Dynamic Topics & Sub-Topics Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <label className="admin-label text-sm font-semibold text-slate-800 dark:text-slate-200 block mb-0">
                  Topics &amp; Sub-Topics
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Add topics under this subject and multiple sub-topics inside each topic.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTopic}
                className="admin-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <RiAddLine className="w-3.5 h-3.5" /> Add Topic
              </button>
            </div>
            
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {topicsList.map((topicItem, tIdx) => (
                <div
                  key={tIdx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
                >
                  {/* Topic Name & Remove Topic Button */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                      #{tIdx + 1}
                    </div>
                    <input
                      type="text"
                      value={topicItem.name || ''}
                      onChange={(e) => handleTopicNameChange(tIdx, e.target.value)}
                      placeholder={`Topic Name (e.g. Simplification, Percentage, Grammar)`}
                      className="admin-input text-sm font-semibold py-1.5 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSubTopic(tIdx)}
                      title="Add Sub-topic"
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 transition-colors flex items-center gap-1 shrink-0"
                    >
                      <RiAddLine className="w-3.5 h-3.5" /> Sub-topic
                    </button>
                    {topicsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(tIdx)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                        title="Delete Topic"
                      >
                        <RiDeleteBin2Line className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sub-Topics List */}
                  <div className="pl-8 space-y-2 border-l-2 border-slate-200 dark:border-slate-700 ml-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Sub-Topics inside "{topicItem.name || `Topic #${tIdx + 1}`}"
                      </span>
                    </div>

                    {(topicItem.subTopics || ['']).map((subTopic, stIdx) => (
                      <div key={stIdx} className="flex items-center gap-2">
                        <RiGitCommitLine className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={subTopic || ''}
                          onChange={(e) => handleSubTopicChange(tIdx, stIdx, e.target.value)}
                          placeholder={`Sub-Topic #${stIdx + 1} (e.g. Basic Rules, Advanced Practice)`}
                          className="admin-input text-xs py-1.5 flex-1 bg-white dark:bg-slate-900"
                        />
                        {(topicItem.subTopics?.length > 1 || subTopic.trim()) && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubTopic(tIdx, stIdx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors shrink-0"
                            title="Remove Sub-topic"
                          >
                            <RiCloseLine className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

