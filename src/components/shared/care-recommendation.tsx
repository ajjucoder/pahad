'use client';

import { Card, CardContent } from '@/components/ui/card';
import { RISK_COLORS } from '@/lib/constants';
import { useLanguage } from '@/providers/language-provider';
import type { RiskLevel, SpecialistType } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Phone,
  ArrowRight,
  Calendar,
  Building2,
  UserCheck,
  Heart,
  Shield,
  Zap,
  Stethoscope,
  Baby,
  Wine,
  User,
} from 'lucide-react';

interface CareRecommendationProps {
  level: RiskLevel;
  score: number;
  className?: string;
  compact?: boolean;
  showTitle?: boolean;
  // LLM-generated action and recommendation
  action_en?: string | null;
  action_ne?: string | null;
  recommendation_en?: string | null;
  recommendation_ne?: string | null;
  specialist_type?: SpecialistType | null;
  // Patient context for specialist display
  patient_age?: number | null;
}

// Care path steps based on mhGAP guidelines from PRD
const CARE_PATHS: Record<RiskLevel, { steps: CareStep[]; urgency: Urgency }> = {
  low: {
    urgency: 'routine',
    steps: [
      { action: 'continue_monitoring', icon: 'CheckCircle2', type: 'success' },
      { action: 'routine_visits', icon: 'Calendar', type: 'info' },
      { action: 'document_observations', icon: 'FileText', type: 'default' },
    ],
  },
  moderate: {
    urgency: 'scheduled',
    steps: [
      { action: 'return_visit_week', icon: 'Clock', type: 'warning' },
      { action: 'inform_supervisor', icon: 'UserCheck', type: 'info' },
      { action: 'monitor_closely', icon: 'Eye', type: 'default' },
    ],
  },
  high: {
    urgency: 'priority',
    steps: [
      { action: 'refer_health_post', icon: 'Building2', type: 'warning' },
      { action: 'flag_dashboard', icon: 'Flag', type: 'alert' },
      { action: 'supervisor_review', icon: 'Shield', type: 'critical' },
    ],
  },
  critical: {
    urgency: 'emergency',
    steps: [
      { action: 'immediate_escalation', icon: 'Zap', type: 'critical' },
      { action: 'contact_supervisor', icon: 'Phone', type: 'critical' },
      { action: 'emergency_protocol', icon: 'AlertTriangle', type: 'critical' },
    ],
  },
};

type Urgency = 'routine' | 'scheduled' | 'priority' | 'emergency';
type StepType = 'success' | 'info' | 'default' | 'warning' | 'alert' | 'critical';

interface CareStep {
  action: string;
  icon: string;
  type: StepType;
}

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Phone,
  Calendar,
  Building2,
  UserCheck,
  Heart,
  Shield,
  Zap,
  FileText: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Eye: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Flag: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
};

// Urgency styling
const URGENCY_STYLES: Record<Urgency, { bg: string; border: string; text: string; label: string; labelNe: string }> = {
  routine: {
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    label: 'Routine Care',
    labelNe: 'नियमित हेरचाह',
  },
  scheduled: {
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    label: 'Scheduled Follow-up',
    labelNe: 'निर्धारित फलो-अप',
  },
  priority: {
    bg: 'bg-gradient-to-br from-orange-50 to-orange-100/50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    label: 'Priority Attention',
    labelNe: 'प्राथमिकता ध्यान',
  },
  emergency: {
    bg: 'bg-gradient-to-br from-red-50 to-red-100/50',
    border: 'border-red-300',
    text: 'text-red-800',
    label: 'Emergency Response',
    labelNe: 'आपतकालीन प्रतिक्रिया',
  },
};

