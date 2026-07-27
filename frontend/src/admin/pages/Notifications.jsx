import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { RiSendPlaneLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Notifications() {
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { title: '', message: '', type: 'in_app', targetType: 'all' }
  });

  const onSubmit = async (values) => {
    setSending(true);
    try {
      const { data } = await api.post('/notifications', values);
      toast.success(data.message);
      reset();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send Notification</h2>
        <p className="text-sm text-slate-500 mt-0.5">Broadcast messages to students</p>
      </div>

      <div className="admin-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="admin-label">Notification Title *</label>
            <input {...register('title', { required: 'Title required' })} className="admin-input" placeholder="e.g. New Mock Test Available!" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="admin-label">Message *</label>
            <textarea {...register('message', { required: 'Message required' })} rows={4} className="admin-input resize-none" placeholder="Notification message..." />
            {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Type</label>
              <select {...register('type')} className="admin-input">
                <option value="in_app">In-App</option>
                <option value="push">Push Notification</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label className="admin-label">Target</label>
              <select {...register('targetType')} className="admin-input">
                <option value="all">All Students</option>
                <option value="selected">Selected Students</option>
                <option value="by_subject">By Subject Purchase</option>
              </select>
            </div>
          </div>
          <div>
            <label className="admin-label">Action URL (optional)</label>
            <input {...register('actionUrl')} className="admin-input" placeholder="https://..." />
          </div>
          <button type="submit" disabled={sending} className="admin-btn-primary w-full justify-center py-3">
            <RiSendPlaneLine className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>
    </div>
  );
}
