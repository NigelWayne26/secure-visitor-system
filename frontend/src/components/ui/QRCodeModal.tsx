import React, { useState, useEffect } from 'react';
import type { Visit } from '../../types';
import { passApi, parseApiError } from '../../services/api';
import { Modal } from './Modal';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { Alert } from './Alert';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: Visit | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, visit }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && visit) {
      setLoading(true);
      setError(null);
      let objectUrl: string | null = null;

      passApi
        .getQrImageUrl(visit.id)
        .then((url) => {
          objectUrl = url;
          setImageUrl(url);
        })
        .catch((err) => {
          setError(parseApiError(err));
        })
        .finally(() => {
          setLoading(false);
        });

      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    } else {
      setImageUrl(null);
    }
  }, [isOpen, visit]);

  if (!visit) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Visitor QR Pass">
      <div className="flex flex-col items-center justify-center space-y-4">
        {error && <Alert type="error" message={error} />}

        {loading ? (
          <LoadingSpinner />
        ) : imageUrl ? (
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col items-center">
            <img src={imageUrl} alt="QR Visitor Pass" className="w-56 h-56 object-contain" />
          </div>
        ) : null}

        <div className="text-center space-y-1 w-full bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-800">{visit.visitor_detail?.full_name}</p>
          <p className="text-slate-500">Purpose: {visit.purpose}</p>
          <p className="text-xs text-slate-400">
            Expected Date: {visit.expected_date} at {visit.expected_time}
          </p>
        </div>

        <div className="w-full flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};