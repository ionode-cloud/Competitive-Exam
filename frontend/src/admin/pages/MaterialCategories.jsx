import { useState, useEffect, useCallback } from 'react';
import {
  RiAddLine, RiEditLine, RiDeleteBin2Line,
  RiCheckLine, RiCloseLine, RiPaletteLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';

const COLOR_PRESETS = [
  { color: '#B4232F', bg: '#FCEBEA', label: 'Red'     },
  { color: '#7C3AED', bg: '#F3ECFE', label: 'Violet'  },
  { color: '#1957D6', bg: '#EAF1FD', label: 'Blue'    },
  { color: '#0F9D58', bg: '#E8F8EE', label: 'Green'   },
  { color: '#0891B2', bg: '#E0F7FA', label: 'Cyan'    },
  { color: '#EA7A1E', bg: '#FEF1E4', label: 'Orange'  },
  { color: '#C2740A', bg: '#FEF3E2', label: 'Amber'   },
  { color: '#475569', bg: '#F1F5F9', label: 'Slate'   },
  { color: '#BE185D', bg: '#FCE7F3', label: 'Pink'    },
  { color: '#065F46', bg: '#D1FAE5', label: 'Emerald' },
];

export default function MaterialCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  /* create form */
  const [newName, setNewName]   = useState('');
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0].color);
  const [newBg, setNewBg]       = useState(COLOR_PRESETS[0].bg);

  /* inline edit */
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName]   = useState('');
  const [editColor, setEditColor] = useState('');
  const [editBg, setEditBg]       = useState('');

  /* ── fetch ─────────────────────────────────────────────── */
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/material-categories');
      setCategories(data.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* ── create ─────────────────────────────────────────────── */
  const handleCreate = async () => {
    if (!newName.trim()) return toast.error('Category name is required');
    setSaving(true);
    try {
      await api.post('/material-categories', { name: newName.trim(), color: newColor, bg: newBg });
      toast.success('Category created!');
      setNewName('');
      setNewColor(COLOR_PRESETS[0].color);
      setNewBg(COLOR_PRESETS[0].bg);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  /* ── edit helpers ──────────────────────────────────────── */
  const startEdit  = (cat) => { setEditingId(cat._id); setEditName(cat.name); setEditColor(cat.color); setEditBg(cat.bg); };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (cat) => {
    if (!editName.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      await api.put(`/material-categories/${cat._id}`, { name: editName.trim(), color: editColor, bg: editBg });
      toast.success('Category updated!');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ─────────────────────────────────────────────── */
  const handleDelete = async (cat) => {
    const result = await Swal.fire({
      title: `Delete "${cat.name}"?`,
      text: 'Materials using this category will still exist.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/material-categories/${cat._id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  /* ── ColorPicker sub-component ─────────────────────────── */
  const ColorPicker = ({ selected, onSelect }) => (
    <div className="flex flex-wrap gap-2.5 mt-2">
      {COLOR_PRESETS.map(p => (
        <button
          key={p.color}
          type="button"
          title={p.label}
          onClick={() => onSelect(p)}
          className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
          style={{
            background:   p.color,
            borderColor:  selected === p.color ? '#1e293b' : 'transparent',
            transform:    selected === p.color ? 'scale(1.3)' : 'scale(1)',
            boxShadow:    selected === p.color ? `0 0 0 2px white, 0 0 0 4px ${p.color}` : 'none',
          }}
        >
          {selected === p.color && <RiCheckLine className="w-4 h-4 text-white" />}
        </button>
      ))}
    </div>
  );

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Material Categories</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create and manage categories used to organise study materials.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          Two-column side-by-side layout
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ═══════════════ LEFT — Add Category ════════════════ */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm lg:sticky lg:top-6">

          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
            <RiAddLine className="w-4 h-4 text-primary-500" /> Add New Category
          </h3>

          {/* Name input */}
          <div className="mb-4">
            <label className="admin-label">Category Name *</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Current Affairs, Odisha GK…"
              className="admin-input"
            />
          </div>

          {/* Color picker */}
          <div className="mb-5">
            <label className="admin-label flex items-center gap-1.5">
              <RiPaletteLine className="w-3.5 h-3.5" /> Badge Color
            </label>
            <ColorPicker
              selected={newColor}
              onSelect={p => { setNewColor(p.color); setNewBg(p.bg); }}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-slate-700 my-5" />

          {/* Preview */}
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-2 font-medium">Badge Preview</p>
            <span
              className="text-sm font-bold px-4 py-1.5 rounded-full"
              style={{ background: newBg, color: newColor }}
            >
              {newName || 'Category Name'}
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
            className="admin-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RiAddLine className="w-4 h-4" />
            {saving ? 'Adding…' : 'Add Category'}
          </button>
        </div>

        {/* ═══════════════ RIGHT — Category List ══════════════ */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              All Categories
            </h3>
            <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {categories.length} total
            </span>
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
          )}

          {/* Empty state */}
          {!loading && categories.length === 0 && (
            <div className="p-10 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <RiAddLine className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No categories yet</p>
              <p className="text-slate-400 text-xs mt-1">Add your first category using the form on the left.</p>
            </div>
          )}

          {/* List */}
          {!loading && categories.length > 0 && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[calc(100vh-240px)] overflow-y-auto">
              {categories.map((cat, idx) => (
                <li key={cat._id} className="px-5 py-4">
                  {editingId === cat._id ? (
                    /* ─── Inline edit form ─── */
                    <div className="space-y-3">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="admin-input"
                        autoFocus
                        placeholder="Category name"
                      />
                      <ColorPicker
                        selected={editColor}
                        onSelect={p => { setEditColor(p.color); setEditBg(p.bg); }}
                      />
                      {/* Preview */}
                      <span className="text-xs font-bold px-3 py-1 rounded-full inline-block mt-1" style={{ background: editBg, color: editColor }}>
                        {editName || 'Preview'}
                      </span>
                      {/* Save / Cancel */}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => saveEdit(cat)} disabled={saving} className="admin-btn-primary text-sm px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
                          <RiCheckLine className="w-4 h-4" /> Save
                        </button>
                        <button onClick={cancelEdit} className="admin-btn-secondary text-sm px-4 py-1.5 flex items-center gap-1.5">
                          <RiCloseLine className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ─── Display row ─── */
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-4 text-right flex-shrink-0">{idx + 1}</span>

                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.bg }}>
                        <div className="w-3.5 h-3.5 rounded-full" style={{ background: cat.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight">{cat.name}</p>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: cat.bg, color: cat.color }}>
                          {cat.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={() => startEdit(cat)} className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Edit">
                          <RiEditLine className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cat)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Delete">
                          <RiDeleteBin2Line className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>{/* end grid */}
    </div>
  );
}
