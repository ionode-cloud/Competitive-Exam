import { useState, useEffect, useCallback } from 'react';
import {
  RiMailLine, RiMailUnreadLine, RiMailCheckLine, RiDeleteBin2Line,
  RiSearchLine, RiCheckLine, RiTimeLine, RiPhoneLine, RiUserLine,
  RiExternalLinkLine, RiSettings4Line, RiChat1Line, RiBuildingLine,
  RiYoutubeLine, RiTelegramLine, RiInstagramLine, RiFacebookBoxLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

export default function ContactMessages() {
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' | 'settings'

  // Messages state
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [repliedCount, setRepliedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // View modal state
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Contact Config Settings State
  const [savingConfig, setSavingConfig] = useState(false);
  const [config, setConfig] = useState({
    phoneValue: '+91 98765 43210',
    phoneSub: 'Mon–Sat, 9 AM – 7 PM',
    emailValue: 'info@prephub.in',
    emailSub: 'Reply within 24 hours',
    whatsappValue: '+91 98765 43210',
    whatsappSub: 'Chat instantly',
    addressValue: 'PrepHub HQ, Bhubaneswar',
    addressSub: 'Odisha – 751001, India',
    youtubeHandle: '@PrepHubOdisha',
    youtubeLink: 'https://youtube.com',
    telegramHandle: 't.me/PrepHubOdisha',
    telegramLink: 'https://t.me/PrepHubOdisha',
    instagramHandle: '@prephub.in',
    instagramLink: 'https://instagram.com',
    facebookHandle: 'PrepHub Odisha',
    facebookLink: 'https://facebook.com',
    weekdayHours: '9:00 AM – 7:00 PM',
    saturdayHours: '10:00 AM – 5:00 PM',
    sundayHours: 'Closed',
    bannerEyebrow: 'Contact Us',
    bannerHeading: 'Get In Touch With Us',
    bannerSubtitle: "Have questions? We're here to help you on your exam journey — Mon to Sat, 9 AM–7 PM.",
  });

  /* ── Fetch Messages ──────────────────────────────────────────────────────── */
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/contact', {
        params: { page, limit: 10, search, status: statusFilter }
      });
      setMessages(data.data || []);
      setTotal(data.pagination?.total || 0);
      setUnreadCount(data.unreadCount || 0);
      setRepliedCount(data.repliedCount || 0);
    } catch {
      toast.error('Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  /* ── Fetch Config ───────────────────────────────────────────────────────── */
  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await api.get('/contact/config');
      if (data?.success && data?.data) {
        setConfig(data.data);
      }
    } catch {
      // Keep defaults on failure
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') fetchMessages();
    if (activeTab === 'settings') fetchConfig();
  }, [activeTab, fetchMessages, fetchConfig]);

  /* ── Status Update ───────────────────────────────────────────────────────── */
  const handleUpdateStatus = async (msgId, newStatus) => {
    try {
      await api.put(`/contact/${msgId}/status`, { status: newStatus });
      toast.success(`Message marked as ${newStatus}`);
      if (selectedMsg && selectedMsg._id === msgId) {
        setSelectedMsg(prev => ({ ...prev, status: newStatus }));
      }
      fetchMessages();
    } catch {
      toast.error('Failed to update status');
    }
  };

  /* ── Delete Message ──────────────────────────────────────────────────────── */
  const handleDelete = async (msg) => {
    const result = await Swal.fire({
      title: `Delete message from "${msg.name}"?`,
      text: 'This message will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/contact/${msg._id}`);
      toast.success('Message deleted');
      if (selectedMsg && selectedMsg._id === msg._id) {
        setModalOpen(false);
      }
      fetchMessages();
    } catch {
      toast.error('Failed to delete message');
    }
  };

  /* ── Save Settings ───────────────────────────────────────────────────────── */
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await api.put('/contact/config', config);
      toast.success('Contact info & banner settings updated successfully!');
    } catch {
      toast.error('Failed to update contact settings');
    } finally {
      setSavingConfig(false);
    }
  };

  /* ── Open Message Detail Modal ───────────────────────────────────────────── */
  const openDetail = (msg) => {
    setSelectedMsg(msg);
    setModalOpen(true);
    if (msg.status === 'unread') {
      handleUpdateStatus(msg._id, 'read');
    }
  };

  /* ── DataTable Columns ───────────────────────────────────────────────────── */
  const columns = [
    {
      key: 'name',
      label: 'Sender',
      render: r => (
        <div>
          <p className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
            {r.name}
            {r.status === 'unread' && (
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" title="Unread" />
            )}
          </p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{r.email}</p>
          {r.phone && <p className="text-[11px] text-slate-400 mt-0.5 font-sans flex items-center gap-1"><RiPhoneLine className="w-3 h-3" /> {r.phone}</p>}
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject & Topic',
      render: r => (
        <div>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 inline-block mb-1">
            {r.subject || 'General Enquiry'}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{r.message}</p>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      render: r => (
        <span className="text-xs text-slate-500 font-medium">
          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: r => {
        if (r.status === 'unread') return <span className="admin-badge-red font-bold">Unread</span>;
        if (r.status === 'replied') return <span className="admin-badge-green font-bold">Replied</span>;
        return <span className="admin-badge-blue font-bold">Read</span>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openDetail(r)}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 transition-colors"
          >
            View Message
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
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RiMailLine className="text-primary-600" /> Contact Messages &amp; Info Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">Manage customer enquiries and customize the Contact Us page details</p>
        </div>
      </div>

      {/* Top Tab Bar */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'messages'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <RiMailLine /> User Messages ({total})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <RiSettings4Line /> Banner &amp; Contact Info Settings
        </button>
      </div>

      {/* ── TAB 1: MESSAGES ── */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          {/* Overview Stat Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xl font-bold">
                <RiMailLine />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{total}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Messages</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center text-xl font-bold">
                <RiMailUnreadLine />
              </div>
              <div>
                <p className="text-2xl font-black text-red-500">{unreadCount}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Unread Messages</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xl font-bold">
                <RiMailCheckLine />
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-600">{repliedCount}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Replied</p>
              </div>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl gap-1.5 w-fit">
            {[
              { id: 'all', label: 'All Messages' },
              { id: 'unread', label: `Unread (${unreadCount})` },
              { id: 'read', label: 'Read' },
              { id: 'replied', label: 'Replied' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => { setStatusFilter(t.id); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === t.id
                    ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Messages Table */}
          <DataTable
            columns={columns}
            data={messages}
            total={total}
            page={page}
            limit={10}
            loading={loading}
            onPageChange={setPage}
            search={search}
            onSearch={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search by name, email, subject or message..."
            emptyMessage="No contact messages found."
          />
        </div>
      )}

      {/* ── TAB 2: SETTINGS ── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {/* Banner Text Settings */}
          <div className="admin-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              🎨 Contact Page Hero Banner Text
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="admin-label">Eyebrow Text</label>
                <input
                  type="text" value={config.bannerEyebrow}
                  onChange={e => setConfig(c => ({ ...c, bannerEyebrow: e.target.value }))}
                  className="admin-input" placeholder="Contact Us"
                />
              </div>
              <div>
                <label className="admin-label">Main Heading</label>
                <input
                  type="text" value={config.bannerHeading}
                  onChange={e => setConfig(c => ({ ...c, bannerHeading: e.target.value }))}
                  className="admin-input" placeholder="Get In Touch With Us"
                />
              </div>
            </div>
            <div>
              <label className="admin-label">Subtitle Description</label>
              <textarea
                value={config.bannerSubtitle}
                onChange={e => setConfig(c => ({ ...c, bannerSubtitle: e.target.value }))}
                className="admin-input resize-none" rows={2}
              />
            </div>
          </div>

          {/* Contact Cards Info */}
          <div className="admin-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              📞 Contact Cards Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Call Us */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-2">
                <label className="admin-label text-blue-700 dark:text-blue-400 font-bold">Call Us</label>
                <input
                  type="text" value={config.phoneValue}
                  onChange={e => setConfig(c => ({ ...c, phoneValue: e.target.value }))}
                  className="admin-input" placeholder="+91 98765 43210"
                />
                <input
                  type="text" value={config.phoneSub}
                  onChange={e => setConfig(c => ({ ...c, phoneSub: e.target.value }))}
                  className="admin-input text-xs" placeholder="Mon–Sat, 9 AM – 7 PM"
                />
              </div>

              {/* Email Us */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                <label className="admin-label text-emerald-700 dark:text-emerald-400 font-bold">Email Us</label>
                <input
                  type="text" value={config.emailValue}
                  onChange={e => setConfig(c => ({ ...c, emailValue: e.target.value }))}
                  className="admin-input" placeholder="info@prephub.in"
                />
                <input
                  type="text" value={config.emailSub}
                  onChange={e => setConfig(c => ({ ...c, emailSub: e.target.value }))}
                  className="admin-input text-xs" placeholder="Reply within 24 hours"
                />
              </div>

              {/* WhatsApp */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                <label className="admin-label text-emerald-700 dark:text-emerald-400 font-bold">WhatsApp</label>
                <input
                  type="text" value={config.whatsappValue}
                  onChange={e => setConfig(c => ({ ...c, whatsappValue: e.target.value }))}
                  className="admin-input" placeholder="+91 98765 43210"
                />
                <input
                  type="text" value={config.whatsappSub}
                  onChange={e => setConfig(c => ({ ...c, whatsappSub: e.target.value }))}
                  className="admin-input text-xs" placeholder="Chat instantly"
                />
              </div>

              {/* Office Address */}
              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
                <label className="admin-label text-purple-700 dark:text-purple-400 font-bold">Office Address</label>
                <input
                  type="text" value={config.addressValue}
                  onChange={e => setConfig(c => ({ ...c, addressValue: e.target.value }))}
                  className="admin-input" placeholder="PrepHub HQ, Bhubaneswar"
                />
                <input
                  type="text" value={config.addressSub}
                  onChange={e => setConfig(c => ({ ...c, addressSub: e.target.value }))}
                  className="admin-input text-xs" placeholder="Odisha – 751001, India"
                />
              </div>
            </div>
          </div>

          {/* Social Media Handles & Links */}
          <div className="admin-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              🌐 Social Media Handles &amp; Links
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* YouTube */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="admin-label flex items-center gap-1.5 text-red-600">
                  <RiYoutubeLine className="w-4 h-4" /> YouTube
                </label>
                <input
                  type="text" value={config.youtubeHandle}
                  onChange={e => setConfig(c => ({ ...c, youtubeHandle: e.target.value }))}
                  className="admin-input text-xs" placeholder="@PrepHubOdisha"
                />
                <input
                  type="text" value={config.youtubeLink}
                  onChange={e => setConfig(c => ({ ...c, youtubeLink: e.target.value }))}
                  className="admin-input text-xs font-mono" placeholder="https://youtube.com"
                />
              </div>

              {/* Telegram */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="admin-label flex items-center gap-1.5 text-blue-600">
                  <RiTelegramLine className="w-4 h-4" /> Telegram
                </label>
                <input
                  type="text" value={config.telegramHandle}
                  onChange={e => setConfig(c => ({ ...c, telegramHandle: e.target.value }))}
                  className="admin-input text-xs" placeholder="t.me/PrepHubOdisha"
                />
                <input
                  type="text" value={config.telegramLink}
                  onChange={e => setConfig(c => ({ ...c, telegramLink: e.target.value }))}
                  className="admin-input text-xs font-mono" placeholder="https://t.me/PrepHubOdisha"
                />
              </div>

              {/* Instagram */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="admin-label flex items-center gap-1.5 text-purple-600">
                  <RiInstagramLine className="w-4 h-4" /> Instagram
                </label>
                <input
                  type="text" value={config.instagramHandle}
                  onChange={e => setConfig(c => ({ ...c, instagramHandle: e.target.value }))}
                  className="admin-input text-xs" placeholder="@prephub.in"
                />
                <input
                  type="text" value={config.instagramLink}
                  onChange={e => setConfig(c => ({ ...c, instagramLink: e.target.value }))}
                  className="admin-input text-xs font-mono" placeholder="https://instagram.com"
                />
              </div>

              {/* Facebook */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="admin-label flex items-center gap-1.5 text-blue-700">
                  <RiFacebookBoxLine className="w-4 h-4" /> Facebook
                </label>
                <input
                  type="text" value={config.facebookHandle}
                  onChange={e => setConfig(c => ({ ...c, facebookHandle: e.target.value }))}
                  className="admin-input text-xs" placeholder="PrepHub Odisha"
                />
                <input
                  type="text" value={config.facebookLink}
                  onChange={e => setConfig(c => ({ ...c, facebookLink: e.target.value }))}
                  className="admin-input text-xs font-mono" placeholder="https://facebook.com"
                />
              </div>
            </div>
          </div>

          {/* Support Hours */}
          <div className="admin-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              ⏰ Support Hours Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="admin-label">Monday – Friday</label>
                <input
                  type="text" value={config.weekdayHours}
                  onChange={e => setConfig(c => ({ ...c, weekdayHours: e.target.value }))}
                  className="admin-input" placeholder="9:00 AM – 7:00 PM"
                />
              </div>
              <div>
                <label className="admin-label">Saturday</label>
                <input
                  type="text" value={config.saturdayHours}
                  onChange={e => setConfig(c => ({ ...c, saturdayHours: e.target.value }))}
                  className="admin-input" placeholder="10:00 AM – 5:00 PM"
                />
              </div>
              <div>
                <label className="admin-label">Sunday</label>
                <input
                  type="text" value={config.sundayHours}
                  onChange={e => setConfig(c => ({ ...c, sundayHours: e.target.value }))}
                  className="admin-input" placeholder="Closed"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={savingConfig}
            className="admin-btn-primary py-3 px-8 text-sm font-bold shadow-lg"
          >
            {savingConfig ? 'Saving Settings...' : 'Save Contact Settings'}
          </button>
        </form>
      )}

      {/* Message Details Modal */}
      {selectedMsg && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Contact Message Details"
          size="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => handleDelete(selectedMsg)}
                className="text-xs text-red-500 hover:underline font-bold flex items-center gap-1"
              >
                <RiDeleteBin2Line /> Delete Message
              </button>
              <div className="flex items-center gap-2">
                {selectedMsg.status !== 'replied' ? (
                  <button
                    onClick={() => handleUpdateStatus(selectedMsg._id, 'replied')}
                    className="admin-btn-primary text-xs flex items-center gap-1"
                  >
                    <RiCheckLine /> Mark as Replied
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus(selectedMsg._id, 'read')}
                    className="admin-btn-secondary text-xs"
                  >
                    Mark as Read
                  </button>
                )}
                <button onClick={() => setModalOpen(false)} className="admin-btn-secondary text-xs">
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            {/* Sender Meta Box */}
            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                  <RiUserLine className="text-primary-500" />
                  {selectedMsg.name}
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(selectedMsg.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <a
                  href={`mailto:${selectedMsg.email}`}
                  className="text-primary-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <RiMailLine /> {selectedMsg.email} <RiExternalLinkLine className="w-3 h-3" />
                </a>
                {selectedMsg.phone && (
                  <a
                    href={`tel:${selectedMsg.phone}`}
                    className="text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1"
                  >
                    <RiPhoneLine /> {selectedMsg.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject</label>
              <p className="font-bold text-slate-800 dark:text-white text-base">
                {selectedMsg.subject || 'General Enquiry'}
              </p>
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Message Content</label>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedMsg.message}
              </div>
            </div>

            {/* Direct Email Action Button */}
            <div className="pt-2">
              <a
                href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(selectedMsg.subject || 'Enquiry')}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => handleUpdateStatus(selectedMsg._id, 'replied')}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-center block text-xs transition-colors shadow-sm"
              >
                ✉ Reply via Email ({selectedMsg.email})
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
