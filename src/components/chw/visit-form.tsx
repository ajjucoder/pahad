'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, User, Calendar, Users, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DisclaimerBanner } from '@/components/shared/disclaimer-banner';
import { RiskBadge } from '@/components/shared/risk-badge';
import { useLanguage } from '@/providers/language-provider';
import { SCREENING_SIGNALS, RESPONSE_OPTIONS, SIGNAL_KEYS } from '@/lib/signals';
import { cn } from '@/lib/utils';
import type { Household, VisitResponses, SignalValue, ScoreResponse } from '@/lib/types';

interface VisitFormProps {
  households: Household[];
}

type DraftResponses = Partial<Record<keyof VisitResponses, SignalValue>>;

export function VisitForm({ households }: VisitFormProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  
  // Patient Information
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  
  const [selectedHousehold, setSelectedHousehold] = useState<string>('');
  const [responses, setResponses] = useState<DraftResponses>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [showFallbackToast, setShowFallbackToast] = useState(false);

  const answeredCount = SIGNAL_KEYS.filter(
    (key) => responses[key as keyof VisitResponses] !== undefined
  ).length;
  const allSignalsAnswered = SIGNAL_KEYS.every(
    (key) => responses[key as keyof VisitResponses] !== undefined
  );
  const progressValue = (answeredCount / SIGNAL_KEYS.length) * 100;

  const handleResponseChange = useCallback((key: keyof VisitResponses, value: SignalValue) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!selectedHousehold) {
      setError(t('visit.selectHousehold') || 'Please select a household');
      return;
    }
    if (!allSignalsAnswered) {
      setError(t('visit.completeAllSignals') || 'Please answer all screening questions');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setShowFallbackToast(false);

    try {
      const completedResponses = SIGNAL_KEYS.reduce((acc, key) => {
        acc[key as keyof VisitResponses] = responses[key as keyof VisitResponses] as SignalValue;
        return acc;
      }, {} as VisitResponses);

      // Prepend patient info to notes if any patient fields are filled
      let finalNotes = notes;
      if (patientName || patientAge || patientGender) {
        const patientInfo = `[Patient: Name: ${patientName || 'N/A'}, Age: ${patientAge || 'N/A'}, Gender: ${patientGender || 'N/A'}]`;
        finalNotes = notes ? `${patientInfo}\n\n${notes}` : patientInfo;
      }

      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: selectedHousehold,
          responses: completedResponses,
          notes: finalNotes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit visit');
      }

      const data: ScoreResponse = await res.json();
      setResult(data);

      if (data.scoring_method === 'fallback') {
        setShowFallbackToast(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      // Keep form data on network error - don't reset
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPatientName('');
    setPatientAge('');
    setPatientGender('');
    setSelectedHousehold('');
    setResponses({});
    setNotes('');
    setResult(null);
    setError(null);
    setShowFallbackToast(false);
  };

  // Show result after successful submission
  if (result) {
    return (
      <div className="space-y-6">
        {showFallbackToast && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {t('visit.fallbackToast') || 'AI explanation unavailable. Score calculated using standard screening weights.'}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('visit.result') || 'Screening Result'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('visit.riskLevel') || 'Risk Level'}</span>
              <RiskBadge level={result.risk_level} score={result.score} showScore size="lg" />
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                {locale === 'ne' ? result.explanation_ne : result.explanation_en}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/app')}
          >
            {t('visit.backToHome') || 'Back to Home'}
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push(`/app/visits/${result.visit_id}`)}
          >
            {t('visit.viewDetails') || 'View Full Details'}
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={handleReset}
        >
          {t('visit.startNew') || 'Start New Visit'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DisclaimerBanner variant="compact" className="text-center mb-4" />

      {/* Patient Information */}
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientName" className="text-sm">
                Full Name
              </Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientAge" className="text-sm flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Age
              </Label>
              <Input
                id="patientAge"
                type="number"
                min="0"
                max="150"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Years"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientGender" className="text-sm flex items-center gap-1">
                <Users className="h-3 w-3" />
                Gender
              </Label>
              <Select value={patientGender} onValueChange={setPatientGender}>
                <SelectTrigger id="patientGender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Household Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            {t('visit.selectHousehold') || 'Select Household'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedHousehold} onValueChange={setSelectedHousehold}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('visit.chooseHousehold') || 'Choose a household...'} />
            </SelectTrigger>
            <SelectContent>
              {households.map((hh) => {
                const areaDisplay = hh.area_name ? (locale === 'ne' ? hh.area_name_ne : hh.area_name) : null;
                return (
                  <SelectItem key={hh.id} value={hh.id} className="py-3">
                    <div className="flex flex-col items-start gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{hh.code}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium">{hh.head_name}</span>
                      </div>
                      {areaDisplay && (
                        <span className="text-xs text-muted-foreground pl-0">
                          {areaDisplay}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="sticky top-4 z-10 border-primary/20 bg-gradient-to-r from-background to-muted/30 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">{t('visit.progressTitle') || 'Screening Progress'}</p>
              <p className="text-xs text-muted-foreground">
                {answeredCount} of {SIGNAL_KEYS.length} questions answered
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                progressValue === 100 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-primary/10 text-primary"
              )}>
                {Math.round(progressValue)}%
              </span>
            </div>
          </div>
          <Progress value={progressValue} className="h-2 mt-3" />
        </CardContent>
      </Card>

      {/* Screening Signals */}
      <div className="space-y-4">
        {SCREENING_SIGNALS.map((signal, index) => {
          const currentValue = responses[signal.key as keyof VisitResponses];
          const signalLabel = locale === 'ne' ? signal.question_ne : signal.label_en;

          return (
            <Card key={signal.key}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-3 block">
                      {signalLabel}
                    </Label>
                    <RadioGroup
                      value={currentValue === undefined ? '' : String(currentValue)}
                      onValueChange={(val) => 
                        handleResponseChange(signal.key as keyof VisitResponses, parseInt(val) as SignalValue)
                      }
                      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                    >
                      {RESPONSE_OPTIONS.map((option) => {
                        const optionLabel = locale === 'ne' ? option.label_ne : option.label_en;
                        const isSelected = currentValue === option.value;

                        return (
                          <div key={option.value}>
                            <RadioGroupItem
                              value={String(option.value)}
                              id={`${signal.key}-${option.value}`}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={`${signal.key}-${option.value}`}
                              className={cn(
                                'flex items-center justify-center text-center',
                                'rounded-lg border p-2 cursor-pointer',
                                'text-xs transition-all',
                                'hover:bg-accent hover:text-accent-foreground',
                                'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                                isSelected && 'bg-primary text-primary-foreground border-primary'
                              )}
                            >
                              {optionLabel}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('visit.notes') || 'Notes (Optional)'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('visit.notesPlaceholder') || 'Add any additional observations...'}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedHousehold || !allSignalsAnswered}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('common.syncing') || 'Syncing...'}
          </>
        ) : (
          t('common.submit') || 'Submit'
        )}
      </Button>
    </div>
  );
}