// Step type styling
const STEP_STYLES: Record<StepType, { bg: string; icon: string; ring: string }> = {
  success: { bg: 'bg-emerald-100', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
  info: { bg: 'bg-sky-100', icon: 'text-sky-600', ring: 'ring-sky-200' },
  default: { bg: 'bg-slate-100', icon: 'text-slate-600', ring: 'ring-slate-200' },
  warning: { bg: 'bg-amber-100', icon: 'text-amber-600', ring: 'ring-amber-200' },
  alert: { bg: 'bg-orange-100', icon: 'text-orange-600', ring: 'ring-orange-200' },
  critical: { bg: 'bg-red-100', icon: 'text-red-600', ring: 'ring-red-200' },
};

// Specialist type display configuration
const SPECIALIST_CONFIG: Record<SpecialistType, { icon: typeof Stethoscope; label: string; labelNe: string; color: string }> = {
  psychiatrist: {
    icon: Stethoscope,
    label: 'Psychiatrist',
    labelNe: 'मनोचिकित्सक',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  child_psychiatrist: {
    icon: Baby,
    label: 'Child Psychiatrist',
    labelNe: 'बाल मनोचिकित्सक',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  addiction_psychiatrist: {
    icon: Wine,
    label: 'Addiction Specialist',
    labelNe: 'व्यसन विशेषज्ञ',
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
};

export function CareRecommendation({
  level,
  score: _score,
  className,
  compact = false,
  showTitle = true,
  action_en,
  action_ne,
  recommendation_en,
  recommendation_ne,
  specialist_type,
  patient_age,
}: CareRecommendationProps) {
  const { locale, t } = useLanguage();
  const carePath = CARE_PATHS[level];
  const urgencyStyle = URGENCY_STYLES[carePath.urgency];

  // Check for suicide/self-harm indicators (Q11 or Q12 rated >= 1)
  // This would come from the parent component in real implementation
  // For now, we detect from critical level
  const hasSuicideIndicator = level === 'critical';

  // Get the action and recommendation based on locale
  const action = locale === 'ne' && action_ne ? action_ne : action_en;
  const recommendation = locale === 'ne' && recommendation_ne ? recommendation_ne : recommendation_en;

  // Determine if we have LLM-generated content
  const hasLLMContent = action || recommendation;

  // Get specialist config if available
  const specialistConfig = specialist_type ? SPECIALIST_CONFIG[specialist_type] : null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Care Path Header */}
      {showTitle && (
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-sage-dark)]/70">
            {t('recommendation.title')}
          </h3>
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
            urgencyStyle.bg,
            urgencyStyle.text
          )}>
            {locale === 'ne' ? urgencyStyle.labelNe : urgencyStyle.label}
          </span>
        </div>
      )}

      {/* Main Card */}
      <Card className={cn(
        'border-2 overflow-hidden transition-all',
        urgencyStyle.border,
        urgencyStyle.bg
      )}>
        <CardContent className={cn('p-0', compact && 'p-3')}>
          {/* Emergency Banner for Critical */}
          {hasSuicideIndicator && (
            <div className="bg-red-600 text-white px-4 py-2.5 flex items-center gap-2">
              <AlertTriangle className="size-4 flex-shrink-0" />
              <span className="text-sm font-semibold">
                {locale === 'ne' 
                  ? 'आत्मघाती संकेतहरू देखिएका छन् - तत्काल कारबाही आवश्यक छ'
                  : 'Suicide/Self-harm indicators detected - Immediate action required'}
              </span>
            </div>
          )}

          {/* LLM-Generated Action & Recommendation */}
          {hasLLMContent && !compact && (
            <div className="p-4 border-b border-white/30 space-y-3">
              {/* Action Summary */}
              {action && (
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex-shrink-0 rounded-lg flex items-center justify-center size-8',
                    'ring-2 ring-offset-1',
                    level === 'critical' ? 'bg-red-100 ring-red-200' :
                    level === 'high' ? 'bg-orange-100 ring-orange-200' :
                    level === 'moderate' ? 'bg-amber-100 ring-amber-200' :
                    'bg-emerald-100 ring-emerald-200'
                  )}>
                    <Zap className={cn(
                      'size-4',
                      level === 'critical' ? 'text-red-600' :
                      level === 'high' ? 'text-orange-600' :
                      level === 'moderate' ? 'text-amber-600' :
                      'text-emerald-600'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-0.5">
                      {t('recommendation.actionLabel') || 'Recommended Action'}
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {action}
                    </p>
                  </div>
                </div>
              )}

              {/* Detailed Recommendation */}
              {recommendation && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded-lg flex items-center justify-center size-8 bg-sky-100 ring-2 ring-offset-1 ring-sky-200">
                    <Heart className="size-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80 mb-0.5">
                      {t('recommendation.careRecommendation') || 'Care Recommendation'}
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Specialist Suggestion */}
          {specialistConfig && !compact && (
            <div className="px-4 py-3 bg-white/40 border-t border-white/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t('recommendation.specialistSuggestion') || 'Specialist Suggestion'}:
                  </span>
                </div>
                <div className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
                  specialistConfig.color
                )}>
                  <specialistConfig.icon className="size-3.5" />
                  {locale === 'ne' ? specialistConfig.labelNe : specialistConfig.label}
                </div>
              </div>
              {patient_age !== undefined && patient_age !== null && patient_age < 18 && specialist_type === 'child_psychiatrist' && (
                <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                  {locale === 'ne'
                    ? `बाल मनोचिकित्सक उमेर (${patient_age} वर्ष) को आधारमा सिफारिस गरिएको`
                    : `Child psychiatrist recommended based on patient age (${patient_age} years)`}
                </p>
              )}
            </div>
          )}

          {/* Care Path Steps - Only show if no LLM content OR in compact mode */}
          {(!hasLLMContent || compact) && (
            <div className={cn('p-4', compact && 'p-0')}>
              <div className={cn(
                'grid gap-3',
                compact ? 'gap-2' : 'sm:grid-cols-3'
              )}>
                {carePath.steps.map((step, index) => {
                  const Icon = ICON_MAP[step.icon] || CheckCircle2;
                  const stepStyle = STEP_STYLES[step.type];
                  const actionLabel = t(`recommendation.actions.${step.action}`);
                  const actionDesc = t(`recommendation.descriptions.${step.action}`);

                  return (
                    <div
                      key={step.action}
                      className={cn(
                        'relative group',
                        compact && 'flex items-center gap-2'
                      )}
                    >
                      {/* Connector Line (desktop, non-compact) */}
                      {!compact && index < carePath.steps.length - 1 && (
                        <div className="hidden sm:block absolute top-6 left-full w-full h-0.5 -translate-y-1/2 z-0">
                          <div className="w-full border-t-2 border-dashed border-muted-foreground/30" />
                          <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/50" />
                        </div>
                      )}

                      {/* Step Card */}
                      <div className={cn(
                        'relative z-10 rounded-xl p-3 bg-white/80 backdrop-blur-sm',
                        'border border-white/50 shadow-sm',
                        'transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
                        compact && 'rounded-lg p-2 hover:scale-100'
                      )}>
                        <div className={cn(
                          'flex items-start gap-3',
                          compact && 'items-center gap-2'
                        )}>
                          {/* Step Number/Icon */}
                          <div className={cn(
                            'flex-shrink-0 rounded-lg flex items-center justify-center',
                            'ring-2 ring-offset-1',
                            stepStyle.bg,
                            stepStyle.ring,
                            compact ? 'size-7' : 'size-9'
                          )}>
                            <Icon className={cn(
                              stepStyle.icon,
                              compact ? 'size-3.5' : 'size-4.5'
                            )} />
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'font-semibold text-foreground',
                              compact ? 'text-xs' : 'text-sm'
                            )}>
                              {actionLabel}
                            </p>
                            {!compact && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {actionDesc}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Arrow (between steps) */}
                      {compact && index < carePath.steps.length - 1 && (
                        <ArrowRight className="size-3 text-muted-foreground/50 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emergency Contact for Critical */}
          {level === 'critical' && !compact && (
            <div className="border-t border-red-200 bg-red-50/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    {locale === 'ne' ? 'आपतकालीन सम्पर्क:' : 'Emergency Contact:'}
                  </span>
                </div>
                <span className="text-sm font-bold text-red-700">
                  {locale === 'ne' ? 'सुपरिवेक्षक + चिकित्सक' : 'Supervisor + Doctor'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Info for Moderate/High */}
      {(level === 'moderate' || level === 'high') && !compact && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs',
          level === 'high' ? 'bg-orange-50 text-orange-700' : 'bg-amber-50 text-amber-700'
        )}>
          <Clock className="size-3.5" />
          <span>
            {level === 'high' 
              ? (locale === 'ne' 
                  ? 'सुपरिवेक्षक समीक्षा आवश्यक - स्वास्थ्य चौकीमा रेफर गर्नुहोस्'
                  : 'Supervisor review required - Refer to health post')
              : (locale === 'ne'
                  ? 'एक हप्तामा फिर्ता भ्रमण गर्नुहोस्'
                  : 'Schedule return visit within 1 week')}
          </span>
        </div>
      )}
    </div>
  );
}

// Compact variant for inline use in lists/tables
export function CareRecommendationCompact({
  level,
  score,
  className,
  action_en,
  action_ne,
  recommendation_en,
  recommendation_ne,
  specialist_type,
  patient_age,
}: Omit<CareRecommendationProps, 'compact' | 'showTitle'>) {
  return (
    <CareRecommendation
      level={level}
      score={score}
      className={className}
      action_en={action_en}
      action_ne={action_ne}
      recommendation_en={recommendation_en}
      recommendation_ne={recommendation_ne}
      specialist_type={specialist_type}
      patient_age={patient_age}
      compact
      showTitle={false}
    />
  );
}

// Quick action summary for badges/indicators
export function CareActionSummary({
  level,
  action_en,
  action_ne,
}: {
  level: RiskLevel;
  action_en?: string | null;
  action_ne?: string | null;
}) {
  const { locale } = useLanguage();

  // Use LLM-generated action if available
  const llmAction = locale === 'ne' && action_ne ? action_ne : action_en;

  const summary: Record<RiskLevel, { en: string; ne: string; color: string }> = {
    low: {
      en: 'Continue monitoring',
      ne: 'निगरानी जारी राख्नुहोस्',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    moderate: {
      en: 'Return in 1 week',
      ne: '१ हप्तामा फर्कनुहोस्',
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    high: {
      en: 'Refer to health post',
      ne: 'स्वास्थ्य चौकीमा रेफर गर्नुहोस्',
      color: 'text-orange-600 bg-orange-50 border-orange-200'
    },
    critical: {
      en: 'Immediate escalation',
      ne: 'तत्काल वृद्धि',
      color: 'text-red-600 bg-red-50 border-red-200'
    },
  };

  const s = summary[level];

  // Use LLM action text, truncated if too long
  const displayText = llmAction
    ? (llmAction.length > 30 ? llmAction.slice(0, 30) + '...' : llmAction)
    : (locale === 'ne' ? s.ne : s.en);

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
      s.color
    )}>
      <span className="size-1.5 rounded-full bg-current" />
      {displayText}
    </span>
  );
}
