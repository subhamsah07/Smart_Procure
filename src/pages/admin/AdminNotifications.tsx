import * as React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminNotificationItem } from '../../types/admin';
import {
  Bell,
  RefreshCw,
  Clock,
  AlertTriangle,
  Info,
  CreditCard,
  ClipboardList,
  Mail,
  ShieldCheck,
} from 'lucide-react';

export const AdminNotifications: React.FC = () => {
  const { assignedState } = useAdminAuth();
  const [notifications, setNotifications] = React.useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadNotifications = async () => {
    if (!assignedState) return;
    setLoading(true);
    try {
      const data = await adminService.getNotificationsByState(assignedState);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadNotifications();
  }, [assignedState]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delay':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'queue':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'booking':
        return <ClipboardList className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Operational Dispatch Telemetry
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Operational Notifications ({assignedState})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            System advisories, delay notices, and queue alerts dispatched to farmers in {assignedState}.
          </p>
        </div>

        <button
          onClick={loadNotifications}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Scope Note */}
      <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl text-xs text-blue-800 flex items-start gap-3">
        <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Notification Channel Architecture:</strong> All in-app queue advisories, weighbridge delays, and slot assignments are logged in <code className="font-mono text-blue-950 font-semibold">public.notifications</code> for real-time delivery. External SMTP email transport is intentionally reserved for subsequent infrastructure integration.
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading notifications from Supabase...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No operational notifications logged yet for {assignedState}.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 hover:bg-slate-50/80 transition flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getTypeIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>

                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span className="uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {n.type}
                    </span>
                    {n.token && <span className="font-mono font-bold text-emerald-700">Token: {n.token}</span>}
                    {n.farmerName && <span>Farmer: {n.farmerName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
