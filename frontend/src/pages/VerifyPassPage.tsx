import React, { useState } from 'react';
import { passApi, parseApiError } from '../services/api';
import type { PassVerificationResponse, Visit } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const VerifyPassPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [result, setResult] = useState<PassVerificationResponse | null>(null);
  const [checkInSuccessVisit, setCheckInSuccessVisit] = useState<Visit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(false);
    setResult(null);
    setCheckInSuccessVisit(null);
    setError(null);
    setLoading(true);

    try {
      const res = await passApi.verifyPass(tokenInput.trim());
      setResult(res.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!tokenInput.trim()) return;

    setCheckInLoading(true);
    setError(null);

    try {
      const res = await passApi.checkInPass(tokenInput.trim());
      
      if ('success' in res.data && res.data.success) {
        setCheckInSuccessVisit(res.data.visit);
        setResult(null);
      } else if ('reason' in res.data) {
        setError(res.data.reason);
      } else {
        setError('Check-in failed.');
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setCheckInLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pass Verification Gateway</h2>
        <p className="text-sm text-slate-500">
          Security Officer portal — enter or scan a token UUID to verify pass validity and perform check-in
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            label="Pass Token UUID"
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" className="w-full" isLoading={loading}>
            Verify Token
          </Button>
        </form>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {checkInSuccessVisit && (
        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-emerald-900">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="text-lg font-bold text-emerald-950">CHECK-IN COMPLETE</h3>
              <p className="text-xs text-emerald-700">Visitor status updated to checked_in</p>
            </div>
          </div>
          <div className="bg-white/80 p-4 rounded-lg border border-emerald-100 text-sm space-y-1 text-slate-800">
            <p>
              <strong>Visitor:</strong> {checkInSuccessVisit.visitor_detail?.full_name}
            </p>
            <p>
              <strong>Host:</strong> {checkInSuccessVisit.host_employee_detail?.full_name || checkInSuccessVisit.host_employee_detail?.email}
            </p>
            <p>
              <strong>Check-In Time:</strong>{' '}
              {checkInSuccessVisit.check_in_time
                ? new Date(checkInSuccessVisit.check_in_time).toLocaleString()
                : 'Just now'}
            </p>
          </div>
        </div>
      )}

      {result && (
        <div className="animate-in fade-in zoom-in-95 duration-150">
          {result.valid ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4 text-emerald-900">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="text-lg font-bold text-emerald-950">PASS IS VALID</h3>
                  <p className="text-xs text-emerald-700">Token verified successfully in access database</p>
                </div>
              </div>

              {result.pass.visit_detail && (
                <div className="bg-white/80 p-4 rounded-lg border border-emerald-100 text-sm space-y-2 text-slate-800">
                  <p>
                    <strong>Visitor:</strong> {result.pass.visit_detail.visitor_detail?.full_name}
                  </p>
                  <p>
                    <strong>ID Number:</strong> {result.pass.visit_detail.visitor_detail?.id_number}
                  </p>
                  <p>
                    <strong>Host Employee:</strong>{' '}
                    {result.pass.visit_detail.host_employee_detail?.full_name ||
                      result.pass.visit_detail.host_employee_detail?.email}
                  </p>
                  <p>
                    <strong>Purpose:</strong> {result.pass.visit_detail.purpose}
                  </p>
                  <p>
                    <strong>Pass Expires At:</strong> {new Date(result.pass.expires_at).toLocaleString()}
                  </p>
                </div>
              )}

              <Button className="w-full" isLoading={checkInCheckInLoading(checkInLoading)} onClick={handleCheckIn}>
                Confirm & Check In Visitor
              </Button>
            </div>
          ) : (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl space-y-2 text-red-900">
              <div className="flex items-center gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <h3 className="text-lg font-bold text-red-950">INVALID PASS</h3>
                  <p className="text-sm font-medium text-red-800 mt-1">Reason: {result.reason}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function checkInCheckInLoading(loading: boolean): boolean {
  return loading;
}