import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  Settings,
  ShieldCheck,
  User,
  Mail,
  MapPin,
  Lock,
  LogOut,
  CheckCircle2,
  Database,
  FileCode,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { admin, assignedState, stateCode, adminSignOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await adminSignOut();
    navigate('/admin/login');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          Administrative Security Profile
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">State Admin Profile & Credentials</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Government credentials and cryptographic state boundary enforcement settings.
        </p>
      </div>

      {/* Profile Particulars */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          Officer Credentials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Officer Full Name
            </span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">
              {admin?.adminName || 'State Government Officer'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Official Email
            </span>
            <span className="text-sm font-mono text-slate-900 mt-1 block truncate">
              {admin?.email || 'N/A'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Assigned State Jurisdiction
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-emerald-700">{assignedState}</span>
              {stateCode && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-semibold">
                  {stateCode}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Account Status
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ACTIVE & AUTHORIZED</span>
            </div>
          </div>
        </div>

        {/* Database Record Details */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between py-1 text-slate-500">
            <span>State Admin Record ID:</span>
            <span className="font-mono text-slate-800">{admin?.id || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-1 text-slate-500">
            <span>Supabase Auth User UUID:</span>
            <span className="font-mono text-slate-800">{admin?.authUserId || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Security & RLS Isolation Guarantee */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-6 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <span>Statutory Data Isolation Notice</span>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          Administrative authority is bound to <strong>{assignedState}</strong> by PostgreSQL Row Level Security in <code className="font-mono font-bold text-emerald-950">public.state_admins</code>. Your session token only permits queries on centres, bookings, queue events, crop prices, and payments belonging to {assignedState}. State assignment cannot be altered from client-side controls.
        </p>
      </div>

      {/* Danger / Session Exit */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Sign Out of State Portal</h4>
          <p className="text-xs text-slate-500">Terminate active administrative session tokens.</p>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
