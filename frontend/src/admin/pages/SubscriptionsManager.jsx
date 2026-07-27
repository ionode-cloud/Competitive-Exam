// SubscriptionsManager.jsx — Complete Subscription Management System for Admin Panel
import { useState, useEffect, useCallback } from 'react';
import {
  RiVipCrownLine, RiMoneyDollarCircleLine, RiUserFollowLine, RiUserLine,
  RiTimeLine, RiCloseCircleLine, RiAddLine, RiEditLine, RiDeleteBin2Line,
  RiFileCopyLine, RiCheckLine, RiCloseLine, RiSearchLine, RiFilterLine,
  RiEyeLine, RiCalendarEventLine, RiRefreshLine, RiShieldCrossLine,
  RiBuildingLine, RiBarChartBoxLine, RiEqualizerLine, RiCheckDoubleLine,
  RiMailSendLine, RiUserAddLine, RiArrowUpLine, RiArrowDownLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';

export default function SubscriptionsManager() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | plans | subscribers | transactions | expiring | revenue | comparison | settings

  /* ── 1. OVERVIEW & ANALYTICS STATE ─────────────────────────────────────── */
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get('/subscriptions/analytics');
      if (data.success) setAnalytics(data.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setAnalyticsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'revenue') fetchAnalytics();
  }, [activeTab, fetchAnalytics]);

  /* ── 2. SUBSCRIPTION PLANS STATE ───────────────────────────────────────── */
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planSearch, setPlanSearch] = useState('');
  const [planStatusFilter, setPlanStatusFilter] = useState('');
  
  // Plan Modal
  const [planModal, setPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '', code: '', description: '', type: 'paid',
    price: 999, discountPrice: 799, currency: 'INR',
    billingCycle: 'monthly', duration: 1, durationUnit: 'months',
    features: [{ name: 'Unlimited Mock Tests', included: true }, { name: 'Previous Year Questions', included: true }],
    isFeatured: false, isVisible: true, isActive: true
  });

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const { data } = await api.get('/subscriptions/plans', {
        params: { search: planSearch, status: planStatusFilter, limit: 100 }
      });
      if (data.success) setPlans(data.data || []);
    } catch { toast.error('Failed to load plans'); }
    finally { setPlansLoading(false); }
  }, [planSearch, planStatusFilter]);

  useEffect(() => {
    if (activeTab === 'plans' || activeTab === 'comparison' || activeTab === 'overview') fetchPlans();
  }, [activeTab, fetchPlans]);

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '', code: '', description: '', type: 'paid',
      price: 999, discountPrice: 799, currency: 'INR',
      billingCycle: 'monthly', duration: 1, durationUnit: 'months',
      features: [
        { name: 'Unlimited Mock Tests', included: true },
        { name: 'Previous Year Questions', included: true },
        { name: 'Study Materials', included: true },
        { name: 'Test Analysis', included: true }
      ],
      isFeatured: false, isVisible: true, isActive: true
    });
    setPlanModal(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan._id);
    setPlanForm({
      name: plan.name || '',
      code: plan.code || '',
      description: plan.description || '',
      type: plan.type || 'paid',
      price: plan.price ?? 0,
      discountPrice: plan.discountPrice ?? 0,
      currency: plan.currency || 'INR',
      billingCycle: plan.billingCycle || 'monthly',
      duration: plan.duration ?? 1,
      durationUnit: plan.durationUnit || 'months',
      features: plan.features?.length ? plan.features.map(f => ({ ...f })) : [{ name: '', included: true }],
      isFeatured: !!plan.isFeatured,
      isVisible: plan.isVisible ?? true,
      isActive: plan.isActive ?? true
    });
    setPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name.trim()) return toast.error('Plan Name is required');
    try {
      if (editingPlan) {
        await api.put(`/subscriptions/plans/${editingPlan}`, planForm);
        toast.success('Plan updated successfully');
      } else {
        await api.post('/subscriptions/plans', planForm);
        toast.success('Plan created successfully');
      }
      setPlanModal(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleTogglePlanStatus = async (plan) => {
    try {
      await api.patch(`/subscriptions/plans/${plan._id}/status`);
      toast.success(`Plan ${plan.isActive ? 'deactivated' : 'activated'}`);
      fetchPlans();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDuplicatePlan = async (plan) => {
    try {
      await api.post(`/subscriptions/plans/${plan._id}/duplicate`);
      toast.success('Plan duplicated');
      fetchPlans();
    } catch { toast.error('Duplicate failed'); }
  };

  const handleDeletePlan = async (plan) => {
    const result = await Swal.fire({
      title: `Delete ${plan.name}?`,
      text: 'This action cannot be undone. If active subscribers exist, it will be deactivated.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete Plan'
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/subscriptions/plans/${plan._id}`);
      toast.success('Plan deleted/deactivated');
      fetchPlans();
    } catch { toast.error('Delete failed'); }
  };

  const handleAddFeature = () => {
    setPlanForm(prev => ({
      ...prev,
      features: [...prev.features, { name: '', included: true }]
    }));
  };

  const handleRemoveFeature = (idx) => {
    setPlanForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  /* ── 3. SUBSCRIBERS STATE ───────────────────────────────────────────────── */
  const [subscribers, setSubscribers] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subLoading, setSubLoading] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('');
  const [subPaymentFilter, setSubPaymentFilter] = useState('');
  const [subPlanFilter, setSubPlanFilter] = useState('');

  // Subscriber Detail View Modal
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [subscriberDetailModal, setSubscriberDetailModal] = useState(false);

  // Extend Modal
  const [extendModal, setExtendModal] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [extendReason, setExtendReason] = useState('');

  // Manual Subscription Modal
  const [manualModal, setManualModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [manualForm, setManualForm] = useState({
    userId: '', planId: '', startDate: new Date().toISOString().slice(0, 10),
    paymentStatus: 'paid', amount: 0, transactionId: '', paymentMethod: 'UPI', notes: ''
  });

  const fetchSubscribers = useCallback(async () => {
    setSubLoading(true);
    try {
      const { data } = await api.get('/subscriptions/subscribers', {
        params: {
          page: subPage, limit: 15, search: subSearch,
          status: subStatusFilter, paymentStatus: subPaymentFilter, plan: subPlanFilter
        }
      });
      if (data.success) {
        setSubscribers(data.data || []);
        setSubTotal(data.pagination?.total || 0);
      }
    } catch { toast.error('Failed to load subscribers'); }
    finally { setSubLoading(false); }
  }, [subPage, subSearch, subStatusFilter, subPaymentFilter, subPlanFilter]);

  useEffect(() => {
    if (activeTab === 'subscribers') fetchSubscribers();
  }, [activeTab, fetchSubscribers]);

  const handleViewSubscriber = async (sub) => {
    try {
      const { data } = await api.get(`/subscriptions/subscribers/${sub._id}`);
      if (data.success) {
        setSelectedSubscriber(data);
        setSubscriberDetailModal(true);
      }
    } catch {
      setSelectedSubscriber({ data: sub, transactions: [] });
      setSubscriberDetailModal(true);
    }
  };

  const handleSubscriberAction = async (action, subId, payload = {}) => {
    try {
      await api.patch(`/subscriptions/subscribers/${subId}/${action}`, payload);
      toast.success(`Subscription ${action}ed successfully`);
      if (subscriberDetailModal) setSubscriberDetailModal(false);
      fetchSubscribers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleOpenExtend = (sub) => {
    setSelectedSubscriber({ data: sub });
    setExtendDays(30);
    setExtendReason('');
    setExtendModal(true);
  };

  const handleConfirmExtend = async () => {
    if (!selectedSubscriber?.data?._id) return;
    try {
      await api.patch(`/subscriptions/subscribers/${selectedSubscriber.data._id}/extend`, {
        days: Number(extendDays),
        reason: extendReason
      });
      toast.success('Subscription extended');
      setExtendModal(false);
      if (subscriberDetailModal) setSubscriberDetailModal(false);
      fetchSubscribers();
    } catch { toast.error('Extension failed'); }
  };

  // Search users for manual sub
  const handleSearchUsers = async (query) => {
    setUserSearchTerm(query);
    if (!query || query.length < 2) return;
    try {
      const { data } = await api.get('/students', { params: { search: query, limit: 10 } });
      if (data.success) setUserOptions(data.data || []);
    } catch { setUserOptions([]); }
  };

  const handleOpenManualSub = () => {
    setManualForm({
      userId: '', planId: plans[0]?._id || '', startDate: new Date().toISOString().slice(0, 10),
      paymentStatus: 'paid', amount: plans[0]?.price || 0, transactionId: '', paymentMethod: 'Manual Admin', notes: ''
    });
    setUserSearchTerm('');
    setUserOptions([]);
    setManualModal(true);
  };

  const handleSaveManualSub = async (e) => {
    e.preventDefault();
    if (!manualForm.userId) return toast.error('Please select a user');
    if (!manualForm.planId) return toast.error('Please select a plan');
    try {
      await api.post('/subscriptions/manual', manualForm);
      toast.success('Manual subscription assigned');
      setManualModal(false);
      fetchSubscribers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign subscription');
    }
  };

  /* ── 4. TRANSACTIONS STATE ──────────────────────────────────────────────── */
  const [transactions, setTransactions] = useState([]);
  const [txnTotal, setTxnTotal] = useState(0);
  const [txnPage, setTxnPage] = useState(1);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnSearch, setTxnSearch] = useState('');
  const [txnStatusFilter, setTxnStatusFilter] = useState('');
  const [txnMethodFilter, setTxnMethodFilter] = useState('');

  const fetchTransactions = useCallback(async () => {
    setTxnLoading(true);
    try {
      const { data } = await api.get('/subscriptions/transactions', {
        params: { page: txnPage, limit: 15, search: txnSearch, status: txnStatusFilter, paymentMethod: txnMethodFilter }
      });
      if (data.success) {
        setTransactions(data.data || []);
        setTxnTotal(data.pagination?.total || 0);
      }
    } catch { toast.error('Failed to load transactions'); }
    finally { setTxnLoading(false); }
  }, [txnPage, txnSearch, txnStatusFilter, txnMethodFilter]);

  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab, fetchTransactions]);

  /* ── 5. EXPIRING SOON STATE ─────────────────────────────────────────────── */
  const [expiringList, setExpiringList] = useState([]);
  const [expiringLoading, setExpiringLoading] = useState(false);
  const [expiringDays, setExpiringDays] = useState(30);

  const fetchExpiringSoon = useCallback(async () => {
    setExpiringLoading(true);
    try {
      const { data } = await api.get('/subscriptions/expiring-soon', { params: { days: expiringDays } });
      if (data.success) setExpiringList(data.data || []);
    } catch { toast.error('Failed to load expiring list'); }
    finally { setExpiringLoading(false); }
  }, [expiringDays]);

  useEffect(() => {
    if (activeTab === 'expiring') fetchExpiringSoon();
  }, [activeTab, fetchExpiringSoon]);

  const handleSendReminder = (sub) => {
    toast.success(`Renewal reminder sent to ${sub.userId?.email || 'user'}`);
  };

  /* ── 6. REVENUE ANALYTICS STATE ─────────────────────────────────────────── */
  const [revenueData, setRevenueData] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const fetchRevenueData = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const { data } = await api.get('/subscriptions/revenue');
      if (data.success) setRevenueData(data.data);
    } catch { toast.error('Failed to load revenue stats'); }
    finally { setRevenueLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'revenue') fetchRevenueData();
  }, [activeTab, fetchRevenueData]);

  /* ── 7. SETTINGS STATE ─────────────────────────────────────────────────── */
  const [settings, setSettings] = useState({
    enabled: true, allowFreePlan: true, allowMultipleSubscriptions: false,
    allowUpgrade: true, allowDowngrade: true, allowCancellation: true,
    enableAutoRenewal: false, renewalReminderDays: 7, expiryReminderDays: 3,
    currency: 'INR', taxRate: 18, paymentGateway: 'razorpay',
    razorpayKeyId: '', razorpayKeySecret: '',
    refundPolicy: 'No refunds after 48 hours.'
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/subscriptions/settings');
      if (data.success && data.data) setSettings(data.data);
    } catch { toast.error('Failed to load settings'); }
  }, []);

  useEffect(() => {
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, fetchSettings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      await api.put('/subscriptions/settings', settings);
      toast.success('Subscription Settings Saved!');
    } catch { toast.error('Failed to save settings'); }
    finally { setSettingsSaving(false); }
  };

  /* ── Status Badge Renderers ─────────────────────────────────────────────── */
  const renderStatusBadge = (status) => {
    const map = {
      active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      expired: 'bg-rose-100 text-rose-800 border-rose-300',
      cancelled: 'bg-slate-100 text-slate-700 border-slate-300',
      pending: 'bg-amber-100 text-amber-800 border-amber-300',
      suspended: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return (
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const renderPaymentBadge = (status) => {
    const map = {
      paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
      refunded: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border capitalize ${map[status] || 'bg-gray-50 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  /* ── Nav Sub-tabs ───────────────────────────────────────────────────────── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: RiBarChartBoxLine },
    { id: 'plans', label: 'Subscription Plans', icon: RiVipCrownLine },
    { id: 'subscribers', label: 'Subscribers', icon: RiUserFollowLine },
    { id: 'transactions', label: 'Transactions', icon: RiMoneyDollarCircleLine },
    { id: 'expiring', label: 'Expiring Soon', icon: RiTimeLine },
    { id: 'revenue', label: 'Revenue Analytics', icon: RiBarChartBoxLine },
    { id: 'comparison', label: 'Plan Comparison', icon: RiEqualizerLine },
    { id: 'settings', label: 'Settings', icon: RiBuildingLine },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <RiVipCrownLine className="text-amber-500" /> Subscriptions System
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Comprehensive admin management for plans, subscribers, revenue, and access control.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenManualSub}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm"
          >
            <RiUserAddLine className="w-4 h-4" /> Add Manual Subscription
          </button>
          <button
            onClick={handleOpenCreatePlan}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm"
          >
            <RiAddLine className="w-4 h-4" /> + Create Plan
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. OVERVIEW TAB                                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 8 Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Total Plans</span>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg"><RiVipCrownLine className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{analytics?.totalPlans ?? 0}</div>
                <div className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                  <RiCheckLine /> {analytics?.activePlans ?? 0} Active Plans
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Active Plans</span>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><RiCheckDoubleLine className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{analytics?.activePlans ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">Available on storefront</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Total Subscribers</span>
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><RiUserLine className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{analytics?.totalSubscribers ?? 0}</div>
                <div className="text-xs text-indigo-600 mt-1 font-medium">All time subscriber base</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Active Subscribers</span>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><RiUserFollowLine className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{analytics?.activeSubscribers ?? 0}</div>
                <div className="text-xs text-emerald-600 mt-1 font-medium">Currently accessing features</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Expired Subscriptions</span>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-lg"><RiTimeLine className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{analytics?.expiredSubscribers ?? 0}</div>
                <div className="text-xs text-rose-600 mt-1 font-medium">Requires renewal</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Total Revenue</span>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg"><RiMoneyDollarCircleLine className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">₹{(analytics?.totalRevenue ?? 0).toLocaleString('en-IN')}</div>
                <div className="text-xs text-slate-500 mt-1">Today: ₹{(analytics?.todayRevenue ?? 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Expiring Soon (30d)</span>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg"><RiCalendarEventLine className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{analytics?.expiringSoon ?? 0}</div>
                <div className="text-xs text-amber-600 mt-1 font-medium">Send reminders</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Cancelled / Suspended</span>
                <div className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 rounded-lg"><RiCloseCircleLine className="w-5 h-5" /></div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800 dark:text-white">
                  {(analytics?.cancelledSubscribers ?? 0) + (analytics?.suspendedSubscribers ?? 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {analytics?.cancelledSubscribers ?? 0} Cancelled · {analytics?.suspendedSubscribers ?? 0} Suspended
                </div>
              </div>
            </div>

          </div>

          {/* Quick Actions & Status Summary Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-amber-400 font-semibold text-xs uppercase tracking-wider">Quick Management</div>
              <h2 className="text-xl font-bold mt-1">Control Subscription Policies & Manual Extensions</h2>
              <p className="text-slate-300 text-sm mt-1 max-w-xl">
                Assign manual access to students, customize plan limits, update gateway settings, or extend subscriber access cleanly.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('plans')}
                className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-bold text-sm transition-all"
              >
                Manage Plans
              </button>
              <button
                onClick={() => setActiveTab('subscribers')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm transition-all"
              >
                View Subscribers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. SUBSCRIPTION PLANS TAB                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-6">

          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <RiSearchLine className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search plan name or code..."
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={planStatusFilter}
                onChange={(e) => setPlanStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <button
              onClick={handleOpenCreatePlan}
              className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
            >
              <RiAddLine className="w-4 h-4" /> + Create New Plan
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border ${
                  plan.isFeatured ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700'
                } shadow-sm p-6 flex flex-col justify-between relative overflow-hidden`}
              >
                {plan.isFeatured && (
                  <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full">
                    Featured
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{plan.name}</h3>
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      {plan.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 min-h-[36px] line-clamp-2">{plan.description || 'No description provided.'}</p>

                  {/* Pricing Display */}
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      ₹{plan.price.toLocaleString('en-IN')}
                    </span>
                    {plan.discountPrice > 0 && plan.discountPrice < plan.price && (
                      <span className="text-sm text-slate-400 line-through">
                        ₹{plan.discountPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-medium capitalize">
                      / {plan.duration} {plan.durationUnit}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {renderStatusBadge(plan.isActive ? 'active' : 'expired')}
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                      {plan.subscriberCount || 0} Subscribers
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="mt-5 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Features Included</div>
                    {plan.features?.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        {f.included ? (
                          <RiCheckLine className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <RiCloseLine className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className={f.included ? 'font-medium' : 'text-slate-400 line-through'}>{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Card Actions */}
                <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleTogglePlanStatus(plan)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      plan.isActive
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicatePlan(plan)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Duplicate Plan"
                    >
                      <RiFileCopyLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditPlan(plan)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit Plan"
                    >
                      <RiEditLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete Plan"
                    >
                      <RiDeleteBin2Line className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. SUBSCRIBERS TAB                                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'subscribers' && (
        <div className="space-y-6">

          {/* Search & Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <RiSearchLine className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search user, email, phone, sub ID..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <select
                value={subStatusFilter}
                onChange={(e) => setSubStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={subPaymentFilter}
                onChange={(e) => setSubPaymentFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                <option value="">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <button
              onClick={handleOpenManualSub}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
            >
              <RiUserAddLine className="w-4 h-4" /> + Add Manual Subscription
            </button>
          </div>

          {/* Subscribers Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <DataTable
              columns={[
                {
                  header: 'User',
                  accessor: (row) => (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {row.userId?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-white text-sm">{row.userId?.name || 'N/A'}</div>
                        <div className="text-xs text-slate-400">{row.userId?.email || 'N/A'} · {row.userId?.phone || 'No Phone'}</div>
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Subscription ID',
                  accessor: (row) => <span className="font-mono text-xs font-semibold text-indigo-600">{row.subscriptionId}</span>
                },
                {
                  header: 'Plan',
                  accessor: (row) => (
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      {row.planId?.name || 'Custom Plan'}
                    </span>
                  )
                },
                {
                  header: 'Start Date',
                  accessor: (row) => <span className="text-xs text-slate-600">{new Date(row.startDate).toLocaleDateString('en-IN')}</span>
                },
                {
                  header: 'Expiry Date',
                  accessor: (row) => (
                    <div>
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{new Date(row.expiryDate).toLocaleDateString('en-IN')}</div>
                      <div className="text-[10px] text-slate-400">{row.remainingDays} days remaining</div>
                    </div>
                  )
                },
                {
                  header: 'Payment',
                  accessor: (row) => (
                    <div>
                      <div className="text-xs font-bold">₹{(row.amount || 0).toLocaleString('en-IN')}</div>
                      {renderPaymentBadge(row.paymentStatus)}
                    </div>
                  )
                },
                {
                  header: 'Status',
                  accessor: (row) => renderStatusBadge(row.status)
                },
                {
                  header: 'Actions',
                  accessor: (row) => (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewSubscriber(row)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded text-xs font-medium transition-all"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleOpenExtend(row)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-medium transition-all"
                      >
                        Extend
                      </button>
                    </div>
                  )
                }
              ]}
              data={subscribers}
              total={subTotal}
              page={subPage}
              onPageChange={setSubPage}
              loading={subLoading}
            />
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. TRANSACTIONS TAB                                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <RiSearchLine className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search Txn ID..."
                  value={txnSearch}
                  onChange={(e) => setTxnSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <select
                value={txnStatusFilter}
                onChange={(e) => setTxnStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <DataTable
              columns={[
                {
                  header: 'Transaction ID',
                  accessor: (row) => <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">{row.transactionId}</span>
                },
                {
                  header: 'User',
                  accessor: (row) => (
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-white">{row.userId?.name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{row.userId?.email || 'N/A'}</div>
                    </div>
                  )
                },
                {
                  header: 'Plan',
                  accessor: (row) => <span className="text-xs font-medium">{row.planId?.name || 'Subscription'}</span>
                },
                {
                  header: 'Amount',
                  accessor: (row) => <span className="font-bold text-sm text-emerald-600">₹{(row.amount || 0).toLocaleString('en-IN')}</span>
                },
                {
                  header: 'Payment Method',
                  accessor: (row) => <span className="text-xs font-medium text-slate-600">{row.paymentMethod || 'UPI'}</span>
                },
                {
                  header: 'Status',
                  accessor: (row) => renderPaymentBadge(row.status)
                },
                {
                  header: 'Date',
                  accessor: (row) => <span className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString('en-IN')}</span>
                }
              ]}
              data={transactions}
              total={txnTotal}
              page={txnPage}
              onPageChange={setTxnPage}
              loading={txnLoading}
            />
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. EXPIRING SOON TAB                                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'expiring' && (
        <div className="space-y-6">

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Expiring in next:</span>
              {[7, 15, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setExpiringDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    expiringDays === d
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">{expiringList.length} Subscribers Found</span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <DataTable
              columns={[
                {
                  header: 'User',
                  accessor: (row) => (
                    <div>
                      <div className="font-semibold text-sm text-slate-800 dark:text-white">{row.userId?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-400">{row.userId?.email || 'N/A'}</div>
                    </div>
                  )
                },
                {
                  header: 'Plan',
                  accessor: (row) => <span className="font-medium text-xs text-slate-800">{row.planId?.name}</span>
                },
                {
                  header: 'Expiry Date',
                  accessor: (row) => <span className="text-xs font-medium text-rose-600">{new Date(row.expiryDate).toLocaleDateString('en-IN')}</span>
                },
                {
                  header: 'Remaining Days',
                  accessor: (row) => {
                    const r = row.remainingDays;
                    let badgeClass = 'bg-amber-100 text-amber-800';
                    if (r <= 3) badgeClass = 'bg-rose-100 text-rose-800 font-extrabold animate-pulse';
                    return <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${badgeClass}`}>{r} Days</span>;
                  }
                },
                {
                  header: 'Action',
                  accessor: (row) => (
                    <button
                      onClick={() => handleSendReminder(row)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-semibold flex items-center gap-1.5"
                    >
                      <RiMailSendLine className="w-3.5 h-3.5" /> Send Reminder
                    </button>
                  )
                }
              ]}
              data={expiringList}
              total={expiringList.length}
              page={1}
              onPageChange={() => {}}
              loading={expiringLoading}
            />
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. REVENUE ANALYTICS TAB                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">

          {/* Revenue Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-400">This Week</div>
              <div className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                ₹{(revenueData?.thisWeek ?? 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-400">This Month</div>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                ₹{(revenueData?.thisMonth ?? 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-400">This Year</div>
              <div className="text-2xl font-black text-indigo-600 mt-2">
                ₹{(revenueData?.thisYear ?? 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="text-xs font-semibold uppercase text-slate-400">Total Lifetime Revenue</div>
              <div className="text-2xl font-black text-amber-500 mt-2">
                ₹{(analytics?.totalRevenue ?? 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Plan Performance Table */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Plan Performance Breakdown</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {revenueData?.planPerformance?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-white text-sm">{item.planName || 'Custom Plan'}</div>
                    <div className="text-xs text-slate-400">{item.count} Total Subscribers</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-emerald-600 text-base">₹{(item.revenue || 0).toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400">Generated Revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7. PLAN COMPARISON TAB                                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'comparison' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Plan Feature Availability Matrix</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-4 text-xs font-bold text-slate-400 uppercase">Feature / Parameter</th>
                {plans.map((p) => (
                  <th key={p._id} className="py-3 px-4 text-sm font-extrabold text-slate-800 dark:text-white text-center">
                    {p.name}
                    <div className="text-xs font-normal text-emerald-600 mt-0.5">₹{p.price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Billing Cycle</td>
                {plans.map((p) => (
                  <td key={p._id} className="py-3 px-4 text-center capitalize text-slate-600">{p.billingCycle}</td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Duration</td>
                {plans.map((p) => (
                  <td key={p._id} className="py-3 px-4 text-center text-slate-600">{p.duration} {p.durationUnit}</td>
                ))}
              </tr>
              {/* Dynamic Features matrix */}
              {Array.from(new Set(plans.flatMap((p) => p.features?.map((f) => f.name) || []))).map((featName, i) => (
                <tr key={i}>
                  <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">{featName}</td>
                  {plans.map((p) => {
                    const match = p.features?.find((f) => f.name === featName);
                    return (
                      <td key={p._id} className="py-3 px-4 text-center">
                        {match ? (
                          match.included ? (
                            <RiCheckLine className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <RiCloseLine className="w-5 h-5 text-rose-400 mx-auto" />
                          )
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 8. SETTINGS TAB                                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 max-w-3xl">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-3">Subscription System Configuration</h3>

          {/* General Toggles */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">General Policy</h4>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-slate-800 dark:text-white">Enable Subscription System</div>
                <div className="text-xs text-slate-400">Master toggle to enable/disable subscriptions platform-wide</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="w-5 h-5 accent-indigo-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-slate-800 dark:text-white">Allow Free Plan</div>
                <div className="text-xs text-slate-400">Permit free plan registration</div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowFreePlan}
                onChange={(e) => setSettings({ ...settings, allowFreePlan: e.target.checked })}
                className="w-5 h-5 accent-indigo-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-slate-800 dark:text-white">Allow Plan Upgrades / Downgrades</div>
                <div className="text-xs text-slate-400">Enable self-service plan switches for active subscribers</div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowUpgrade}
                onChange={(e) => setSettings({ ...settings, allowUpgrade: e.target.checked })}
                className="w-5 h-5 accent-indigo-600"
              />
            </div>
          </div>

          {/* Renewal & Reminders */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Reminders & Renewals</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Renewal Reminder Days</label>
                <input
                  type="number"
                  value={settings.renewalReminderDays}
                  onChange={(e) => setSettings({ ...settings, renewalReminderDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Expiry Reminder Days</label>
                <input
                  type="number"
                  value={settings.expiryReminderDays}
                  onChange={(e) => setSettings({ ...settings, expiryReminderDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Tax & Payment */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Taxation & Payment Gateway</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">GST Tax Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Payment Gateway Mode</label>
                <select
                  value={settings.paymentGateway}
                  onChange={(e) => setSettings({ ...settings, paymentGateway: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="razorpay">Razorpay Gateway (Recommended)</option>
                  <option value="manual">Manual UPI / Admin Verification</option>
                  <option value="payu">PayU Gateway</option>
                </select>
              </div>
            </div>

            {/* Razorpay API Key Inputs */}
            <div className="bg-indigo-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-indigo-100 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Razorpay API Keys</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Razorpay Key ID</label>
                  <input
                    type="text"
                    placeholder="rzp_test_..."
                    value={settings.razorpayKeyId || ''}
                    onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Razorpay Key Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={settings.razorpayKeySecret || ''}
                    onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                You can get your Key ID and Secret from the <a href="https://dashboard.razorpay.com/" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">Razorpay Dashboard → API Keys</a>.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={settingsSaving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm"
          >
            {settingsSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: CREATE / EDIT PLAN                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {planModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </h3>
              <button onClick={() => setPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                <RiCloseLine className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g. Pro Membership"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Plan Code *</label>
                  <input
                    type="text"
                    required
                    value={planForm.code}
                    onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. PRO_PLAN"
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Describe benefits of this plan..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.discountPrice}
                    onChange={(e) => setPlanForm({ ...planForm, discountPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Billing Cycle</label>
                  <select
                    value={planForm.billingCycle}
                    onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-Yearly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Validity Duration *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={planForm.duration}
                    onChange={(e) => setPlanForm({ ...planForm, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Duration Unit</label>
                  <select
                    value={planForm.durationUnit}
                    onChange={(e) => setPlanForm({ ...planForm, durationUnit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Features Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600">Dynamic Features</label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Feature
                  </button>
                </div>
                {planForm.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feat.name}
                      onChange={(e) => {
                        const updated = [...planForm.features];
                        updated[idx].name = e.target.value;
                        setPlanForm({ ...planForm, features: updated });
                      }}
                      placeholder="Feature name..."
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                    />
                    <label className="flex items-center gap-1 text-xs font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feat.included}
                        onChange={(e) => {
                          const updated = [...planForm.features];
                          updated[idx].included = e.target.checked;
                          setPlanForm({ ...planForm, features: updated });
                        }}
                        className="accent-indigo-600"
                      />
                      Included
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <RiCloseLine />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.isFeatured}
                    onChange={(e) => setPlanForm({ ...planForm, isFeatured: e.target.checked })}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  Featured Plan
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setPlanModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: MANUAL SUBSCRIPTION                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {manualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Assign Manual Subscription</h3>
              <button onClick={() => setManualModal(false)}><RiCloseLine className="w-6 h-6 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveManualSub} className="space-y-4">
              {/* User search select */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Student / User *</label>
                <input
                  type="text"
                  placeholder="Type student name/email to search..."
                  value={userSearchTerm}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                />
                {userOptions.length > 0 && (
                  <div className="max-h-36 overflow-y-auto border rounded-lg divide-y bg-slate-50">
                    {userOptions.map((u) => (
                      <div
                        key={u._id}
                        onClick={() => {
                          setManualForm({ ...manualForm, userId: u._id });
                          setUserSearchTerm(`${u.name} (${u.email})`);
                          setUserOptions([]);
                        }}
                        className="p-2 text-xs hover:bg-indigo-100 cursor-pointer font-medium"
                      >
                        {u.name} — <span className="text-slate-500">{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Plan *</label>
                <select
                  required
                  value={manualForm.planId}
                  onChange={(e) => {
                    const selPlan = plans.find(p => p._id === e.target.value);
                    setManualForm({
                      ...manualForm,
                      planId: e.target.value,
                      amount: selPlan?.price || 0
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ₹{p.price} ({p.duration} {p.durationUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={manualForm.startDate}
                    onChange={(e) => setManualForm({ ...manualForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setManualModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold"
                >
                  Assign Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: EXTEND SUBSCRIPTION                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {extendModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Extend Subscription Validity</h3>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Extend By Days</label>
              <input
                type="number"
                min={1}
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Reason for Extension</label>
              <input
                type="text"
                placeholder="e.g. Promotional extension by admin"
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t pt-3">
              <button onClick={() => setExtendModal(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold">
                Cancel
              </button>
              <button onClick={handleConfirmExtend} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: SUBSCRIBER DETAIL VIEW                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {subscriberDetailModal && selectedSubscriber?.data && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Subscriber Detail</h3>
                <span className="font-mono text-xs text-indigo-600">{selectedSubscriber.data.subscriptionId}</span>
              </div>
              <button onClick={() => setSubscriberDetailModal(false)}><RiCloseLine className="w-6 h-6 text-slate-400" /></button>
            </div>

            {/* User Details */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black text-lg flex items-center justify-center">
                {selectedSubscriber.data.userId?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="font-bold text-base text-slate-800 dark:text-white">{selectedSubscriber.data.userId?.name}</div>
                <div className="text-xs text-slate-400">{selectedSubscriber.data.userId?.email} · {selectedSubscriber.data.userId?.phone}</div>
              </div>
            </div>

            {/* Sub Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 border rounded-lg">
                <div className="text-slate-400 font-semibold">Plan Name</div>
                <div className="font-bold text-sm text-slate-800 dark:text-white">{selectedSubscriber.data.planId?.name}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-slate-400 font-semibold">Status</div>
                <div className="mt-1">{renderStatusBadge(selectedSubscriber.data.status)}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-slate-400 font-semibold">Start Date</div>
                <div className="font-bold text-slate-700">{new Date(selectedSubscriber.data.startDate).toLocaleDateString('en-IN')}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-slate-400 font-semibold">Expiry Date</div>
                <div className="font-bold text-rose-600">{new Date(selectedSubscriber.data.expiryDate).toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t pt-4 flex flex-wrap gap-2">
              {selectedSubscriber.data.status === 'active' && (
                <>
                  <button
                    onClick={() => handleSubscriberAction('suspend', selectedSubscriber.data._id)}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-semibold"
                  >
                    Suspend Subscription
                  </button>
                  <button
                    onClick={() => handleSubscriberAction('cancel', selectedSubscriber.data._id)}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-semibold"
                  >
                    Cancel Subscription
                  </button>
                </>
              )}
              {selectedSubscriber.data.status === 'suspended' && (
                <button
                  onClick={() => handleSubscriberAction('resume', selectedSubscriber.data._id)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-semibold"
                >
                  Resume Subscription
                </button>
              )}
              {selectedSubscriber.data.status === 'pending' && (
                <button
                  onClick={() => handleSubscriberAction('activate', selectedSubscriber.data._id)}
                  className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-xs font-semibold"
                >
                  Activate Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
