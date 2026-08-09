import React, { useState, useEffect } from 'react';
import { employeeApi, parseApiError } from '../services/api';
import type { Employee, CreateEmployeeDTO } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form & Selection States
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<CreateEmployeeDTO>({
    full_name: '',
    department: '',
    position: '',
    email: '',
    phone: '',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await employeeApi.getEmployees();
      setEmployees(res.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      department: '',
      position: '',
      email: '',
      phone: '',
    });
    setSelectedEmployee(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      full_name:
        employee.full_name ||
        `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
      department: employee.department || '',
      position: employee.position || '',
      email: employee.email || '',
      phone: employee.phone || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await employeeApi.createEmployee(formData);
      setSuccess('Employee created successfully.');
      setIsCreateModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await employeeApi.updateEmployee(selectedEmployee.id, formData);
      setSuccess('Employee record updated successfully.');
      setIsEditModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await employeeApi.deleteEmployee(selectedEmployee.id);
      setSuccess('Employee deleted successfully.');
      setIsDeleteModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const name = (
      emp.full_name ||
      `${emp.first_name || ''} ${emp.last_name || ''}`
    ).toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const pos = (emp.position || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return (
      name.includes(query) ||
      dept.includes(query) ||
      pos.includes(query) ||
      email.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employee Management</h2>
          <p className="text-sm text-slate-500">
            Admin access portal — manage internal staff members and hosts
          </p>
        </div>
        <Button onClick={openCreateModal}>+ Add Employee</Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <Input
          placeholder="Search by name, department, position, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
              <tr>
                <th className="p-4">Full Name</th>
                <th className="p-4">Department</th>
                <th className="p-4">Position</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    No employee records found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-900">
                      {emp.full_name ||
                        `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
                        `Employee #${emp.id}`}
                    </td>
                    <td className="p-4">{emp.department || '—'}</td>
                    <td className="p-4">{emp.position || '—'}</td>
                    <td className="p-4">{emp.email}</td>
                    <td className="p-4">{emp.phone || '—'}</td>
                    <td className="p-4 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(emp)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => openDeleteModal(emp)}>
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

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Employee"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Name"
            name="full_name"
            placeholder="e.g. Jane Doe"
            value={formData.full_name}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="e.g. jane.doe@company.com"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Department"
              name="department"
              placeholder="e.g. Engineering"
              value={formData.department}
              onChange={handleInputChange}
            />
            <Input
              label="Position"
              name="position"
              placeholder="e.g. Lead Developer"
              value={formData.position}
              onChange={handleInputChange}
            />
          </div>
          <Input
            label="Phone Number"
            name="phone"
            placeholder="e.g. +1234567890"
            value={formData.phone}
            onChange={handleInputChange}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Save Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Record"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Full Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
          />
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
            />
            <Input
              label="Position"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
            />
          </div>
          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Update Employee
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <strong>
              {selectedEmployee?.full_name ||
                `${selectedEmployee?.first_name || ''} ${selectedEmployee?.last_name || ''}`.trim() ||
                selectedEmployee?.email}
            </strong>
            ? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={actionLoading} onClick={handleDelete}>
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};