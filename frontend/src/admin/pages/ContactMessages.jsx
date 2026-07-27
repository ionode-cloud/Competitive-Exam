import { useState, useEffect, useCallback } from 'react';
import {
  RiMailLine, RiMailUnreadLine, RiMailCheckLine, RiDeleteBin2Line,
  RiSearchLine, RiCheckLine, RiTimeLine, RiPhoneLine, RiUserLine,
  RiExternalLinkLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

export default function ContactMessages() {
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
    } catch (err) {
      toast.error('Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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

  /* ── Open Message Detail Modal ───────────────────────────────────────────── */
  const openDetail = (msg) => {
    setSelectedMsg(msg);
    setModalOpen(true);
    // Automatically mark as read if unread
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
            <RiMailLine className="text-primary-600" /> Contact Messages
          </h2>
          <p className="text-xs text-slate-400 mt-1">View and respond to customer enquiries submitted from the Contact Us page</p>
        </div>
      </div>

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
