'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Home, Mail, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { Role } from '@/lib/types';
import { useLanguage } from '@/providers/language-provider';
import { motion, AnimatePresence } from 'framer-motion';

export interface ApplicationData {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  requested_role: Role;
  phone: string | null;
  address: string | null;
  area_id: string | null;
  avatar_url: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  area_name: string;
  area_name_ne: string;
}

interface ApplicationsClientProps {
  applications: ApplicationData[];
}

export function ApplicationsClient({ applications }: ApplicationsClientProps) {
  const { t, locale } = useLanguage();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalRoleById, setApprovalRoleById] = useState<Record<string, Role>>(
    () => Object.fromEntries(applications.map((application) => [application.id, application.requested_role ?? 'chw']))
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localApplications, setLocalApplications] = useState(applications);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ne' ? 'ne-NP' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleApprove = async (applicationId: string) => {
    setProcessingId(applicationId);
    setError(null);

    try {
      const response = await fetch('/api/applications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          approved_role: approvalRoleById[applicationId] ?? 'chw',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('applications.errors.approve'));
        setProcessingId(null);
        return;
      }

      // Remove from local list
      setLocalApplications((prev) => prev.filter((a) => a.id !== applicationId));
      setSuccessMessage(t('applications.success.approved'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError(t('applications.errors.generic'));
    }

    setProcessingId(null);
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      setError(t('applications.errors.reasonRequired'));
      return;
    }

    setProcessingId(applicationId);
    setError(null);

    try {
      const response = await fetch('/api/applications/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          rejection_reason: rejectionReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('applications.errors.reject'));
        setProcessingId(null);
        return;
      }

      // Remove from local list
      setLocalApplications((prev) => prev.filter((a) => a.id !== applicationId));
      setShowRejectModal(null);
      setRejectionReason('');
      setSuccessMessage(t('applications.success.rejected'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError(t('applications.errors.generic'));
    }

    setProcessingId(null);
  };

  if (localApplications.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-muted/50 to-white">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center size-12 rounded-xl bg-muted mx-auto mb-3">
            <CheckCircle className="size-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">{t('applications.empty')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 z-50 bg-[#5B7553] text-white px-4 py-3 rounded-xl shadow-lg"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-4"
          >
            {error}
            <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applications List */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0 divide-y divide-border/30">
          {localApplications.map((application) => {
            const areaName = locale === 'ne' ? application.area_name_ne : application.area_name;
            const isProcessing = processingId === application.id;

            return (
              <div key={application.id} className="p-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="size-12 rounded-xl">
                    <AvatarImage src={application.avatar_url || undefined} alt={application.full_name} />
                    <AvatarFallback className="bg-[var(--color-sage)]/10 text-[var(--color-sage-dark)] text-sm font-semibold rounded-xl">
                      {getInitials(application.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm">
                        {application.full_name}
                      </h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(application.created_at)}
                      </span>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="size-3 flex-shrink-0" />
                        <span className="truncate">{application.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="size-3 flex-shrink-0" />
                        <span>{application.phone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="size-3 flex-shrink-0" />
                        <span>{areaName}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Home className="size-3 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{application.address || '—'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`approval-role-${application.id}`}
                        value={approvalRoleById[application.id] ?? 'chw'}
                        onChange={(event) =>
                          setApprovalRoleById((current) => ({
                            ...current,
                            [application.id]: event.target.value as Role,
                          }))
                        }
                        disabled={isProcessing}
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                      >
                        <option value="chw">{t('apply.form.roleChw')}</option>
                        <option value="supervisor">{t('apply.form.roleSupervisor')}</option>
                      </select>
                      <Button
                        size="sm"
                        className="bg-[#5B7553] hover:bg-[#3D5235] text-white h-8 px-3 text-xs"
                        onClick={() => handleApprove(application.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="size-3 mr-1" />
                            {t('applications.actions.approve')}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setShowRejectModal(application.id)}
                        disabled={isProcessing}
                      >
                        <XCircle className="size-3 mr-1" />
                        {t('applications.actions.reject')}
                      </Button>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full border border-yellow-200">
                      {t('applications.status.pending')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowRejectModal(null);
              setRejectionReason('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-foreground mb-2">
                {t('applications.rejectModal.title')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('applications.rejectModal.description')}
              </p>
              <div className="space-y-3">
                <Label htmlFor="reason">{t('applications.rejectModal.reason')}</Label>
                <Textarea
                  id="reason"
                  placeholder={t('applications.rejectModal.reasonPlaceholder')}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason('');
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleReject(showRejectModal)}
                  disabled={processingId === showRejectModal}
                >
                  {processingId === showRejectModal ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    t('applications.actions.reject')
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
