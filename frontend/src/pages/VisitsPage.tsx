import React, { useState, useEffect } from 'react';
import { visitApi, visitorApi, employeeApi, passApi, parseApiError } from '../services/api';
import type { Visit, Visitor, Employee, CreateVisitDTO } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { QRCodeModal } from '../components/ui/QRCodeModal';

export const VisitsPage: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [passLoadingId, setPassLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [qrVisit, setQrVisit] = useState<Visit | null>(null);

  const [formData, setFormData] = useState<CreateVisitDTO>({
    visitor: 0,
    host_employee: 0,
    purpose: '',
    expected_date: new Date().toISOString().split('T')[0],
    expected_time: '10:00:00',
    is_group_visit: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [visitsRes, visitorsRes, employeesRes] = await Promise.all([
        visitApi.getVisits(),
        visitorApi.getVisitors(),
        employeeApi.getEmployees(),
      ]);
      setVisits(visitsRes.data);
      setVisitors(visitorsRes.data);
      setEmployees(employeesRes.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      visitor: visitors[0]?.id || 0,
      host_employee: employees[0]?.id || 0,
      purpose: '',
      expected_date: new Date().toISOString().split('T')[0],
      expected_time: '10:00:00',
      is_group_visit: false,
    });
    setTimeError(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setError(null);
    setIsScheduleModalOpen(true);
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTimeError(null);

    const visitorId = Number(formData.visitor) || visitors[0]?.id;
    const hostId = Number(formData.host_employee) || employees[0]?.id;

    if (!visitorId || !hostId) {
      setError('Please select both a visitor and a host employee.');
      return;
    }

    setCreateLoading(true);
    try {
      await visitApi.createVisit({
        ...formData,
        visitor: visitorId,
        host_employee: hostId,
        is_group_visit: !!formData.is_group_visit,
      });
      setSuccess('Visit scheduled successfully.');
      setIsScheduleModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      if (err.response?.data?.expected_time) {
        const msg = Array.isArray(err.response.data.expected_time)
          ? err.response.data.expected_time.join(' ')
          : err.response.data.expected_time;
        setTimeError(msg);
      } else {
        setError(parseApiError(err));
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleGeneratePass = async (visitId: number) => {
    setPassLoadingId(visitId);
    setError(null);
    try {
      await passApi.generatePass(visitId);
      setSuccess('Visitor pass generated successfully.');
      await loadData();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setPassLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Visit Management</h2>
          <p className="text-sm text-slate-500">Schedule appointments and generate visitor QR passes</p>
        </div>
        <Button onClick={handleOpenModal}>+ Schedule Visit</Button>
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
                <th className="p-4">Host Employee</th>
                <th className="p-4">Purpose</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status</th>
                <th className="p-4">Pass</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-400">
                    No scheduled visits found.
                  </td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-900">
                      {visit.visitor_detail?.full_name || `Visitor #${visit.visitor}`}
                    </td>
                    <td className="p-4">
                      {visit.host_employee_detail?.full_name ||
                        `${visit.host_employee_detail?.first_name || ''} ${visit.host_employee_detail?.last_name || ''}`.trim() ||
                        `Employee #${visit.host_employee}`}
                    </td>
                    <td className="p-4">{visit.purpose}</td>
                    <td className="p-4">
                      {visit.expected_date} at {visit.expected_time}
                    </td>
                    <td className="p-4">
                      <Badge status={visit.status} />
                    </td>
                    <td className="p-4">
                      {visit.has_pass ? (
                        <Button variant="secondary" size="sm" onClick={() => setQrVisit(visit)}>
                          View QR Pass
                        </Button>
                      ) : visit.status === 'scheduled' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={passLoadingId === visit.id}
                          onClick={() => handleGeneratePass(visit.id)}
                        >
                          Generate Pass
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedVisit(visit)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Schedule Visit */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Schedule New Visit">
        <form onSubmit={handleCreateVisit} className="space-y-4">
          <Select
            label="Select Visitor"
            required
            options={visitors.map((v) => ({
              value: v.id,
              label: `${v.full_name} (${v.phone || v.email || v.id_number || 'No contact'})`,
            }))}
            value={formData.visitor}
            onChange={(e) => {
              setFormData({ ...formData, visitor: Number(e.target.value) });
              setTimeError(null);
            }}
          />
          <Select
            label="Select Host Employee"
            required
            options={employees.map((e) => ({
              value: e.id,
              label: e.full_name || `${e.first_name || ''} ${e.last_name || ''} (${e.email})`.trim(),
            }))}
            value={formData.host_employee}
            onChange={(e) => {
              setFormData({ ...formData, host_employee: Number(e.target.value) });
              setTimeError(null);
            }}
          />
          <Input
            label="Purpose of Visit"
            required
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expected Date"
              type="date"
              required
              value={formData.expected_date}
              onChange={(e) => {
                setFormData({ ...formData, expected_date: e.target.value });
                setTimeError(null);
              }}
            />
            <Input
              label="Expected Time"
              type="time"
              step="1"
              required
              value={formData.expected_time}
              onChange={(e) => {
                setFormData({ ...formData, expected_time: e.target.value });
                setTimeError(null);
              }}
            />
          </div>

          {/* Time collision warning display */}
          {timeError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed font-medium">
              ⚠️ {timeError}
            </div>
          )}

          {/* Group Visit Checkbox */}
          <div className="flex items-center gap-2 mt-2 pt-1">
            <input
              type="checkbox"
              id="is_group_visit"
              checked={!!formData.is_group_visit}
              onChange={(e) => setFormData({ ...formData, is_group_visit: e.target.checked })}
              className="h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900 cursor-pointer"
            />
            <label htmlFor="is_group_visit" className="text-sm text-slate-700 cursor-pointer select-none">
              Group visit (multiple visitors seeing this host together)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createLoading}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Visit Details (Read-Only) */}
      <Modal isOpen={!!selectedVisit} onClose={() => setSelectedVisit(null)} title="Visit Details">
        {selectedVisit && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-500">Status</span>
              <Badge status={selectedVisit.status} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">Visitor Information</h4>
              <p className="text-slate-600">Name: {selectedVisit.visitor_detail?.full_name}</p>
              <p className="text-slate-600">ID Number: {selectedVisit.visitor_detail?.id_number}</p>
              <p className="text-slate-600">Phone: {selectedVisit.visitor_detail?.phone}</p>
              <p className="text-slate-600">Email: {selectedVisit.visitor_detail?.email}</p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-1">Host Information</h4>
              <p className="text-slate-600">
                Host: {selectedVisit.host_employee_detail?.full_name || selectedVisit.host_employee_detail?.email}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-1">Schedule & Purpose</h4>
              <p className="text-slate-600">Purpose: {selectedVisit.purpose}</p>
              <p className="text-slate-600">
                Appointment: {selectedVisit.expected_date} at {selectedVisit.expected_time}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              {selectedVisit.has_pass && (
                <Button variant="secondary" onClick={() => setQrVisit(selectedVisit)}>
                  View QR Pass
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedVisit(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: QR Code Display */}
      <QRCodeModal isOpen={!!qrVisit} onClose={() => setQrVisit(null)} visit={qrVisit} />
    </div>
  );
};