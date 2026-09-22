import * as React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminService } from '../../services/adminService';
import { AdminCentreItem } from '../../types/admin';
import { CentreOperatingStatus } from '../../types/database';
import { districtService } from '../../services/districtService';
import { District, IndianState } from '../../types';
import {
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Scale,
  Users,
  Edit2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export const AdminCentres: React.FC = () => {
  const { assignedState } = useAdminAuth();
  const currentState = assignedState || 'Bihar';

  const [centres, setCentres] = React.useState<AdminCentreItem[]>([]);
  const [districts, setDistricts] = React.useState<District[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [districtFilter, setDistrictFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Status editing modal state
  const [editingCentre, setEditingCentre] = React.useState<AdminCentreItem | null>(null);
  const [newStatus, setNewStatus] = React.useState<CentreOperatingStatus>('OPEN');
  const [isSaving, setIsSaving] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const loadCentres = async () => {
    setLoading(true);
    try {
      const [centresData, districtsData] = await Promise.all([
        adminService.getCentresByState(currentState),
        districtService.getDistrictsByState(currentState as IndianState),
      ]);

      setCentres(centresData);
      setDistricts(districtsData);
    } catch (err) {
      console.error('Failed to load centres or districts:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCentres();
  }, [currentState]);

  // Filtered list
  const filteredCentres = React.useMemo(() => {
    return centres.filter((c) => {
      if (districtFilter !== 'all' && c.district.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (statusFilter !== 'all' && c.operatingStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [centres, districtFilter, statusFilter, searchQuery]);

  // Quick KPI calculations from current state's centres
  const stats = React.useMemo(() => {
    const total = centres.length;
    let openCount = 0;
    let busyCount = 0;
    let lunchCount = 0;
    let closedCount = 0;

    centres.forEach((c) => {
      if (c.operatingStatus === 'OPEN') openCount++;
      else if (c.operatingStatus === 'BUSY') busyCount++;
      else if (c.operatingStatus === 'LUNCH_BREAK') lunchCount++;
      else closedCount++;
    });

    return { total, openCount, busyCount, lunchCount, closedCount };
  }, [centres]);

  const handleOpenStatusEdit = (centre: AdminCentreItem) => {
    setEditingCentre(centre);
    setNewStatus(centre.operatingStatus);
  };

  const handleSaveStatus = async () => {
    if (!editingCentre) return;
    setIsSaving(true);
    try {
      const ok = await adminService.updateCentreOperatingStatus(editingCentre.id, newStatus);
      if (ok) {
        setCentres((prev) =>
          prev.map((c) => (c.id === editingCentre.id ? { ...c, operatingStatus: newStatus } : c))
        );
        setToastMessage(`Centre "${editingCentre.name}" status updated to ${newStatus}.`);
        setEditingCentre(null);
      } else {
        alert('Failed to update centre status. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating centre status');
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Official APMC & Krishi Mandi Yard Directory
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Procurement Centres in {currentState}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            Displaying {centres.length} authorized state procurement yards, weighbridges, and intake depots strictly in {currentState} with real-time operational status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadCentres}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-neutral-800 text-xs font-semibold text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Centres</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Total Centres</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{currentState} mandis</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Open & Active</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.openCount}</div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Intake operational</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Busy / Queue</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.busyCount}</div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">High farmer intake</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Lunch Break</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.lunchCount}</div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">14:00 – 15:00 Break</div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wider">Closed / Maint.</div>
          <div className="text-xl font-bold text-slate-700 dark:text-neutral-300 mt-1">{stats.closedCount}</div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">Off-duty or inspection</div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search by centre name, code, district, or address in ${currentState}...`}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-neutral-800/70 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* District Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="admin-centres-district-filter"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option key="all" value="all">
                All Districts of {currentState} ({districts.length})
              </option>
              {districts.map((d) => (
                <option key={d.id || d.districtCode || d.districtName} value={d.districtName}>
                  {d.districtName}
                </option>
              ))}
            </select>
          </div>

          {/* Operating Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="BUSY">BUSY</option>
              <option value="LUNCH_BREAK">LUNCH_BREAK</option>
              <option value="CLOSED">CLOSED</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Centres List */}
      {loading ? (
        <div className="bg-white dark:bg-neutral-900 p-12 text-center rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Loading procurement centres for {currentState}...</span>
        </div>
      ) : filteredCentres.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 p-12 text-center rounded-xl border border-slate-200 dark:border-neutral-800 space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="font-semibold text-slate-800 dark:text-neutral-200 text-sm">
            No procurement centres found matching the selected filters.
          </p>
          <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
            Try clearing the search query or selecting "All Districts" to view all registered centres in {currentState}.
          </p>
          <button
            type="button"
            onClick={() => {
              setDistrictFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCentres.map((centre) => {
            const isLiveOpen = centre.operatingStatus === 'OPEN';
            const isBusy = centre.operatingStatus === 'BUSY';
            const isLunch = centre.operatingStatus === 'LUNCH_BREAK';

            return (
              <div
                key={centre.id}
                className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-neutral-700 transition"
              >
                <div className="space-y-2.5">
                  {/* Header: Name, Code, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{centre.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-700">
                          {centre.code}
                        </span>
                        {centre.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            Verified Yard
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${
                        isLiveOpen
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : isBusy
                          ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : isLunch
                          ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700'
                      }`}
                    >
                      {centre.operatingStatus}
                    </span>
                  </div>

                  {/* State & District Tag */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200/80 dark:border-emerald-800/60">
                      {centre.state}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-[11px] font-medium">
                      {centre.district} Dist.
                    </span>
                  </div>

                  {/* Location Info */}
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-neutral-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {centre.address}
                    </p>
                  </div>

                  {/* Operating Hours & Capacity */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] bg-slate-50 dark:bg-neutral-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-neutral-800">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{centre.openingTime ? centre.openingTime.slice(0, 5) : '09:00'} – {centre.closingTime ? centre.closingTime.slice(0, 5) : '18:00'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-300">
                      <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{centre.capacityPerDayQuintals} Qtl/day</span>
                    </div>
                    <div className="col-span-2 flex items-center justify-between text-slate-500 dark:text-neutral-400 pt-1 border-t border-slate-200/60 dark:border-neutral-700/60">
                      <span>Lunch Interval:</span>
                      <span className="font-medium text-slate-700 dark:text-neutral-300">
                        {centre.lunchStart ? centre.lunchStart.slice(0, 5) : '14:00'} – {centre.lunchEnd ? centre.lunchEnd.slice(0, 5) : '15:00'}
                      </span>
                    </div>
                  </div>

                  {centre.contactNumber && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">{centre.contactNumber}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-neutral-400">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Queue: <strong className="text-slate-800 dark:text-white">{centre.todayQueueCount}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenStatusEdit(centre)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 font-semibold text-xs transition cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    Change Status
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Edit Modal */}
      {editingCentre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Update Operating Status</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  {editingCentre.name} ({editingCentre.code}) • {editingCentre.state}
                </p>
              </div>
              <button
                onClick={() => setEditingCentre(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider block">
                Select Operating Mode:
              </label>
              {(['OPEN', 'BUSY', 'LUNCH_BREAK', 'CLOSED', 'MAINTENANCE'] as CentreOperatingStatus[]).map(
                (status) => (
                  <label
                    key={status}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-xs transition ${
                      newStatus === status
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          status === 'OPEN'
                            ? 'bg-emerald-500'
                            : status === 'BUSY'
                            ? 'bg-amber-500'
                            : status === 'LUNCH_BREAK'
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {status}
                    </span>
                    <input
                      type="radio"
                      name="centreStatus"
                      value={status}
                      checked={newStatus === status}
                      onChange={() => setNewStatus(status)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                )
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setEditingCentre(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveStatus}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {isSaving ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
