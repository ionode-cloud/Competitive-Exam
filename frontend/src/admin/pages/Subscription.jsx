// Subscription.jsx — Admin panel: Monthly / Yearly / COMBO PACKS tabs
import { useState, useEffect, useCallback } from 'react';
import {
  RiAddLine, RiEditLine, RiDeleteBin2Line, RiCheckLine, RiCloseLine,
  RiArrowUpLine, RiArrowDownLine, RiFileTextLine, RiClipboardLine,
  RiVideoLine, RiTrophyLine, RiStarLine, RiMoneyDollarCircleLine,
  RiCalendarLine, RiCalendar2Line, RiGiftLine,
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';

/* ── Icon options for combo packs ──────────────────────────────────────────── */
const ICON_OPTIONS = [
  { id: 'file',      label: 'Document / PDF',   icon: <RiFileTextLine className="w-4 h-4 text-blue-500" /> },
  { id: 'clipboard', label: 'Test / Clipboard',  icon: <RiClipboardLine className="w-4 h-4 text-green-500" /> },
  { id: 'video',     label: 'Video / Live',      icon: <RiVideoLine className="w-4 h-4 text-purple-500" /> },
  { id: 'trophy',    label: 'Trophy / All-in',   icon: <RiTrophyLine className="w-4 h-4 text-red-500" /> },
  { id: 'star',      label: 'Star / Featured',   icon: <RiStarLine className="w-4 h-4 text-amber-500" /> },
  { id: 'money',     label: 'Money / Offer',     icon: <RiMoneyDollarCircleLine className="w-4 h-4 text-emerald-500" /> },
];

/* ── Color presets ──────────────────────────────────────────────────────────── */
const COLOR_PRESETS = [
  { color: '#1957D6', bg: '#EAF1FD', label: 'Blue' },
  { color: '#7C3AED', bg: '#F3ECFE', label: 'Purple' },
  { color: '#B4232F', bg: '#FCEBEA', label: 'Red' },
  { color: '#0F9D58', bg: '#E8F8EE', label: 'Green' },
  { color: '#D97706', bg: '#FFFBEB', label: 'Amber' },
  { color: '#0369A1', bg: '#E0F2FE', label: 'Sky' },
];

/* ── Empty templates ────────────────────────────────────────────────────────── */
const emptyPlan = (duration = '/month') => ({
  name: '', price: '₹999', duration,
  color: '#1957D6', bg: '#EAF1FD',
  highlight: false, badge: '',
  features: [{ ok: true, text: '' }],
  upiId: '', qrCode: '',
});

const emptyCombo = () => ({
  name: '', price: '₹999', orig: '₹1,999',
  icon: 'file', color: '#1957D6', bg: '#EAF1FD',
  items: [''], upiId: '', qrCode: '',
});

/* ── Field component ────────────────────────────────────────────────────────── */
function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  );
}

