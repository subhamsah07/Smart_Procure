import * as React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminPaymentItem } from '../../types/admin';
import { PaymentStatus } from '../../types/database';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  Calendar,
  Edit3,
  X,
  Check,
} from 'lucide-react';

export const AdminPayments: React.FC = () => {
  const { assignedState } = useAdminAuth();
  const [payments, setPayments] = React.useState<AdminPaymentItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Update Payment Modal State
  const [selectedPayment, setSelectedPayment] = React.useState<AdminPaymentItem | null>(null);
  const [modalStatus, setModalStatus] = React.useState<PaymentStatus>('processing');
  const [modalUtr, setModalUtr] = React.useState('');
  const [savingPayment, setSavingPayment] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = React.useState<string | null>(null);

  const loadPayments = async () => {
    if (!assignedState) return;
    setLoading(true);
    try {
      const data = await adminService.getPaymentsByState(assignedState);
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadPayments();
  }, [assignedState]);

  const openUpdateModal = (p: AdminPaymentItem) => {
    setSelectedPayment(p);
    setModalStatus(p.paymentStatus || 'pending');
    setModalUtr(p.paymentReference || '');
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const closeUpdateModal = () => {
    setSelectedPayment(null);
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleSavePaymentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !assignedState) return;

    setSavingPayment(true);
    setUpdateError(null);
    try {
      const res = await adminService.updatePaymentStatus({
        paymentId: selectedPayment.id,
        status: modalStatus,
        paymentReference: modalUtr.trim() || undefined,
        adminState: assignedState,
      });

      if (!res.success) {
        setUpdateError(res.error || 'Failed to update payment status.');
      } else {
        setUpdateSuccess('Payment status updated successfully.');
        await loadPayments();
        setTimeout(() => {
          closeUpdateModal();
        }, 800);
      }
    } catch (err: any) {
      setUpdateError(err.message || 'An error occurred.');
    } finally {
      setSavingPayment(false);
    }
  };

  const filteredPayments = React.useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.paymentStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.farmerName.toLowerCase().includes(q) ||
          p.token.toLowerCase().includes(q) ||
          (p.centreName && p.centreName.toLowerCase().includes(q)) ||
          (p.paymentReference && p.paymentReference.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [payments, statusFilter, searchQuery]);

  const totalDisbursed = React.useMemo(() => {
    return filteredPayments
      .filter((p) => p.paymentStatus === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Direct Benefit Transfer (DBT) Tracker
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Procurement Payments ({assignedState})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Auditable MSP disbursement ledger and bank transfer reconciliation for {assignedState}.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Disbursed (Completed)
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-1">
            <span>₹{totalDisbursed.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Transferred directly to farmer bank accounts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pending / In-Transit
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {payments.filter((p) => p.paymentStatus === 'pending' || p.paymentStatus === 'processing').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Batches awaiting bank gateway ACK</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Invoices Registered
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">{payments.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Total procurement intake transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by token, farmer, reference..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Payment Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading payment ledger from Supabase...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No payment records found for {assignedState}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Booking Token</th>
                  <th className="py-3 px-4">Farmer Details</th>
                  <th className="py-3 px-4">Centre & Crop</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">UTR Reference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-emerald-700">{p.token}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{p.farmerName}</div>
                      {p.farmerMobile && (
                        <div className="text-[11px] text-slate-400 font-mono">{p.farmerMobile}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {p.cropName} <span className="text-slate-400 font-normal">({p.quantityQuintals} Qtl)</span>
                      </div>
                      {p.centreName && (
                        <div className="text-[11px] text-slate-400">{p.centreName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {p.paymentReference || <span className="text-slate-400 italic">Pending UTR</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          p.paymentStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.paymentStatus === 'processing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : p.paymentStatus === 'failed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openUpdateModal(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>Update Status</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Payment Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Update Payment Status</h3>
                  <p className="text-xs text-slate-500">
                    Token: <span className="font-mono font-bold text-emerald-700">{selectedPayment.token}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeUpdateModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Summary Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Farmer:</span>
                <span className="font-semibold text-slate-900">{selectedPayment.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Crop & Intake:</span>
                <span className="font-medium text-slate-800">{selectedPayment.cropName} ({selectedPayment.quantityQuintals} Quintals)</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5">
                <span className="text-slate-500 font-semibold">Disbursement Amount:</span>
                <span className="font-bold text-emerald-700 text-sm">₹{selectedPayment.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {updateError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{updateError}</span>
              </div>
            )}

            {updateSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{updateSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSavePaymentStatus} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Payment Status:
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing (In Bank Gateway)</option>
                  <option value="completed">Completed (DBT Disbursed)</option>
                  <option value="failed">Failed (Bank Rejected)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bank Reference / UTR Number:
                </label>
                <input
                  type="text"
                  value={modalUtr}
                  onChange={(e) => setModalUtr(e.target.value)}
                  placeholder="e.g. UTR12849204821 or SBIN00294104"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Official bank reconciliation UTR reference code shared with the farmer.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {savingPayment ? 'Updating DBT State...' : 'Save & Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
