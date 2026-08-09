import React, { useState, useEffect } from 'react';
import type { Visitor, CreateVisitorDTO } from '../types';
import { visitorApi, parseApiError } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const VisitorsPage: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);

  const [formData, setFormData] = useState<CreateVisitorDTO>({
    full_name: '',
    id_number: '',
    phone: '',
    email: '',
  });

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const response = await visitorApi.getVisitors();
      setVisitors(response.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await visitorApi.createVisitor(formData);
      setSuccess('Visitor registered successfully.');
      setIsAddModalOpen(false);
      setFormData({ full_name: '', id_number: '', phone: '', email: '' });
      loadVisitors();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisitor) return;

    try {
      await visitorApi.updateVisitor(editingVisitor.id, formData);
      setSuccess('Visitor updated successfully.');
      setEditingVisitor(null);
      loadVisitors();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this visitor?')) return;

    try {
      await visitorApi.deleteVisitor(id);
      setSuccess('Visitor deleted.');
      loadVisitors();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const openEdit = (visitor: Visitor) => {
    setEditingVisitor(visitor);
    setFormData({
      full_name: visitor.full_name,
      id_number: visitor.id_number,
      phone: visitor.phone,
      email: visitor.email,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Visitor Directory</h2>
          <p className="text-sm text-slate-500">Manage registered visitors and identity credentials</p>
        </div>
        <Button
          onClick={() => {
            setFormData({ full_name: '', id_number: '', phone: '', email: '' });
            setIsAddModalOpen(true);
          }}
        >
          + Add Visitor
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
                <th className="p-4">Full Name</th>
                <th className="p-4">ID Number</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    No visitors found.
                  </td>
                </tr>
              ) : (
                visitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-900">{visitor.full_name}</td>
                    <td className="p-4">{visitor.id_number}</td>
                    <td className="p-4">{visitor.phone}</td>
                    <td className="p-4">{visitor.email}</td>
                    <td className="p-4 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(visitor)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(visitor.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Visitor Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Visitor">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          <Input
            label="ID / Passport Number"
            required
            value={formData.id_number}
            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
          />
          <Input
            label="Phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Visitor</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Visitor Modal */}
      <Modal isOpen={!!editingVisitor} onClose={() => setEditingVisitor(null)} title="Edit Visitor">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          <Input
            label="ID / Passport Number"
            required
            value={formData.id_number}
            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
          />
          <Input
            label="Phone"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" type="button" onClick={() => setEditingVisitor(null)}>
              Cancel
            </Button>
            <Button type="submit">Update Visitor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};