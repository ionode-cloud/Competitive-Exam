export default function SubscriptionsManager() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Subscriptions</h3>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">No subscription content available.</p>
    </div>
  );
}
