// SubscriptionsManager.jsx — Admin: Subscription Plans & One-Time Packs with Category Access Selection
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import {
  RiAddLine, RiEditLine, RiDeleteBin2Line, RiCheckLine, RiCloseLine,
  RiStarLine, RiPriceTag3Line, RiFlashlightLine, RiShieldCheckLine,
  RiRefreshLine, RiStackLine, RiCalendarLine
} from 'react-icons/ri';

const COLOR_OPTIONS = [
  { name: 'Royal Blue', color: '#1957D6', bg: '#EAF1FD' },
  { name: 'Purple Pro', color: '#7C3AED', bg: '#F3ECFE' },
  { name: 'Emerald',    color: '#0F9D58', bg: '#E8F8EE' },
  { name: 'Rose Red',   color: '#B4232F', bg: '#FCEBEA' },
  { name: 'Amber Gold', color: '#D97706', bg: '#FFFBEB' },
  { name: 'Sky Blue',   color: '#0369A1', bg: '#E0F2FE' },
];

export default function SubscriptionsManager() {
  const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' | 'yearly' | 'combos' | 'banner'
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // Available Categories across the 4 tabs
  const [mockCats, setMockCats]         = useState([]);
  const [subjectCats, setSubjectCats]   = useState([]);
  const [ebookCats, setEbookCats]       = useState([]);
  const [materialCats, setMaterialCats] = useState([]);

  const [config, setConfig] = useState({
    bannerEyebrow: 'Subscription',
    bannerHeading: 'Choose Your Plan',
    bannerSubtitle: 'Invest in your preparation — unlock everything you need to crack the exam.',
    bannerStats: [
      { n: '3', label: 'Plans' },
      { n: '4', label: 'One-Time Packs' },
      { n: '40%', label: 'Yearly Savings' },
    ],
    comboSectionLabel: 'COMBO PACKS',
    comboSectionHeading: 'One-Time Packs — Pay Once, Save More',
    monthlyPlans: [],
    yearlyPlans: [],
    combos: [],
  });

  // Modal State
  const [planModal, setPlanModal]   = useState(null); // null = closed, { mode: 'monthly'|'yearly', data: null|obj, index: number }
  const [comboModal, setComboModal] = useState(null); // null = closed, { data: null|obj, index: number }

  // ── Fetch Config & Categories ─────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, examRes, subjRes, pyqRes, matRes] = await Promise.all([
        api.get('/subscription-config'),
        api.get('/exams').catch(() => ({ data: { data: [] } })),
        api.get('/subject-tests/categories/public').catch(() => ({ data: { data: [] } })),
        api.get('/pyq-categories').catch(() => ({ data: { data: [] } })),
        api.get('/material-categories/public').catch(() => ({ data: { data: [] } })),
      ]);

      if (cfgRes.data?.success && cfgRes.data?.data) {
        setConfig(cfgRes.data.data);
      }
      setMockCats(examRes.data?.data || []);
      setSubjectCats(subjRes.data?.data || []);
      setEbookCats(pyqRes.data?.data || []);
      setMaterialCats(matRes.data?.data || []);
    } catch {
      toast.error('Failed to load subscription configuration & category options');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const saveConfigToBackend = async (updatedConfig) => {
    setSaving(true);
    try {
      await api.put('/subscription-config', updatedConfig);
      setConfig(updatedConfig);
      toast.success('Subscription changes saved & published!');
    } catch {
      toast.error('Failed to save subscription plan');
    } finally {
      setSaving(false);
    }
  };

  /* ── PLAN CRUD HANDLERS ─────────────────────────────────────────────────── */
  const handleSavePlan = (planForm, mode, editIndex) => {
    const listKey = mode === 'yearly' ? 'yearlyPlans' : 'monthlyPlans';
    const list = [...(config[listKey] || [])];

    if (editIndex !== null && editIndex !== undefined) {
      list[editIndex] = planForm;
    } else {
      list.push(planForm);
    }

    const updated = { ...config, [listKey]: list };
    saveConfigToBackend(updated);
    setPlanModal(null);
  };

  const handleDeletePlan = async (mode, index) => {
    const listKey = mode === 'yearly' ? 'yearlyPlans' : 'monthlyPlans';
    const planName = config[listKey]?.[index]?.name || 'this plan';

    const result = await Swal.fire({
      title: `Delete ${planName}?`,
      text: 'This subscription plan will be removed from the user panel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;

    const list = config[listKey].filter((_, i) => i !== index);
    const updated = { ...config, [listKey]: list };
    saveConfigToBackend(updated);
  };

  /* ── COMBO (ONE-TIME PACK) CRUD HANDLERS ───────────────────────────────── */
  const handleSaveCombo = (comboForm, editIndex) => {
    const list = [...(config.combos || [])];
    if (editIndex !== null && editIndex !== undefined) {
      list[editIndex] = comboForm;
    } else {
      list.push(comboForm);
    }
    const updated = { ...config, combos: list };
    saveConfigToBackend(updated);
    setComboModal(null);
  };

  const handleDeleteCombo = async (index) => {
    const comboName = config.combos?.[index]?.name || 'this one-time pack';
    const result = await Swal.fire({
      title: `Delete ${comboName}?`,
      text: 'This one-time pack will be removed from the user panel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;

    const list = config.combos.filter((_, i) => i !== index);
    const updated = { ...config, combos: list };
    saveConfigToBackend(updated);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RiRefreshLine className="animate-spin w-8 h-8 mx-auto mb-2 text-blue-600" />
        <p className="text-sm font-semibold">Loading subscription plans &amp; category permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RiStackLine className="text-blue-600" /> Subscription Plans &amp; Category Access Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure category access permissions across Mock Tests, Subject Tests, PYQ E-Books, and Study Materials.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 flex-wrap">
        {[
          { key: 'monthly', label: '📅 Monthly Packages', count: config.monthlyPlans?.length || 0 },
          { key: 'yearly',  label: '📆 Yearly Packages',  count: config.yearlyPlans?.length || 0 },
          { key: 'combos',  label: '📦 One-Time Packs — Pay Once, Save More', count: config.combos?.length || 0 },
          { key: 'banner',  label: '🎨 Page Banner Settings' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── MONTHLY & YEARLY PACKAGES TAB ── */}
      {(activeTab === 'monthly' || activeTab === 'yearly') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {activeTab === 'monthly' ? 'Monthly Packages' : 'Yearly Packages'}
            </h3>
            <button
              onClick={() => setPlanModal({ mode: activeTab, data: null, index: null })}
              className="admin-btn-primary flex items-center gap-1.5 text-xs"
            >
              <RiAddLine className="w-4 h-4" /> Add {activeTab === 'monthly' ? 'Monthly' : 'Yearly'} Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(config[activeTab === 'yearly' ? 'yearlyPlans' : 'monthlyPlans'] || []).map((plan, idx) => (
              <div
                key={idx}
                className="admin-card p-6 relative flex flex-col justify-between border-2 transition-all hover:shadow-lg"
                style={{ borderColor: plan.color || '#1957D6' }}
              >
                {plan.badge && (
                  <span
                    className="absolute top-3 right-3 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full text-white shadow-sm"
                    style={{ backgroundColor: plan.color || '#1957D6' }}
                  >
                    {plan.badge}
                  </span>
                )}

                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1" style={{ color: plan.color }}>
                    {plan.name}
                  </h4>
                  <div className="flex items-baseline gap-1 my-3">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400 font-medium">{plan.duration || (activeTab === 'yearly' ? '/year' : '/month')}</span>
                  </div>

                  {/* Included Category Access Badges */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl mb-3 space-y-1 text-[11px]">
                    <div className="font-bold text-slate-600 dark:text-slate-300">Category Access Granted:</div>
                    <div className="text-slate-500">🎯 Mock Tests: <span className="font-semibold text-slate-700 dark:text-slate-200">{plan.allowedMockTestCats?.includes('all') ? 'All Exams' : (plan.allowedMockTestCats?.join(', ') || 'All')}</span></div>
                    <div className="text-slate-500">📚 Subject Tests: <span className="font-semibold text-slate-700 dark:text-slate-200">{plan.allowedSubjectTestCats?.includes('all') ? 'All Subjects' : (plan.allowedSubjectTestCats?.join(', ') || 'All')}</span></div>
                    <div className="text-slate-500">📖 PYQ E-Books: <span className="font-semibold text-slate-700 dark:text-slate-200">{plan.allowedEbookCats?.includes('all') ? 'All E-Books' : (plan.allowedEbookCats?.join(', ') || 'All')}</span></div>
                    <div className="text-slate-500">📄 Materials: <span className="font-semibold text-slate-700 dark:text-slate-200">{plan.allowedMaterialCats?.includes('all') ? 'All PDFs' : (plan.allowedMaterialCats?.join(', ') || 'All')}</span></div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3 my-3 space-y-2">
                    {(plan.features || []).map((f, fIdx) => (
                      <div key={fIdx} className={`flex items-center gap-2 text-xs ${f.ok ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 line-through'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${f.ok ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                          {f.ok ? '✓' : '✕'}
                        </span>
                        {f.text}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => setPlanModal({ mode: activeTab, data: plan, index: idx })}
                    className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <RiEditLine className="w-3.5 h-3.5" /> Edit &amp; Permissions
                  </button>
                  <button
                    onClick={() => handleDeletePlan(activeTab, idx)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <RiDeleteBin2Line className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ONE-TIME PACKS (COMBO PACKS) TAB ── */}
      {activeTab === 'combos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {config.comboSectionHeading || 'One-Time Packs — Pay Once, Save More'}
              </h3>
              <p className="text-xs text-slate-400">One-time purchase course bundles and test series packs</p>
            </div>
            <button
              onClick={() => setComboModal({ data: null, index: null })}
              className="admin-btn-primary flex items-center gap-1.5 text-xs"
            >
              <RiAddLine className="w-4 h-4" /> Add One-Time Pack
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {(config.combos || []).map((combo, idx) => (
              <div
                key={idx}
                className="admin-card p-5 flex flex-col justify-between border-2 transition-all hover:shadow-lg"
                style={{ borderColor: combo.color || '#1957D6', backgroundColor: combo.bg || '#EAF1FD' }}
              >
                <div>
                  <h4 className="text-base font-bold mb-2" style={{ color: combo.color }}>
                    {combo.name}
                  </h4>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-extrabold" style={{ color: combo.color }}>{combo.price}</span>
                    {combo.orig && (
                      <span className="text-xs line-through opacity-60" style={{ color: combo.color }}>{combo.orig}</span>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {(combo.items || []).map((item, iIdx) => (
                      <div key={iIdx} className="text-xs font-semibold flex items-center gap-1.5" style={{ color: combo.color, opacity: 0.85 }}>
                        <span>✓</span> {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-black/10">
                  <button
                    onClick={() => setComboModal({ data: combo, index: idx })}
                    className="flex-1 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-white font-bold text-xs hover:bg-white transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <RiEditLine className="w-3.5 h-3.5" /> Edit &amp; Permissions
                  </button>
                  <button
                    onClick={() => handleDeleteCombo(idx)}
                    className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    <RiDeleteBin2Line className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BANNER SETTINGS TAB ── */}
      {activeTab === 'banner' && (
        <div className="admin-card p-6 space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Page Banner Settings</h3>
          <div>
            <label className="admin-label">Eyebrow Label</label>
            <input
              type="text" value={config.bannerEyebrow}
              onChange={e => setConfig(c => ({ ...c, bannerEyebrow: e.target.value }))}
              className="admin-input" placeholder="Subscription"
            />
          </div>
          <div>
            <label className="admin-label">Main Heading</label>
            <input
              type="text" value={config.bannerHeading}
              onChange={e => setConfig(c => ({ ...c, bannerHeading: e.target.value }))}
              className="admin-input" placeholder="Choose Your Plan"
            />
          </div>
          <div>
            <label className="admin-label">Subtitle</label>
            <textarea
              value={config.bannerSubtitle}
              onChange={e => setConfig(c => ({ ...c, bannerSubtitle: e.target.value }))}
              className="admin-input resize-none" rows={2}
            />
          </div>
          <div>
            <label className="admin-label">One-Time Pack Section Title</label>
            <input
              type="text" value={config.comboSectionHeading}
              onChange={e => setConfig(c => ({ ...c, comboSectionHeading: e.target.value }))}
              className="admin-input" placeholder="One-Time Packs — Pay Once, Save More"
            />
          </div>
          <button
            onClick={() => saveConfigToBackend(config)}
            disabled={saving}
            className="admin-btn-primary py-2.5 px-6"
          >
            {saving ? 'Saving...' : 'Save Banner Settings'}
          </button>
        </div>
      )}

      {/* ── PLAN MODAL (CREATE / EDIT) ── */}
      {planModal && (
        <PlanEditModal
          mode={planModal.mode}
          plan={planModal.data}
          mockCats={mockCats}
          subjectCats={subjectCats}
          ebookCats={ebookCats}
          materialCats={materialCats}
          onClose={() => setPlanModal(null)}
          onSave={(form) => handleSavePlan(form, planModal.mode, planModal.index)}
        />
      )}

      {/* ── COMBO MODAL (CREATE / EDIT) ── */}
      {comboModal && (
        <ComboEditModal
          combo={comboModal.data}
          mockCats={mockCats}
          subjectCats={subjectCats}
          ebookCats={ebookCats}
          materialCats={materialCats}
          onClose={() => setComboModal(null)}
          onSave={(form) => handleSaveCombo(form, comboModal.index)}
        />
      )}
    </div>
  );
}

/* ── Plan Edit Modal Subcomponent ─────────────────────────────────────────── */
function PlanEditModal({ mode, plan, mockCats, subjectCats, ebookCats, materialCats, onClose, onSave }) {
  const isEdit = Boolean(plan);
  const [form, setForm] = useState({
    name:      plan?.name || (mode === 'yearly' ? 'Starter Yearly' : 'Starter Monthly'),
    price:     plan?.price || (mode === 'yearly' ? '₹3,999' : '₹499'),
    duration:  plan?.duration || (mode === 'yearly' ? '/year' : '/month'),
    badge:     plan?.badge || '',
    color:     plan?.color || '#1957D6',
    bg:        plan?.bg || '#EAF1FD',
    highlight: plan?.highlight || false,
    allowedMockTestCats:    plan?.allowedMockTestCats || ['all'],
    allowedSubjectTestCats: plan?.allowedSubjectTestCats || ['all'],
    allowedEbookCats:       plan?.allowedEbookCats || ['all'],
    allowedMaterialCats:    plan?.allowedMaterialCats || ['all'],
    features:  plan?.features ? [...plan.features] : [
      { ok: true, text: 'Full-Length Mock Tests' },
      { ok: true, text: 'Subject-Wise Practice Tests' },
      { ok: true, text: 'PYQ E-Books Access' },
      { ok: true, text: 'Study Materials & PDFs' },
    ],
  });

  const addFeature = () => {
    setForm(f => ({ ...f, features: [...f.features, { ok: true, text: '' }] }));
  };

  const updateFeature = (idx, field, val) => {
    const copy = [...form.features];
    copy[idx] = { ...copy[idx], [field]: val };
    setForm(f => ({ ...f, features: copy }));
  };

  const removeFeature = (idx) => {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Plan name is required'); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Subscription Plan & Category Access' : `Add New ${mode === 'yearly' ? 'Yearly' : 'Monthly'} Plan`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Plan Name *</label>
            <input
              type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="admin-input" placeholder="e.g. Pro Monthly / Starter Yearly" required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Price (e.g. ₹499 or ₹3,999) *</label>
              <input
                type="text" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="admin-input" required
              />
            </div>
            <div>
              <label className="admin-label">Duration Label</label>
              <input
                type="text" value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className="admin-input" placeholder="/month or /year"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Badge Label (Optional)</label>
              <input
                type="text" value={form.badge}
                onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                className="admin-input" placeholder="e.g. Most Popular / Best Value"
              />
            </div>
            <div>
              <label className="admin-label">Color Theme</label>
              <select
                value={form.color}
                onChange={e => {
                  const opt = COLOR_OPTIONS.find(o => o.color === e.target.value);
                  setForm(f => ({ ...f, color: e.target.value, bg: opt ? opt.bg : f.bg }));
                }}
                className="admin-input"
              >
                {COLOR_OPTIONS.map(c => (
                  <option key={c.color} value={c.color}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── CATEGORY ACCESS CHECKBOXES ── */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl space-y-3 border border-slate-200 dark:border-slate-600">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Category Access Permissions (Which Tabs/Categories are unlocked by this plan)
            </h4>

            {/* 1. Mock Test Categories Checkboxes */}
            <CategoryCheckboxGroup
              label="🎯 Mock Test Tab Categories Allowed"
              categories={mockCats}
              selected={form.allowedMockTestCats}
              onChange={val => setForm(f => ({ ...f, allowedMockTestCats: val }))}
              getCategoryName={c => c.name}
            />

            {/* 2. Subject Test Categories Checkboxes */}
            <CategoryCheckboxGroup
              label="📚 Subject Test Tab Categories Allowed"
              categories={subjectCats}
              selected={form.allowedSubjectTestCats}
              onChange={val => setForm(f => ({ ...f, allowedSubjectTestCats: val }))}
              getCategoryName={c => c.name}
            />

            {/* 3. PYQ E-Book Categories Checkboxes */}
            <CategoryCheckboxGroup
              label="📖 PYQ E-Book Tab Categories Allowed"
              categories={ebookCats}
              selected={form.allowedEbookCats}
              onChange={val => setForm(f => ({ ...f, allowedEbookCats: val }))}
              getCategoryName={c => c.title || c.name}
            />

            {/* 4. Material Categories Checkboxes */}
            <CategoryCheckboxGroup
              label="📄 Study Material Tab Categories Allowed"
              categories={materialCats}
              selected={form.allowedMaterialCats}
              onChange={val => setForm(f => ({ ...f, allowedMaterialCats: val }))}
              getCategoryName={c => c.name}
            />
          </div>

          {/* Features List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="admin-label mb-0">Feature Checklist</label>
              <button type="button" onClick={addFeature} className="text-xs font-bold text-blue-600 hover:underline">
                + Add Feature
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {form.features.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox" checked={f.ok}
                    onChange={e => updateFeature(idx, 'ok', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600"
                    title="Check if included"
                  />
                  <input
                    type="text" value={f.text}
                    onChange={e => updateFeature(idx, 'text', e.target.value)}
                    className="admin-input py-1 text-xs flex-1" placeholder="Feature description..."
                  />
                  <button type="button" onClick={() => removeFeature(idx)} className="text-red-500 hover:text-red-700 text-sm">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-slate-600">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
              Save Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Combo Edit Modal Subcomponent ───────────────────────────────────────── */
function ComboEditModal({ combo, mockCats, subjectCats, ebookCats, materialCats, onClose, onSave }) {
  const isEdit = Boolean(combo);
  const [form, setForm] = useState({
    name:  combo?.name || 'PDF Course Bundle',
    price: combo?.price || '₹3,999',
    orig:  combo?.orig || '₹7,999',
    icon:  combo?.icon || 'file',
    color: combo?.color || '#1957D6',
    bg:    combo?.bg || '#EAF1FD',
    allowedMockTestCats:    combo?.allowedMockTestCats || ['all'],
    allowedSubjectTestCats: combo?.allowedSubjectTestCats || ['all'],
    allowedEbookCats:       combo?.allowedEbookCats || ['all'],
    allowedMaterialCats:    combo?.allowedMaterialCats || ['all'],
    items: combo?.items ? [...combo.items] : ['All Subject PDFs', 'PYQ E-Books', 'Free Updates 1 Year'],
  });

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, ''] }));
  };

  const updateItem = (idx, val) => {
    const copy = [...form.items];
    copy[idx] = val;
    setForm(f => ({ ...f, items: copy }));
  };

  const removeItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Pack name is required'); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Edit One-Time Pack & Category Permissions' : 'Add New One-Time Pack'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Pack Name *</label>
            <input
              type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="admin-input" placeholder="e.g. PDF Course Bundle / Test Series Pack" required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Offer Price (e.g. ₹3,999) *</label>
              <input
                type="text" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="admin-input" required
              />
            </div>
            <div>
              <label className="admin-label">Original Price (e.g. ₹7,999)</label>
              <input
                type="text" value={form.orig}
                onChange={e => setForm(f => ({ ...f, orig: e.target.value }))}
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="admin-label">Color Theme</label>
            <select
              value={form.color}
              onChange={e => {
                const opt = COLOR_OPTIONS.find(o => o.color === e.target.value);
                setForm(f => ({ ...f, color: e.target.value, bg: opt ? opt.bg : f.bg }));
              }}
              className="admin-input"
            >
              {COLOR_OPTIONS.map(c => (
                <option key={c.color} value={c.color}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* ── CATEGORY ACCESS CHECKBOXES ── */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl space-y-3 border border-slate-200 dark:border-slate-600">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Category Access Permissions (Which Tabs/Categories are unlocked by this pack)
            </h4>

            {/* 1. Mock Test Categories Checkboxes */}
            <CategoryCheckboxGroup
              label="🎯 Mock Test Tab Categories Allowed"
              categories={mockCats}
              selected={form.allowedMockTestCats}
              onChange={val => setForm(f => ({ ...f, allowedMockTestCats: val }))}
              getCategoryName={c => c.name}
            />

            {/* 2. Subject Test Categories Checkboxes */}
            <CategoryCheckboxGroup
              label="📚 Subject Test Tab Categories Allowed"
              categories={subjectCats}
              selected={form.allowedSubjectTestCats}
              onChange={val => setForm(f => ({ ...f, allowedSubjectTestCats: val }))}
              getCategoryName={c => c.name}
            />

            {/* 3. PYQ E-Book Categories Checkboxes */}
            <CategoryCheckboxGroup
              label="📖 PYQ E-Book Tab Categories Allowed"
              categories={ebookCats}
              selected={form.allowedEbookCats}
              onChange={val => setForm(f => ({ ...f, allowedEbookCats: val }))}
              getCategoryName={c => c.title || c.name}
            />

            {/* 4. Material Categories Checkboxes */}
            <CategoryCheckboxGroup
              label="📄 Study Material Tab Categories Allowed"
              categories={materialCats}
              selected={form.allowedMaterialCats}
              onChange={val => setForm(f => ({ ...f, allowedMaterialCats: val }))}
              getCategoryName={c => c.name}
            />
          </div>

          {/* Included Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="admin-label mb-0">Included Features / Items</label>
              <button type="button" onClick={addItem} className="text-xs font-bold text-blue-600 hover:underline">
                + Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text" value={item}
                    onChange={e => updateItem(idx, e.target.value)}
                    className="admin-input py-1 text-xs flex-1" placeholder="Included feature description..."
                  />
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 text-sm">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-slate-600">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">
              Save One-Time Pack
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Category Checkbox Group Helper Subcomponent ── */
function CategoryCheckboxGroup({ label, categories, selected, onChange, getCategoryName }) {
  const isAll = !selected || selected.length === 0 || selected.includes('all');

  const handleToggleAll = (e) => {
    if (e.target.checked) {
      onChange(['all']);
    } else {
      onChange([]);
    }
  };

  const handleToggleCategory = (catName) => {
    let current = isAll ? categories.map(getCategoryName) : [...(selected || [])];
    if (current.includes(catName)) {
      current = current.filter(c => c !== catName);
    } else {
      current.push(catName);
    }

    if (current.length === 0) {
      onChange([]);
    } else if (current.length >= categories.length) {
      onChange(['all']);
    } else {
      onChange(current);
    }
  };

  return (
    <div className="space-y-1.5 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <label className="admin-label text-xs font-bold mb-0 text-slate-800 dark:text-slate-200">
          {label}
        </label>
        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
          {isAll ? '✅ All Categories Unlocked' : `${(selected || []).length} of ${categories.length} Selected`}
        </span>
      </div>

      <div className="pt-1.5 space-y-2">
        {/* Toggle All */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700">
          <input
            type="checkbox"
            checked={isAll}
            onChange={handleToggleAll}
            className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
          />
          <span>Unlock All Categories in this Tab</span>
        </label>

        {/* Category Checkboxes Grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700 max-h-36 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const name = getCategoryName(cat);
            const isChecked = isAll || (selected || []).includes(name);
            return (
              <label
                key={cat._id || name}
                className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-blue-50/70 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleCategory(name)}
                  className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span className="truncate">{name}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
