import * as React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { cropService } from '../../services/cropService';
import { AdminCropPriceItem } from '../../types/admin';
import { supabase } from '../../lib/supabase';
import {
  Coins,
  RefreshCw,
  Plus,
  Edit2,
  Check,
  X,
  IndianRupee,
  Calendar,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const AdminCropPrices: React.FC = () => {
  const { assignedState } = useAdminAuth();
  const [cropPrices, setCropPrices] = React.useState<AdminCropPriceItem[]>([]);
  const [allCrops, setAllCrops] = React.useState<{ id: string; name: string; hindiName: string | null }[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Edit/Add modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedCropId, setSelectedCropId] = React.useState('');
  const [rateInput, setRateInput] = React.useState<number | ''>('');
  const [effectiveDate, setEffectiveDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadData = async () => {
    if (!assignedState) return;
    setLoading(true);
    try {
      const [prices, cropsList] = await Promise.all([
        adminService.getCropPricesByState(assignedState),
        cropService.getCrops(),
      ]);
      setCropPrices(prices);
      const mapped = cropsList.map((c) => ({ id: c.id, name: c.name, hindiName: c.hindiName }));
      setAllCrops(mapped);
      if (mapped.length > 0 && !selectedCropId) {
        setSelectedCropId(mapped[0].id);
      }
    } catch (err) {
      console.error('Failed to load crop prices:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [assignedState]);

  const handleOpenEdit = (cp?: AdminCropPriceItem) => {
    if (cp) {
      setSelectedCropId(cp.cropId);
      setRateInput(cp.rate);
      setEffectiveDate(cp.effectiveFrom);
    } else {
      if (allCrops.length > 0) setSelectedCropId(allCrops[0].id);
      setRateInput('');
      setEffectiveDate(new Date().toISOString().split('T')[0]);
    }
    setModalOpen(true);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedState || !selectedCropId || !rateInput) return;

    setIsSaving(true);
    const result = await adminService.updateCropPrice({
      cropId: selectedCropId,
      state: assignedState,
      rate: Number(rateInput),
      effectiveFrom: effectiveDate,
    });
    setIsSaving(false);

    if (result.success) {
      setModalOpen(false);
      setToastMessage(`Updated MSP rate for ${assignedState} successfully.`);
      loadData();
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      alert(`Error updating crop price: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Statutory MSP Rates
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Crop Procurement Prices ({assignedState})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Minimum Support Price schedule enforced at procurement yards across {assignedState}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenEdit()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-500 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Update / Add Rate</span>
          </button>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pricing Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading MSP rates from Supabase...</div>
        ) : cropPrices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No crop price records configured for {assignedState}. Click "Update / Add Rate" to configure MSP rates.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4">State Scope</th>
                  <th className="py-3 px-4">Statutory Rate (₹)</th>
                  <th className="py-3 px-4">Standard Unit</th>
                  <th className="py-3 px-4">Effective From</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cropPrices.map((cp) => (
                  <tr key={cp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{cp.cropName}</div>
                      {cp.hindiName && <div className="text-[11px] text-slate-400">{cp.hindiName}</div>}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold text-emerald-700">{cp.state}</span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      ₹{cp.rate.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">Per {cp.unit}</td>

                    <td className="py-3.5 px-4 text-slate-600">{cp.effectiveFrom}</td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {cp.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(cp)}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal to Update/Add MSP Rate */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Configure Crop MSP Rate</h3>
                <p className="text-xs text-slate-500">Authorized State Scope: {assignedState}</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Select Agricultural Commodity
                </label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {allCrops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.hindiName ? `(${c.hindiName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  MSP Rate (₹ per Quintal)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 2425"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Effective From Date
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Publish Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
