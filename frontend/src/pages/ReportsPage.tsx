import React, { useState, useEffect } from 'react';
import { reportApi, parseApiError } from '../services/api';
import type { ReportPeriod, VisitReportResponse } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [report, setReport] = useState<VisitReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (selectedPeriod: ReportPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportApi.getVisitReport(selectedPeriod);
      setReport(res.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Visit Analytics & Reports</h2>
          <p className="text-sm text-slate-500">
            Generate and export structured access audit logs across time periods
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <Button
            variant={period === 'daily' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setPeriod('daily')}
          >
            Daily
          </Button>
          <Button
            variant={period === 'weekly' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </Button>
          <Button
            variant={period === 'monthly' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner />
      ) : report ? (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-500 flex justify-between items-center">
            <span>
              <strong>Period Range:</strong> {report.start_date} to {report.end_date}
            </span>
            <span className="uppercase font-bold tracking-wider text-slate-700">
              {report.period} Report
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-500">Total Visits</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{report.total_visits}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <p className="text-xs font-semibold text-blue-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{report.scheduled}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <p className="text-xs font-semibold text-emerald-600">Checked In</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{report.checked_in}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-600">Checked Out</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{report.checked_out}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <p className="text-xs font-semibold text-rose-600">Cancelled</p>
              <p className="text-2xl font-bold text-rose-900 mt-1">{report.cancelled}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4">Visitor</th>
                  <th className="p-4">Host Employee</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Expected Date</th>
                  <th className="p-4">Check-In</th>
                  <th className="p-4">Check-Out</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.visits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      No visit records found for this period.
                    </td>
                  </tr>
                ) : (
                  report.visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">
                        {v.visitor_detail?.full_name || `Visitor #${v.visitor}`}
                      </td>
                      <td className="p-4">
                        {v.host_employee_detail?.full_name || v.host_employee_detail?.email}
                      </td>
                      <td className="p-4">{v.purpose}</td>
                      <td className="p-4">{v.expected_date}</td>
                      <td className="p-4">
                        {v.check_in_time ? new Date(v.check_in_time).toLocaleTimeString() : '—'}
                      </td>
                      <td className="p-4">
                        {v.check_out_time ? new Date(v.check_out_time).toLocaleTimeString() : '—'}
                      </td>
                      <td className="p-4">
                        <Badge status={v.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};