/* ── Modal wrapper ──────────────────────────────────────────────────────────── */
function ModalWrap({ open, onClose, title, children, onSave }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--card)', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: '28px 28px 20px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20 }}><RiCloseLine /></button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line,#e2e8f0)' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: 'transparent', color: 'var(--muted)' }}>Cancel</button>
          <button onClick={onSave}  style={{ padding: '8px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13, background: '#2563eb', color: '#fff' }}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ── Reusable Plan List Panel ───────────────────────────────────────────────── */
function PlanPanel({ plans, onSave, saving, addLabel, defaultDuration }) {
  const cardStyle = { background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 };

  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [draft, setDraft]       = useState(emptyPlan(defaultDuration));

  const openAdd  = () => { setEditing(null); setDraft(emptyPlan(defaultDuration)); setModal(true); };
  const openEdit = (p, i) => { setEditing(i); setDraft({ ...p, features: p.features?.map(f => ({ ...f })) || [] }); setModal(true); };

  const save = async () => {
    if (!draft.name.trim()) return toast.error('Plan name is required');
    const updated = editing !== null ? plans.map((p, i) => i === editing ? { ...draft } : p) : [...plans, { ...draft }];
    setModal(false);
    await onSave(updated);
  };

  const del = async (idx) => {
    const r = await Swal.fire({ title: 'Delete Plan?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!r.isConfirmed) return;
    await onSave(plans.filter((_, i) => i !== idx));
  };

  const move = async (idx, dir) => {
    const arr = [...plans];
    const si = dir === 'up' ? idx - 1 : idx + 1;
    if (si < 0 || si >= arr.length) return;
    [arr[idx], arr[si]] = [arr[si], arr[idx]];
    await onSave(arr);
  };

  const addFeature = () => setDraft(d => ({ ...d, features: [...d.features, { ok: true, text: '' }] }));
  const remFeature = i  => setDraft(d => ({ ...d, features: d.features.filter((_, j) => j !== i) }));
  const setFeat    = (i, k, v) => setDraft(d => ({ ...d, features: d.features.map((f, j) => j === i ? { ...f, [k]: v } : f) }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{addLabel} Plans</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>{plans.length} plan{plans.length !== 1 ? 's' : ''} · drag or use arrows to reorder</p>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          <RiAddLine className="w-4 h-4" /> Add Plan
        </button>
      </div>

      {plans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', border: '2px dashed var(--line,#e2e8f0)', borderRadius: 12 }}>
          No plans yet — click <strong>Add Plan</strong> to create one.
        </div>
      )}

      {plans.map((plan, idx) => (
        <div key={idx} style={{ ...cardStyle, borderLeft: `4px solid ${plan.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: plan.bg, border: `2px solid ${plan.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: plan.color }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{plan.name}</span>
                  {plan.highlight && <span style={{ fontSize: 10, background: plan.color, color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Featured</span>}
                  {plan.badge && <span style={{ fontSize: 10, background: plan.bg, color: plan.color, border: `1px solid ${plan.color}44`, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{plan.badge}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {plan.price}{plan.duration} · {plan.features?.length || 0} features
                  {plan.upiId && <span style={{ marginLeft: 8, color: '#0F9D58', fontWeight: 600 }}>· UPI ✓</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => move(idx, 'up')} disabled={idx === 0} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line,#e2e8f0)', cursor: 'pointer', background: 'transparent', opacity: idx === 0 ? 0.4 : 1 }}><RiArrowUpLine /></button>
              <button onClick={() => move(idx, 'down')} disabled={idx === plans.length - 1} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line,#e2e8f0)', cursor: 'pointer', background: 'transparent', opacity: idx === plans.length - 1 ? 0.4 : 1 }}><RiArrowDownLine /></button>
              <button onClick={() => openEdit(plan, idx)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line,#e2e8f0)', cursor: 'pointer', background: 'transparent', color: '#2563eb' }}><RiEditLine /></button>
              <button onClick={() => del(idx)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line,#e2e8f0)', cursor: 'pointer', background: 'transparent', color: '#ef4444' }}><RiDeleteBin2Line /></button>
            </div>
          </div>

          {/* Feature preview pills */}
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(plan.features || []).slice(0, 5).map((f, j) => (
              <span key={j} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: f.ok ? plan.bg : '#f1f5f9', color: f.ok ? plan.color : 'var(--muted)', border: `1px solid ${f.ok ? plan.color + '33' : 'transparent'}` }}>
                {f.ok ? '✓' : '✗'} {f.text}
              </span>
            ))}
            {(plan.features || []).length > 5 && <span style={{ fontSize: 11, color: 'var(--muted)' }}>+{plan.features.length - 5} more</span>}
          </div>
        </div>
      ))}

      {/* Plan Modal */}
      <ModalWrap open={modal} onClose={() => setModal(false)} title={editing !== null ? 'Edit Plan' : 'Add Plan'} onSave={save}>
        <Field label="Plan Name *" value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="e.g. Pro" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Price *" value={draft.price} onChange={v => setDraft(d => ({ ...d, price: v }))} placeholder="₹1,499" />
          <Field label="Duration" value={draft.duration} onChange={v => setDraft(d => ({ ...d, duration: v }))} placeholder="/month" />
        </div>
        <Field label="Badge (optional)" value={draft.badge} onChange={v => setDraft(d => ({ ...d, badge: v }))} placeholder="Most Popular" />

        {/* Color picker */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Color Theme</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_PRESETS.map(({ color, bg, label }) => (
              <button key={color} onClick={() => setDraft(d => ({ ...d, color, bg }))}
                style={{ width: 32, height: 32, borderRadius: '50%', background: color, border: draft.color === color ? '3px solid #1e293b' : '3px solid transparent', cursor: 'pointer', outline: draft.color === color ? `2px solid ${color}` : 'none', outlineOffset: 2 }}
                title={label} />
            ))}
          </div>
        </div>

        {/* Highlight toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <input type="checkbox" id={`hl-${addLabel}`} checked={draft.highlight} onChange={e => setDraft(d => ({ ...d, highlight: e.target.checked }))} />
          <label htmlFor={`hl-${addLabel}`} style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Featured / Highlighted card</label>
        </div>

        {/* Payment UPI */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>💳 PAYMENT DETAILS (shown in payment modal)</div>
          <Field label="UPI ID" value={draft.upiId} onChange={v => setDraft(d => ({ ...d, upiId: v }))} placeholder="yourname@upi" />
          <Field label="QR Code URL (optional)" value={draft.qrCode} onChange={v => setDraft(d => ({ ...d, qrCode: v }))} placeholder="https://..." />
        </div>

        {/* Features */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Features</label>
            <button onClick={addFeature} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+ Add Feature</button>
          </div>
          {draft.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <button onClick={() => setFeat(i, 'ok', !f.ok)}
                style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer', background: f.ok ? '#dcfce7' : '#fee2e2', color: f.ok ? '#16a34a' : '#dc2626', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                {f.ok ? <RiCheckLine /> : <RiCloseLine />}
              </button>
              <input value={f.text} onChange={e => setFeat(i, 'text', e.target.value)} placeholder="Feature text"
                style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--line,#e2e8f0)', fontSize: 13, background: 'var(--card)', color: 'var(--text)' }} />
              <button onClick={() => remFeature(i)} style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}><RiDeleteBin2Line /></button>
            </div>
          ))}
        </div>
      </ModalWrap>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════════════════════ */
export default function Subscription() {
  const [tab, setTab]     = useState('yearly'); // 'yearly' | 'monthly' | 'combos'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  /* config fields */
  const [monthlyPlans, setMonthlyPlans] = useState([]);
  const [yearlyPlans,  setYearlyPlans]  = useState([]);
  const [combos,       setCombos]       = useState([]);
  const [globalUpiId,  setGlobalUpiId]  = useState('');

  /* combo section labels */
  const [comboLabel,   setComboLabel]   = useState('COMBO PACKS');
  const [comboHeading, setComboHeading] = useState('One-Time Packs — Pay Once, Save More');

  /* combo modal */
  const [comboModal,   setComboModal]   = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [comboDraft,   setComboDraft]   = useState(emptyCombo());

  /* ── Fetch ─────────────────────────────────────────────────────────────── */
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/subscription-config');
      if (data.success) {
        const c = data.data;
        setMonthlyPlans(c.monthlyPlans || []);
        setYearlyPlans(c.yearlyPlans   || []);
        setCombos(c.combos             || []);
        setGlobalUpiId(c.globalUpiId   || '');
        setComboLabel(c.comboSectionLabel   || 'COMBO PACKS');
        setComboHeading(c.comboSectionHeading || '');
      }
    } catch { toast.error('Failed to load config'); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  /* ── Save full config (with optional partial overrides) ────────────────── */
  const saveConfig = async (overrides = {}) => {
    setSaving(true);
    try {
      const payload = {
        monthlyPlans, yearlyPlans, combos, globalUpiId,
        comboSectionLabel: comboLabel,
        comboSectionHeading: comboHeading,
        ...overrides,
      };
      const { data } = await api.put('/subscription-config', payload);
      if (data.success) {
        setMonthlyPlans(data.data.monthlyPlans || []);
        setYearlyPlans(data.data.yearlyPlans   || []);
        setCombos(data.data.combos             || []);
        toast.success('Saved!');
      }
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  /* ── Combo CRUD ─────────────────────────────────────────────────────────── */
  const openAddCombo  = () => { setEditingCombo(null); setComboDraft(emptyCombo()); setComboModal(true); };
  const openEditCombo = (c, i) => { setEditingCombo(i); setComboDraft({ ...c, items: [...(c.items || [])] }); setComboModal(true); };

  const saveCombo = async () => {
    if (!comboDraft.name.trim()) return toast.error('Combo name is required');
    const updated = editingCombo !== null
      ? combos.map((c, i) => i === editingCombo ? { ...comboDraft } : c)
      : [...combos, { ...comboDraft }];
    setCombos(updated); setComboModal(false);
    await saveConfig({ combos: updated });
  };

  const deleteCombo = async (idx) => {
    const r = await Swal.fire({ title: 'Delete Combo?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!r.isConfirmed) return;
    const updated = combos.filter((_, i) => i !== idx);
    setCombos(updated);
    await saveConfig({ combos: updated });
  };

  const moveCombo = async (idx, dir) => {
    const arr = [...combos];
    const si = dir === 'up' ? idx - 1 : idx + 1;
    if (si < 0 || si >= arr.length) return;
    [arr[idx], arr[si]] = [arr[si], arr[idx]];
    setCombos(arr);
    await saveConfig({ combos: arr });
  };

  const addItem = () => setComboDraft(d => ({ ...d, items: [...d.items, ''] }));
  const remItem = i  => setComboDraft(d => ({ ...d, items: d.items.filter((_, j) => j !== i) }));
  const setItem = (i, v) => setComboDraft(d => ({ ...d, items: d.items.map((it, j) => j === i ? v : it) }));

  /* ── Tab style ──────────────────────────────────────────────────────────── */
  const tabCfg = [
    { key: 'yearly',  label: 'Yearly',  icon: <RiCalendar2Line className="w-4 h-4" /> },
    { key: 'monthly', label: 'Monthly', icon: <RiCalendarLine className="w-4 h-4" /> },
    { key: 'combos',  label: 'COMBO PACKS', icon: <RiGiftLine className="w-4 h-4" /> },
  ];
  const tabStyle = (t) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, transition: 'all .15s',
    background: tab === t ? '#1e293b' : 'transparent',
    color: tab === t ? '#fff' : 'var(--muted)',
  });

  const cardStyle = { background: 'var(--card)', border: '1px solid var(--line,#e2e8f0)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>Loading…</div>;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Subscription Management</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>Manage Monthly plans, Yearly plans, and Combo Packs shown on the subscription page.</p>
      </div>

      {/* Global UPI ID */}
      <div style={{ ...cardStyle, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Global UPI ID (fallback for all plans)</label>
          <input value={globalUpiId} onChange={e => setGlobalUpiId(e.target.value)} placeholder="yourname@upi"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', boxSizing: 'border-box' }} />
        </div>
        <button onClick={() => saveConfig()} disabled={saving}
          style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#0f9d58', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1, flexShrink: 0 }}>
          {saving ? 'Saving…' : 'Save UPI'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface,#f8fafc)', padding: 4, borderRadius: 10, width: 'fit-content', marginBottom: 28, border: '1px solid var(--line,#e2e8f0)' }}>
        {tabCfg.map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)} style={tabStyle(key)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ─── MONTHLY TAB ─────────────────────────────────────────────────────── */}
      {tab === 'monthly' && (
        <PlanPanel
          plans={monthlyPlans}
          onSave={async (updated) => { setMonthlyPlans(updated); await saveConfig({ monthlyPlans: updated }); }}
          saving={saving}
          addLabel="Monthly"
          defaultDuration="/month"
        />
      )}

      {/* ─── YEARLY TAB ──────────────────────────────────────────────────────── */}
      {tab === 'yearly' && (
        <PlanPanel
          plans={yearlyPlans}
          onSave={async (updated) => { setYearlyPlans(updated); await saveConfig({ yearlyPlans: updated }); }}
          saving={saving}
          addLabel="Yearly"
          defaultDuration="/year"
        />
      )}

      {/* ─── COMBO PACKS TAB ─────────────────────────────────────────────────── */}
      {tab === 'combos' && (
        <div>
          {/* Section labels */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Section Labels</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Label (caps)</label>
                <input value={comboLabel} onChange={e => setComboLabel(e.target.value)} placeholder="COMBO PACKS"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Heading</label>
                <input value={comboHeading} onChange={e => setComboHeading(e.target.value)} placeholder="One-Time Packs — Pay Once, Save More"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={() => saveConfig()} disabled={saving}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#0f9d58', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save Labels'}
            </button>
          </div>

          {/* Combo list */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Combo Packs</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>{combos.length} combo{combos.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={openAddCombo} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <RiAddLine className="w-4 h-4" /> Add Combo
            </button>
          </div>

          {combos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', border: '2px dashed var(--line,#e2e8f0)', borderRadius: 12 }}>
              No combos yet — click <strong>Add Combo</strong>.
            </div>
          )}

          {combos.map((combo, idx) => (
            <div key={idx} style={{ ...cardStyle, borderLeft: `4px solid ${combo.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: combo.bg, border: `2px solid ${combo.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: combo.color }}>
                    {ICON_OPTIONS.find(o => o.id === combo.icon)?.icon || <RiFileTextLine className="w-5 h-5" />}
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{combo.name}</span>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      <span style={{ fontWeight: 700, color: combo.color }}>{combo.price}</span>
                      <span style={{ textDecoration: 'line-through', marginLeft: 8 }}>{combo.orig}</span>
                      {' · '}{combo.items?.length || 0} items
                      {combo.upiId && <span style={{ marginLeft: 8, color: '#0F9D58', fontWeight: 600 }}>· UPI ✓</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => moveCombo(idx, 'up')} disabled={idx === 0} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line,#e2e8f0)', cursor: 'pointer', background: 'transparent', opacity: idx === 0 ? 0.4 : 1 }}><RiArrowUpLine /></button>
                  <button onClick={() => moveCombo(idx, 'down')} disabled={idx === combos.length - 1} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line,#e2e8f0)', cursor: 'pointer', background: 'transparent', opacity: idx === combos.length - 1 ? 0.4 : 1 }}><RiArrowDownLine /></button>
                  <button onClick={() => openEditCombo(combo, idx)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line,#e2e8f0)', cursor: 'pointer', background: 'transparent', color: '#2563eb' }}><RiEditLine /></button>
                  <button onClick={() => deleteCombo(idx)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--line,#e2e8f0)', cursor: 'pointer', background: 'transparent', color: '#ef4444' }}><RiDeleteBin2Line /></button>
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(combo.items || []).map((item, j) => (
                  <span key={j} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: combo.bg, color: combo.color, border: `1px solid ${combo.color}33` }}>✓ {item}</span>
                ))}
              </div>
            </div>
          ))}

          {/* Combo Modal */}
          <ModalWrap open={comboModal} onClose={() => setComboModal(false)} title={editingCombo !== null ? 'Edit Combo Pack' : 'Add Combo Pack'} onSave={saveCombo}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Combo Name *</label>
              <input value={comboDraft.name} onChange={e => setComboDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. PDF Course Bundle"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Sale Price *</label>
                <input value={comboDraft.price} onChange={e => setComboDraft(d => ({ ...d, price: e.target.value }))} placeholder="₹3,999"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Original Price</label>
                <input value={comboDraft.orig} onChange={e => setComboDraft(d => ({ ...d, orig: e.target.value }))} placeholder="₹7,999"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Icon */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Icon</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ICON_OPTIONS.map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setComboDraft(d => ({ ...d, icon: id }))} title={label}
                    style={{ width: 36, height: 36, borderRadius: 8, border: comboDraft.icon === id ? '2px solid #2563eb' : '1px solid var(--line,#e2e8f0)', background: comboDraft.icon === id ? '#eff6ff' : 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Color Theme</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLOR_PRESETS.map(({ color, bg, label }) => (
                  <button key={color} onClick={() => setComboDraft(d => ({ ...d, color, bg }))}
                    style={{ width: 30, height: 30, borderRadius: '50%', background: color, border: comboDraft.color === color ? '3px solid #1e293b' : '3px solid transparent', cursor: 'pointer', outline: comboDraft.color === color ? `2px solid ${color}` : 'none', outlineOffset: 2 }}
                    title={label} />
                ))}
              </div>
            </div>

            {/* Payment UPI */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>💳 PAYMENT DETAILS</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>UPI ID</label>
                <input value={comboDraft.upiId} onChange={e => setComboDraft(d => ({ ...d, upiId: e.target.value }))} placeholder="yourname@upi"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>QR Code URL (optional)</label>
                <input value={comboDraft.qrCode} onChange={e => setComboDraft(d => ({ ...d, qrCode: e.target.value }))} placeholder="https://..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line,#e2e8f0)', fontSize: 13.5, background: 'var(--card)', color: 'var(--text)', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Items */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Included Items</label>
                <button onClick={addItem} style={{ fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+ Add Item</button>
              </div>
              {comboDraft.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input value={item} onChange={e => setItem(i, e.target.value)} placeholder="Item description"
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--line,#e2e8f0)', fontSize: 13, background: 'var(--card)', color: 'var(--text)' }} />
                  <button onClick={() => remItem(i)} style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}><RiDeleteBin2Line /></button>
                </div>
              ))}
            </div>
          </ModalWrap>
        </div>
      )}
    </div>
  );
}
