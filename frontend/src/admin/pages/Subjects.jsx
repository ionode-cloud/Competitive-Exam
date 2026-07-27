import { useState, useEffect, useCallback } from 'react';
import { RiAddLine, RiEditLine, RiDeleteBin2Line, RiCloseLine } from 'react-icons/ri';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  // Dynamic Topics list inside a subject
  const [topicsList, setTopicsList] = useState(['']);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/subjects', { params: { page, limit: 10, search } });
      setSubjects(data.data);
      setTotal(data.pagination.total);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '', price: 0, status: 'active' });
    setTopicsList(['']);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    reset({ name: s.name, description: s.description, price: s.price, status: s.status });
    setTopicsList(s.topics && s.topics.length > 0 ? [...s.topics] : ['']);
    setModalOpen(true);
  };

  // Topics list handlers
  const handleAddTopicInput = () => {
    setTopicsList(prev => [...prev, '']);
  };

  const handleTopicChange = (index, value) => {
    const updated = [...topicsList];
    updated[index] = value;
    setTopicsList(updated);
  };

  const handleRemoveTopic = (index) => {
    setTopicsList(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values) => {
    try {
      const cleanTopics = topicsList.map(t => t.trim()).filter(Boolean);
      const payload = { ...values, topics: cleanTopics };

      if (editing) await api.put(`/subjects/${editing._id}`, payload);
      else await api.post('/subjects', payload);
      
      toast.success(editing ? 'Subject updated!' : 'Subject created!');
      setModalOpen(false);
      fetchSubjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (s) => {
    const result = await Swal.fire({ title: `Delete "${s.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!result.isConfirmed) return;
    try { await api.delete(`/subjects/${s._id}`); toast.success('Deleted'); fetchSubjects(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const columns = [
    { key: 'name', label: 'Subject', render: r => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: r.color || '#6366f1' }}>
          {r.name.charAt(0)}
        </div>
        <span className="font-semibold text-slate-800 dark:text-white">{r.name}</span>
      </div>
    )},
    { key: 'topics', label: 'Topics', render: r => (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {r.topics && r.topics.length > 0 ? (
          r.topics.map((t, idx) => (
            <span key={idx} className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
              {t}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400 font-mono">No topics</span>
        )}
      </div>
    )},
    { key: 'price', label: 'Price', render: r => r.price === 0 ? <span className="admin-badge-green">Free</span> : `₹${r.price}` },
    { key: 'chapterCount', label: 'Chapters', render: r => <span className="admin-badge-blue">{r.chapterCount || 0}</span> },
    { key: 'questionCount', label: 'Questions', render: r => <span className="admin-badge-blue">{r.questionCount || 0}</span> },
    { key: 'status', label: 'Status', render: r => <span className={r.status === 'active' ? 'admin-badge-green' : 'admin-badge-red'}>{r.status}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <div className="flex items-center gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"><RiEditLine className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><RiDeleteBin2Line className="w-4 h-4" /></button>
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'Create Subject'} size="md"
        footer={<><button onClick={() => setModalOpen(false)} className="admin-btn-secondary">Cancel</button><button form="subject-form" type="submit" disabled={isSubmitting} className="admin-btn-primary">{isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}</button></>}
      >
        <form id="subject-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="admin-label">Subject Name *</label>
            <input {...register('name', { required: 'Name required' })} className="admin-input" placeholder="e.g. Mathematics, Reasoning, GK..." />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="admin-label">Description</label>
            <textarea {...register('description')} rows={2} className="admin-input resize-none" placeholder="Brief subject details..." />
          </div>

          {/* Dynamic Topics Input Section */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="admin-label text-sm font-semibold text-slate-800 dark:text-slate-200">Topics under this Subject</label>
              <button
                type="button"
                onClick={handleAddTopicInput}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                <RiAddLine className="w-3.5 h-3.5" /> Add Topic
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {topicsList.map((topic, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => handleTopicChange(index, e.target.value)}
                    placeholder={`Topic #${index + 1} (e.g. Simplification, Percentage)`}
                    className="admin-input text-sm py-1.5"
                  />
                  {topicsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(index)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Remove Topic"
                    >
                      <RiCloseLine className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
