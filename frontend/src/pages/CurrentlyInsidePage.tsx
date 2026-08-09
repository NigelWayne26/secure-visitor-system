import React, { useState, useEffect } from 'react';
import { visitApi, parseApiError } from '../services/api';
import type { Visit } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const CurrentlyInsidePage: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCurrentlyInside = async () => {
    setLoading(true);
    try {
      const res = await visitApi.getCurrentlyInside();
      setVisits(res.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentlyInside();
  }, []);

  const handleCheckOut = async (visitId: number) => {
    setActionLoadingId(visitId);
    setError(null);
    setSuccess(null);

    try {
      await visitApi.checkOut(visitId);
      setSuccess('Visitor checked out successfully.');
      await loadCurrentlyInside();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Active Visitors On-Site</h2>
          <p className="text-sm text-slate-500">Live directory of currently checked-in personnel</p>
        </div>
        <Button variant="outline" onClick={loadCurrentlyInside}>
          🔄 Refresh
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">Visitor</th>
                <th className="p-4">ID Number</th>
                <th className="p-4">Host Employee</th>
                <th className="p-4">Purpose</th>
                <th className="p-4">Check-In Time</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400">
                    No active visitors inside the facility.
                  </td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-900">
                      {visit.visitor_detail?.full_name || `Visitor #${visit.visitor}`}
                    </td>
                    <td className="p-4">{visit.visitor_detail?.id_number || 'N/A'}</td>
                    <td className="p-4">
                      {visit.host_employee_detail?.full_name ||
                        `${visit.host_employee_detail?.first_name || ''} ${visit.host_employee_detail?.last_name || ''}`.trim() ||
                        visit.host_employee_detail?.email}
                    </td>
                    <td className="p-4">{visit.purpose}</td>
                    <td className="p-4">
                      {visit.check_in_time ? new Date(visit.check_in_time).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      <Badge status={visit.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={actionLoadingId === visit.id}
                        onClick={() => handleCheckOut(visit.id)}
                      >
                        Check Out
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};