import React, { useState, useEffect } from 'react';
import { dashboardApi, parseApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type {
  AdminDashboardSummary,
  ReceptionistDashboardSummary,
  SecurityOfficerDashboardSummary,
  EmployeeDashboardSummary,
} from '../types';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardApi.getSummary();
        setData(res.data);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Welcome back, {user?.first_name || user?.username}
        </h2>
        <p className="text-sm text-slate-500">
          {user?.role === 'admin' && 'Administrator Security & Operations Overview'}
          {user?.role === 'receptionist' && 'Receptionist Daily Visitor Overview'}
          {user?.role === 'security_officer' && 'Security Gate Access & Entry Monitoring'}
          {user?.role === 'employee' && 'Host Employee Visitor Portal'}
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Admin Dashboard */}
      {user?.role === 'admin' && data && (
        <AdminDashboard summary={data as AdminDashboardSummary} />
      )}

      {/* Receptionist Dashboard */}
      {user?.role === 'receptionist' && data && (
        <ReceptionistDashboard summary={data as ReceptionistDashboardSummary} />
      )}

      {/* Security Officer Dashboard */}
      {user?.role === 'security_officer' && data && (
        <SecurityOfficerDashboard summary={data as SecurityOfficerDashboardSummary} />
      )}

      {/* Employee Dashboard */}
      {user?.role === 'employee' && data && (
        <EmployeeDashboard summary={data as EmployeeDashboardSummary} />
      )}
    </div>
  );
};

/* --- Role Specific Sub-Dashboards --- */

const StatCard: React.FC<{ label: string; value: number | string; icon: string }> = ({
  label,
  value,
  icon,
}) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
    <span className="text-3xl">{icon}</span>
  </div>
);

const AdminDashboard: React.FC<{ summary: AdminDashboardSummary }> = ({ summary }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard label="Total Visitors" value={summary.total_visitors ?? 0} icon="👤" />
    <StatCard label="Today's Visits" value={summary.todays_visits ?? 0} icon="📅" />
    <StatCard label="Active Visitors" value={summary.active_visitors ?? 0} icon="🚪" />
    <StatCard label="Completed Visits" value={summary.completed_visits ?? 0} icon="✅" />
  </div>
);

const ReceptionistDashboard: React.FC<{ summary: ReceptionistDashboardSummary }> = ({
  summary,
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Today's Total Visits" value={summary.todays_visits?.length ?? 0} icon="📅" />
      <StatCard label="Active Visits On-Site" value={summary.active_visits_count ?? 0} icon="🚪" />
      <StatCard label="Recent Visitors" value={summary.recent_visitors?.length ?? 0} icon="👥" />
    </div>

    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5">
      <h3 className="font-bold text-slate-800 text-base mb-3">Today's Visits</h3>
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
          <tr>
            <th className="p-3">Visitor</th>
            <th className="p-3">Host Employee</th>
            <th className="p-3">Purpose</th>
            <th className="p-3">Time</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {summary.todays_visits?.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-3 text-center text-slate-400">
                No visits scheduled for today.
              </td>
            </tr>
          ) : (
            summary.todays_visits?.map((v) => (
              <tr key={v.id}>
                <td className="p-3 font-medium text-slate-900">{v.visitor_detail?.full_name}</td>
                <td className="p-3">
                  {v.host_employee_detail?.full_name || v.host_employee_detail?.email}
                </td>
                <td className="p-3">{v.purpose}</td>
                <td className="p-3">{v.expected_time}</td>
                <td className="p-3">
                  <Badge status={v.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const SecurityOfficerDashboard: React.FC<{ summary: SecurityOfficerDashboardSummary }> = ({
  summary,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard label="Currently Inside" value={summary.currently_inside_count ?? 0} icon="🚪" />
    <StatCard label="Today's Check-Ins" value={summary.todays_checkins_count ?? 0} icon="📥" />
    <StatCard label="Today's Check-Outs" value={summary.todays_checkouts_count ?? 0} icon="📤" />
    <StatCard label="Pending Verifications" value={summary.pending_verification_count ?? 0} icon="🛡️" />
  </div>
);

const EmployeeDashboard: React.FC<{ summary: EmployeeDashboardSummary }> = ({ summary }) => (
  <div className="space-y-6">
    {summary.detail && <Alert type="info" message={summary.detail} />}

    {summary.profile && (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-800 text-base mb-1">Employee Profile</h3>
        <p className="text-sm text-slate-600">
          <strong>Name:</strong> {summary.profile.full_name || `${summary.profile.first_name || ''} ${summary.profile.last_name || ''}`.trim()}
        </p>
        <p className="text-sm text-slate-600">
          <strong>Email:</strong> {summary.profile.email}
        </p>
        {summary.profile.department && (
          <p className="text-sm text-slate-600">
            <strong>Department:</strong> {summary.profile.department}
          </p>
        )}
      </div>
    )}

    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5">
      <h3 className="font-bold text-slate-800 text-base mb-3">Your Scheduled Visitors</h3>
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
          <tr>
            <th className="p-3">Visitor</th>
            <th className="p-3">Purpose</th>
            <th className="p-3">Expected Date & Time</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {!summary.their_visitors || summary.their_visitors.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-3 text-center text-slate-400">
                You have no visitor appointments assigned.
              </td>
            </tr>
          ) : (
            summary.their_visitors.map((v) => (
              <tr key={v.id}>
                <td className="p-3 font-medium text-slate-900">{v.visitor_detail?.full_name}</td>
                <td className="p-3">{v.purpose}</td>
                <td className="p-3">
                  {v.expected_date} at {v.expected_time}
                </td>
                <td className="p-3">
                  <Badge status={v.status} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);