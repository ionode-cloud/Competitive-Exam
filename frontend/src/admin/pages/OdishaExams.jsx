import { useState, useEffect, useCallback } from 'react';
import { RiAddLine, RiEditLine, RiDeleteBin2Line, RiShieldLine, RiFileTextLine } from 'react-icons/ri';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

export default function OdishaExams() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Dropdown options from backend
  const [examOptions, setExamOptions] = useState(['OSSSC', 'OPSC', 'OSSC', 'Odisha Police', 'UPSC']);
  const [mockOptions, setMockOptions] = useState(['RI_2026', 'ARI_2026', 'AMIN_2026', 'PEO_2026', 'CGL_Mock_01']);

  // Inline "Create new" toggles
  const [isCustomExam, setIsCustomExam] = useState(false);
  const [isCustomMock, setIsCustomMock] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      examinationName: '',
      customExaminationName: '',
      mockTestName: '',
      customMockTestName: '',
      price: 499,
    }
  });

  const selectedExamSelect = watch('examinationName');
  const selectedMockSelect = watch('mockTestName');

  const fetchDropdowns = useCallback(async () => {
    try {
      const res = await api.get('/odisha-exams/options');
      if (res.data?.data) {
        if (res.data.data.examinationNames?.length) setExamOptions(res.data.data.examinationNames);
        if (res.data.data.mockTestNames?.length) setMockOptions(res.data.data.mockTestNames);
      }
    } catch {}
  }, []);

  const fetchOdishaExams = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/odisha-exams', { params: { page, limit: 10, search } });
      setData(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load Odisha Exams');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchDropdowns();
    fetchOdishaExams();
  }, [fetchOdishaExams]);

  const openCreateModal = () => {
    setEditingItem(null);
    setIsCustomExam(false);
    setIsCustomMock(false);
    reset({
      examinationName: examOptions[0] || 'OSSSC',
      customExaminationName: '',
      mockTestName: mockOptions[0] || 'RI_2026',
      customMockTestName: '',
      price: 499,
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);

    const isExamInList = examOptions.includes(item.examinationName);
    setIsCustomExam(!isExamInList);

    const isMockInList = mockOptions.includes(item.mockTestName);
    setIsCustomMock(!isMockInList);

    reset({
      examinationName: isExamInList ? item.examinationName : '__custom__',
      customExaminationName: isExamInList ? '' : item.examinationName,
      mockTestName: isMockInList ? item.mockTestName : '__custom__',
      customMockTestName: isMockInList ? '' : item.mockTestName,
      price: item.price,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const finalExamName = isCustomExam ? values.customExaminationName?.trim() : values.examinationName;
      const finalMockName = isCustomMock ? values.customMockTestName?.trim() : values.mockTestName;

      if (!finalExamName) {
        toast.error('Examination Name is required');
        return;
      }
      if (!finalMockName) {
        toast.error('Mock Test Name is required');
        return;
      }

      const payload = {
        examinationName: finalExamName,
        mockTestName: finalMockName,
        price: Number(values.price) || 0,
      };

      if (editingItem) {
        await api.put(`/odisha-exams/${editingItem._id}`, payload);
        toast.success('Odisha Exam updated successfully!');
      } else {
        await api.post('/odisha-exams', payload);
        toast.success('Odisha Exam created successfully!');
      }
      setModalOpen(false);
      fetchDropdowns();
      fetchOdishaExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: `Delete "${item.examinationName} - ${item.mockTestName}"?`,
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/odisha-exams/${item._id}`);
      toast.success('Odisha Exam deleted');
      fetchOdishaExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      key: 'examinationName',
      label: 'Examination Name',
      sortable: true,
      render: r => (
        <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
            {r.examinationName?.substring(0, 2)?.toUpperCase()}
          </span>
          {r.examinationName}
        </span>
      )
    },
    {
      key: 'mockTestName',
      label: 'Mock Test Name',
      sortable: true,
      render: r => (
        <span className="font-mono text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
          {r.mockTestName}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: r => (
        r.price === 0 ? (
          <span className="admin-badge-green font-bold">Free</span>
        ) : (
          <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{r.price}</span>
        )
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEditModal(r)}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
            title="Edit"
          >
            <RiEditLine className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(r)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            title="Delete"
          >
            <RiDeleteBin2Line className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RiShieldLine className="w-6 h-6 text-primary-600" /> Odisha Exam
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage examination categories, unique mock test names, and test series prices
          </p>
        </div>
        <button onClick={openCreateModal} className="admin-btn-primary">
          <RiAddLine className="w-4 h-4" /> Add Odisha Exam
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={10}
        loading={loading}
        onPageChange={setPage}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by examination or mock test name..."
        emptyMessage="No Odisha Exam entries found. Click 'Add Odisha Exam' to create your first entry."
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Odisha Exam' : 'Create New Odisha Exam'}
        size="md"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="admin-btn-secondary">
              Cancel
            </button>
            <button
              form="odisha-form"
              type="submit"
              disabled={isSubmitting}
              className="admin-btn-primary"
            >
              {isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <form id="odisha-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Examination Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="admin-label mb-0">Examination Name *</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomExam(!isCustomExam);
                  if (!isCustomExam) setValue('examinationName', '__custom__');
                  else setValue('examinationName', examOptions[0] || 'OSSSC');
                }}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
              >
                {isCustomExam ? '← Select Existing' : '+ Create New Examination'}
              </button>
            </div>

            {isCustomExam ? (
              <input
                {...register('customExaminationName', { required: isCustomExam ? 'New Examination Name required' : false })}
                className="admin-input"
                placeholder="e.g. OSSSC, OPSC, OSSC..."
                autoFocus
              />
            ) : (
              <select
                {...register('examinationName', { required: 'Please select examination' })}
                className="admin-input"
                onChange={e => {
                  if (e.target.value === '__custom__') setIsCustomExam(true);
                }}
              >
                {examOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="__custom__">+ Create New Examination...</option>
              </select>
            )}
            {errors.examinationName && <p className="text-red-500 text-xs mt-1">{errors.examinationName.message}</p>}
            {errors.customExaminationName && <p className="text-red-500 text-xs mt-1">{errors.customExaminationName.message}</p>}
          </div>

          {/* Mock Test Name Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="admin-label mb-0">Mock Test Name (Unique Name) *</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomMock(!isCustomMock);
                  if (!isCustomMock) setValue('mockTestName', '__custom__');
                  else setValue('mockTestName', mockOptions[0] || 'RI_2026');
                }}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
              >
                {isCustomMock ? '← Select Existing' : '+ Create New Mock Test Name'}
              </button>
            </div>

            {isCustomMock ? (
              <input
                {...register('customMockTestName', { required: isCustomMock ? 'Unique Mock Test Name required' : false })}
                className="admin-input font-mono text-sm"
                placeholder="e.g. RI_2026, ARI_2026, CGL_Mock_01..."
                autoFocus
              />
            ) : (
              <select
                {...register('mockTestName', { required: 'Please select mock test name' })}
                className="admin-input font-mono text-sm"
                onChange={e => {
                  if (e.target.value === '__custom__') setIsCustomMock(true);
                }}
              >
                {mockOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="__custom__">+ Create New Mock Test Name...</option>
              </select>
            )}
            {errors.mockTestName && <p className="text-red-500 text-xs mt-1">{errors.mockTestName.message}</p>}
            {errors.customMockTestName && <p className="text-red-500 text-xs mt-1">{errors.customMockTestName.message}</p>}
          </div>

          {/* Price Field */}
          <div>
            <label className="admin-label">Price (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
              <input
                {...register('price', {
                  required: 'Price is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Price cannot be negative' }
                })}
                type="number"
                min="0"
                className="admin-input pl-8 font-semibold"
                placeholder="499"
              />
            </div>
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            <p className="text-xs text-slate-400 mt-1">Set 0 for free mock test series</p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
