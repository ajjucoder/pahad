'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, FileText, Plus, Search, X, MapPin, Hash, User2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { DisclaimerBanner } from '@/components/shared/disclaimer-banner';
import { RiskBadge } from '@/components/shared/risk-badge';
import { CareRecommendation } from '@/components/shared/care-recommendation';
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
  
  // Household selection dropdown state
  const [householdSearch, setHouseholdSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // New household creation state
  const [showNewHouseholdForm, setShowNewHouseholdForm] = useState(false);
  const [newHouseholdCode, setNewHouseholdCode] = useState('');
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false);
  const [householdList, setHouseholdList] = useState<Household[]>(households);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Filter households based on search
  const filteredHouseholds = householdList.filter(hh => {
    const searchLower = householdSearch.toLowerCase();
    return hh.code.toLowerCase().includes(searchLower) || 
           hh.head_name.toLowerCase().includes(searchLower) ||
           (hh.area_name && hh.area_name.toLowerCase().includes(searchLower));
  });
  
  // Handle creating new household
  const handleCreateHousehold = async () => {
    if (!newHouseholdCode.trim() || !newHouseholdName.trim()) {
      setError('Please fill in household code and name');
      return;
    }
    
    setIsCreatingHousehold(true);
    setError(null);
    
    try {
      const res = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newHouseholdCode.trim(),
          head_name: newHouseholdName.trim(),
        }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create household');
      }
      
      const data = await res.json();
      const newHousehold = data.household;
      
      // Add to local list and select it
      setHouseholdList(prev => [newHousehold, ...prev]);
      setSelectedHousehold(newHousehold.id);
      setShowNewHouseholdForm(false);
      setNewHouseholdCode('');
      setNewHouseholdName('');
      setIsDropdownOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create household';
      setError(message);
    } finally {
      setIsCreatingHousehold(false);
    }
  };

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

      // Send patient fields directly to API (backend stores them)
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household_id: selectedHousehold,
          responses: completedResponses,
          patient_name: patientName.trim() || undefined,
          patient_age: patientAge ? parseInt(patientAge, 10) : undefined,
          patient_gender: patientGender || undefined,
          notes: notes.trim() || undefined,
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
    setHouseholdSearch('');
    setResponses({});
    setNotes('');
    setResult(null);
    setError(null);
    setShowFallbackToast(false);
    setShowNewHouseholdForm(false);
    setNewHouseholdCode('');
    setNewHouseholdName('');
  };

  // Get selected household details for mini summary
  const selectedHouseholdDetails = households.find(hh => hh.id === selectedHousehold);

  // Show result after successful submission
  if (result) {
    return (
      <div className="flex flex-col gap-6">
        {showFallbackToast && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20">
            <AlertCircle className="size-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {t('visit.fallbackToast') || 'AI explanation unavailable. Score calculated using standard screening weights.'}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('visit.result') || 'Screening Result'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t('visit.riskLevel') || 'Risk Level'}</span>
              <RiskBadge level={result.risk_level} score={result.score} showScore size="lg" />
            </div>
            
            <Separator />

            <p className="text-sm text-muted-foreground">
              {locale === 'ne' ? result.explanation_ne : result.explanation_en}
            </p>
          </CardContent>
        </Card>

        {/* Care Path Recommendations */}
        <CareRecommendation
          level={result.risk_level}
          score={result.score}
          action_en={result.action_en}
          action_ne={result.action_ne}
          recommendation_en={result.recommendation_en}
          recommendation_ne={result.recommendation_ne}
          specialist_type={result.specialist_type}
          patient_age={patientAge ? parseInt(patientAge, 10) : undefined}
        />

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
    <div className="flex flex-col gap-6">
      <DisclaimerBanner variant="compact" className="text-center" />

      {/* Patient Information Section - Refined Healthcare Design */}
      <div className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70 px-1">
          Patient Information
        </h2>
        <Card className="border-0 shadow-md bg-gradient-to-br from-white via-[var(--color-ivory)]/30 to-white overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
              {/* Full Name Field */}
              <div className="p-4 sm:p-5">
                <label htmlFor="patientName" className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-2">
                  Full Name
                </label>
                <input
                  id="patientName"
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  className="w-full bg-transparent text-base font-medium placeholder:text-muted-foreground/40 focus:outline-none border-b-2 border-transparent focus:border-[var(--color-sage)] transition-colors pb-1"
                />
              </div>
              
              {/* Age Field */}
              <div className="p-4 sm:p-5">
                <label htmlFor="patientAge" className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-2">
                  Age
                </label>
                <div className="flex items-end gap-2">
                  <input
                    id="patientAge"
                    type="number"
                    min="0"
                    max="150"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="—"
                    className="w-20 bg-transparent text-2xl font-semibold placeholder:text-muted-foreground/30 focus:outline-none border-b-2 border-transparent focus:border-[var(--color-sage)] transition-colors pb-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm text-muted-foreground/60 pb-1">years</span>
                </div>
              </div>
              
              {/* Gender Field */}
              <div className="p-4 sm:p-5">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-3">
                  Gender
                </label>
                <div className="flex gap-2">
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setPatientGender(prev => prev === gender ? '' : gender)}
                      className={cn(
                        'flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200',
                        'border-2',
                        patientGender === gender
                          ? 'bg-[var(--color-sage)] border-[var(--color-sage)] text-white shadow-sm'
                          : 'bg-transparent border-border/40 text-muted-foreground hover:border-[var(--color-sage)]/50 hover:text-foreground'
                      )}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Household Selection - Professional Searchable Dropdown */}
      <div className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70 px-1">
          {t('visit.selectHousehold') || 'Select Household'}
        </h2>
        <Card className="border-0 shadow-md bg-white overflow-hidden">
          <CardContent className="p-0">
            {selectedHouseholdDetails ? (
              /* Selected Household - Clean Display */
              <div className="p-4 sm:p-5 bg-gradient-to-r from-[var(--color-sage)]/5 to-transparent">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-[var(--color-sage)]/10 text-[var(--color-sage-dark)]">
                        <Building2 className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-[var(--color-sage-dark)] tracking-tight">
                            {selectedHouseholdDetails.code}
                          </span>
                          <span className="text-base font-medium text-foreground truncate">
                            {selectedHouseholdDetails.head_name}
                          </span>
                        </div>
                        {selectedHouseholdDetails.area_name && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="size-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {locale === 'ne' ? selectedHouseholdDetails.area_name_ne : selectedHouseholdDetails.area_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHousehold('');
                      setHouseholdSearch('');
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-white hover:bg-muted/50 rounded-lg transition-all border border-border/50"
                  >
                    <X className="size-3" />
                    Change
                  </button>
                </div>
              </div>
            ) : (
              /* Household Selector - Custom Searchable Dropdown */
              <div className="p-4 sm:p-5" ref={dropdownRef}>
                {!showNewHouseholdForm ? (
                  <>
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={householdSearch}
                        onChange={(e) => {
                          setHouseholdSearch(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Search by code, name, or area..."
                        className="w-full pl-10 pr-4 py-3 text-sm bg-muted/30 border-2 border-transparent focus:border-[var(--color-sage)]/50 rounded-xl outline-none transition-colors placeholder:text-muted-foreground/50"
                      />
                    </div>
                    
                    {/* Dropdown List */}
                    {isDropdownOpen && (
                      <div className="mt-2 border border-border/50 rounded-xl overflow-hidden bg-white shadow-lg max-h-64 overflow-y-auto">
                        {filteredHouseholds.length > 0 ? (
                          <>
                            {filteredHouseholds.slice(0, 8).map((hh) => {
                              const areaDisplay = hh.area_name ? (locale === 'ne' ? hh.area_name_ne : hh.area_name) : null;
                              return (
                                <button
                                  key={hh.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedHousehold(hh.id);
                                    setIsDropdownOpen(false);
                                    setHouseholdSearch('');
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-sage)]/5 transition-colors border-b border-border/30 last:border-0"
                                >
                                  <div className="flex items-center justify-center size-9 rounded-lg bg-[var(--color-sage)]/10 text-[var(--color-sage-dark)] flex-shrink-0">
                                    <Hash className="size-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-[var(--color-sage-dark)]">{hh.code}</span>
                                      <span className="text-sm font-medium text-foreground truncate">{hh.head_name}</span>
                                    </div>
                                    {areaDisplay && (
                                      <span className="text-xs text-muted-foreground">{areaDisplay}</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                            {filteredHouseholds.length > 8 && (
                              <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 text-center">
                                +{filteredHouseholds.length - 8} more households
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-muted-foreground mb-2">No households found</p>
                            <button
                              type="button"
                              onClick={() => setShowNewHouseholdForm(true)}
                              className="text-sm text-[var(--color-sage)] font-medium hover:underline"
                            >
                              Add new household
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Add New Household Button */}
                    <button
                      type="button"
                      onClick={() => setShowNewHouseholdForm(true)}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--color-sage-dark)] bg-[var(--color-sage)]/10 hover:bg-[var(--color-sage)]/20 rounded-xl transition-colors"
                    >
                      <Plus className="size-4" />
                      Add New Household
                    </button>
                  </>
                ) : (
                  /* New Household Form */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-foreground">Create New Household</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewHouseholdForm(false);
                          setNewHouseholdCode('');
                          setNewHouseholdName('');
                        }}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                          Household Code
                        </label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={newHouseholdCode}
                            onChange={(e) => setNewHouseholdCode(e.target.value.toUpperCase())}
                            placeholder="e.g., HH-001"
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/20 border border-border/50 focus:border-[var(--color-sage)] rounded-lg outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-1.5">
                          Head of Household
                        </label>
                        <div className="relative">
                          <User2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={newHouseholdName}
                            onChange={(e) => setNewHouseholdName(e.target.value)}
                            placeholder="Full name"
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/20 border border-border/50 focus:border-[var(--color-sage)] rounded-lg outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewHouseholdForm(false);
                          setNewHouseholdCode('');
                          setNewHouseholdName('');
                        }}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateHousehold}
                        disabled={isCreatingHousehold || !newHouseholdCode.trim() || !newHouseholdName.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--color-sage)] hover:bg-[var(--color-sage-dark)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        {isCreatingHousehold ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" />
                            Create
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicator - Elegant Minimal Design */}
      <div className="flex items-center gap-4 px-1">
        <div className="flex-1">
          <Progress
            value={progressValue}
            className="h-1 bg-muted/50"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn(
            "font-semibold tabular-nums",
            progressValue === 100 ? "text-green-600" : "text-[var(--color-sage-dark)]"
          )}>
            {answeredCount}
          </span>
          <span className="text-muted-foreground/60">/</span>
          <span className="text-muted-foreground tabular-nums">{SIGNAL_KEYS.length}</span>
        </div>
      </div>

      {/* Screening Questions - Refined Card-Based Design */}
      <div className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70 px-1">
          {t('visit.screeningQuestions') || 'Screening Questions'}
        </h2>
        
        <div className="space-y-3">
          {SCREENING_SIGNALS.map((signal, index) => {
            const currentValue = responses[signal.key as keyof VisitResponses];
            const signalLabel = locale === 'ne' ? signal.question_ne : signal.label_en;
            const isAnswered = currentValue !== undefined;

            return (
              <Card 
                key={signal.key} 
                className={cn(
                  "border-0 shadow-sm overflow-hidden transition-all duration-300",
                  isAnswered 
                    ? "bg-gradient-to-r from-[var(--color-sage)]/5 via-white to-white ring-1 ring-[var(--color-sage)]/20" 
                    : "bg-white hover:shadow-md"
                )}
              >
                <CardContent className="p-0">
                  <div className="p-4 sm:p-5">
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className={cn(
                        "flex-shrink-0 size-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                        isAnswered 
                          ? "bg-[var(--color-sage)] text-white" 
                          : "bg-muted/50 text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <p className="flex-1 text-sm leading-relaxed font-medium text-foreground/90 pt-0.5">
                        {signalLabel}
                      </p>
                    </div>
                    
                    {/* Response Options - Modern Button Group */}
                    <div className="flex flex-wrap gap-2">
                      {RESPONSE_OPTIONS.map((option) => {
                        const optionLabel = locale === 'ne' ? option.label_ne : option.label_en;
                        const isSelected = currentValue === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              // Toggle: if already selected, unselect it
                              if (currentValue === option.value) {
                                const newResponses = { ...responses };
                                delete newResponses[signal.key as keyof VisitResponses];
                                setResponses(newResponses);
                              } else {
                                handleResponseChange(signal.key as keyof VisitResponses, option.value);
                              }
                            }}
                            className={cn(
                              'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                              'border-2 min-w-[80px]',
                              'focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:ring-offset-1',
                              // Not selected state
                              !isSelected && 'bg-transparent border-border/40 text-muted-foreground hover:border-[var(--color-sage)]/40 hover:text-foreground',
                              // Selected state - Not observed (green)
                              isSelected && option.value === 0 && 'bg-[var(--color-sage)] border-[var(--color-sage)] text-white shadow-sm',
                              // Selected state - Mild/sometimes (subtle teal)
                              isSelected && option.value === 1 && 'bg-[var(--color-sage-light)] border-[var(--color-sage-light)] text-white shadow-sm',
                              // Selected state - Significant/often (amber)
                              isSelected && option.value === 2 && 'bg-amber-500 border-amber-500 text-white shadow-sm',
                              // Selected state - Severe/persistent (red)
                              isSelected && option.value === 3 && 'bg-red-500 border-red-500 text-white shadow-sm'
                            )}
                          >
                            {optionLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Notes Section */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            {t('visit.notes') || 'Notes (Optional)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('visit.notesPlaceholder') || 'Add any additional observations...'}
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full bg-primary hover:bg-primary/90"
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedHousehold || !allSignalsAnswered}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t('common.syncing') || 'Syncing...'}
          </>
        ) : (
          t('common.submit') || 'Submit'
        )}
      </Button>
    </div>
  );
}
