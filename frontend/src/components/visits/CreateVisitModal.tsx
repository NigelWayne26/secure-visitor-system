import React, { useState } from 'react';
import { visitApi, parseApiError } from '../../services/api';
import type { Visitor, Employee, CreateVisitDTO } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface CreateVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  visitors: Visitor[];
  employees: Employee[];
}

export const CreateVisitModal: React.FC<CreateVisitModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  visitors,
  employees,
}) => {
  const [formData, setFormData] = useState<CreateVisitDTO>({
    visitor: visitors[0]?.id || 0,
    host_employee: employees[0]?.id || 0,
    purpose: '',
    expected_date: new Date().toISOString().split('T')[0],
    expected_time: '09:00',
    is_group_visit: false,
  });

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      visitor: visitors[0]?.id || 0,
      host_employee: employees[0]?.id || 0,
      purpose: '',
      expected_date: new Date().toISOString().split('T')[0],
      expected_time: '09:00',
      is_group_visit: false,
    });
    setGeneralError(null);
    setTimeError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'expected_time' || name === 'expected_date') {
      setTimeError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);
    setTimeError(null);

    // Payload explicitly including is_group_visit
    const payload: CreateVisitDTO = {
      visitor: Number(formData.visitor),
      host_employee: Number(formData.host_employee),
      purpose: formData.purpose,
      expected_date: formData.expected_date,
      expected_time: formData.expected_time,
      is_group_visit: !!formData.is_group_visit,
    };

    try {
      await visitApi.createVisit(payload);
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.data?.expected_time) {
        const timeErr = Array.isArray(err.response.data.expected_time)
          ? err.response.data.expected_time.join(' ')
          : err.response.data.expected_time;
        setTimeError(timeErr);
      } else {
        setGeneralError(parseApiError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Schedule New Visit">
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <Alert type="error" message={generalError} onClose={() => setGeneralError(null)} />
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Visitor
          </label>
          <select
            name="visitor"
            value={formData.visitor}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            required
          >
            {visitors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.full_name} ({v.phone || v.email || 'No contact'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Host Employee
          </label>
          <select
            name="host_employee"
            value={formData.host_employee}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            required
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()} —{' '}
                {emp.department || 'General'}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Purpose of Visit"
          name="purpose"
          placeholder="e.g. Project Quarterly Review"
          value={formData.purpose}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Expected Date"
            type="date"
            name="expected_date"
            value={formData.expected_date}
            onChange={handleChange}
            required
          />
          <Input
            label="Expected Time"
            type="time"
            name="expected_time"
            value={formData.expected_time}
            onChange={handleChange}
            required
          />
        </div>

        {/* Display scheduling conflict error message near date/time inputs */}
        {timeError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed font-medium">
            ⚠️ {timeError}
          </div>
        )}

        {/* Group Visit Checkbox explicitly rendered in JSX */}
        <div className="flex items-center gap-2 mt-2 pt-1">
          <input
            type="checkbox"
            id="is_group_visit"
            checked={!!formData.is_group_visit}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, is_group_visit: e.target.checked }))
            }
            className="h-4 w-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
          />
          <label htmlFor="is_group_visit" className="text-sm text-slate-700 cursor-pointer">
            Group visit (multiple visitors seeing this host together)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Schedule Visit
          </Button>
        </div>
      </form>
    </Modal>
  );
};