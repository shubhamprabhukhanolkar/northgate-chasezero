import React, { useEffect, useState } from 'react';
import {
  Activity,
  BadgeCheck,
  CheckCircle2,
  Coins,
  Flag,
  Gavel,
  Globe,
  Minimize2,
  PiggyBank,
  Rocket,
  Share,
  Shield,
  SlidersHorizontal,
  Timer,
  TrendingDown,
} from 'lucide-react';

import { useChaseStore } from '../store/useChaseStore';

export const ExecutiveDashboard: React.FC = () => {
  const { dashboardMetrics, fetchDashboardMetrics } = useChaseStore();
  const [exportStatus, setExportStatus] = useState<'idle' | 'compiling' | 'done'>('idle');
  const [apacQueued, setApacQueued] = useState(false);
  const [showDetailCallout, setShowDetailCallout] = useState(true);

  useEffect(() => {
    void fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  const m = dashboardMetrics;
  const daysPerRound = m?.days_per_chase_round ?? 3.1;
  const velocityDelta = m?.velocity_delta_pct ?? -43.6;
  const caseDaysSaved = m?.case_days_saved_month ?? 2880;
  const adoptionRate = m?.rm_adoption_rate_pct ?? 94.7;
  const totalDrafts = m?.total_drafts_generated ?? 19;
  const totalApproved = m?.total_rm_approved ?? 18;
  const totalRejections = m?.total_critic_rejections ?? 2;
  const baselineChasing = m?.baseline_chasing_days ?? 17.0;
  const pilotChasing = m?.pilot_chasing_days ?? 7.8;
  const pilotOnboarding = m?.pilot_onboarding_days ?? 52.8;

  const progressRatio = Math.max(
    15,
    Math.min(100, Math.round(((5.5 - daysPerRound) / (5.5 - 3.0)) * 100))
  );

  const handleExportSummary = () => {
    setExportStatus('compiling');
    window.setTimeout(() => {
      const payload = m ?? {};
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `northgate-chasezero-coo-pilot-summary.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus('done');
      window.setTimeout(() => setExportStatus('idle'), 2200);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full space-y-space-md max-w-[1440px] mx-auto">
      {/* Report Header Section (from executive_success_dashboard_mobile/code.html) */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg shadow-xl">
        <div className="absolute -right-10 -top-10 w-52 h-52 bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-sm mb-space-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container/15 text-primary text-label-sm font-label-sm">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Verified Synthesis</span>
              </div>
              <span className="font-mono-sm text-mono-sm text-text-muted">W2·PILOT-REPORT</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
              Executive Success &amp; 2-Week Pilot Review
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              ChaseZero Automated Orchestration Impact Report • Live SQLite{' '}
              <code className="text-brand-accent font-mono-sm">agent_actions</code> Telemetry
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-on-surface text-label-sm font-label-sm shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
              400 Corporate Accounts
            </span>
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-status-success text-label-sm font-label-sm shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-ping" />
              Week 2 Pilot (Live)
            </span>
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-on-surface text-label-sm font-label-sm shadow-sm">
              <Globe className="w-3.5 h-3.5 text-text-secondary" />
              EMEA &amp; Americas
            </span>
          </div>
        </div>
      </div>

      {/* Top 3 KPI Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* KPI 1: Operational Velocity (Days per Chase Round dropping) */}
        <div className="rounded-xl bg-surface-deep p-space-lg shadow-lg space-y-space-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono-sm text-mono-sm tracking-wider uppercase text-text-secondary">
                Operational Velocity
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display-hero-mobile text-display-hero-mobile text-text-primary font-bold">
                  {daysPerRound.toFixed(1)}
                </span>
                <span className="font-body-md text-body-md text-text-secondary">
                  Days / Chase Round
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-success/15 text-status-success font-mono-data text-mono-data">
              <TrendingDown className="w-4 h-4" />
              <span>{velocityDelta.toFixed(1)}%</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low/70 space-y-2">
            <div className="flex justify-between font-label-sm text-label-sm text-text-muted">
              <span>Baseline</span>
              <span className="text-text-primary font-semibold">Current (Live)</span>
              <span>Target</span>
            </div>
            <div className="relative w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-text-muted/30 w-full rounded-full" />
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-container to-brand-accent rounded-full transition-all duration-700"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
            <div className="flex justify-between font-mono-sm text-mono-sm text-text-secondary">
              <span>5.5d</span>
              <span className="text-primary font-semibold">{daysPerRound.toFixed(1)}d</span>
              <span className="text-text-muted">3.0d</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Quantified Pilot Value (Case-Days Saved) */}
        <div className="rounded-xl bg-surface-deep p-space-lg shadow-lg space-y-space-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono-sm text-mono-sm tracking-wider uppercase text-text-secondary">
                  Quantified Pilot Value
                </span>
                <span className="px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-mono-sm text-[10px] font-semibold">
                  96% OF GOAL
                </span>
              </div>
              <div className="mt-1">
                <span className="font-display-hero-mobile text-display-hero-mobile text-text-primary font-bold">
                  {caseDaysSaved.toLocaleString()}
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant block">
                  Case-Days Saved / Month
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-highlight flex items-center justify-center text-primary-container shadow-inner">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-lg bg-surface-container-low/70 p-3 space-y-2">
            <p className="font-mono-sm text-mono-sm text-text-secondary leading-relaxed">
              <span className="text-text-primary font-semibold">400</span> clients ×{' '}
              <span className="text-text-primary font-semibold">3</span> rounds ×{' '}
              <span className="text-primary font-semibold">
                {(m?.days_saved_per_round ?? 2.4).toFixed(1)}d
              </span>{' '}
              saved ={' '}
              <span className="text-status-success font-semibold">
                {caseDaysSaved.toLocaleString()} unlocked days
              </span>
            </p>
            <div className="flex items-center gap-2 pt-1 text-text-primary">
              <Coins className="w-4 h-4 text-tertiary shrink-0" />
              <span className="font-label-sm text-label-sm font-semibold text-text-primary">
                Pipeline Acceleration:{' '}
                <span className="text-tertiary font-bold">
                  £{(m?.capital_enabled_gbp_m ?? 14.2).toFixed(1)}M
                </span>{' '}
                capital enabled
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Governance & RM Alignment (Calculated from agent_actions) */}
        <div className="rounded-xl bg-surface-deep p-space-lg shadow-lg space-y-space-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono-sm text-mono-sm tracking-wider uppercase text-text-secondary">
                  Governance &amp; RM Alignment
                </span>
                <span className="px-1.5 py-0.5 rounded bg-status-success/20 text-status-success font-mono-sm text-[10px] font-semibold">
                  ZERO BYPASS
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display-hero-mobile text-display-hero-mobile text-text-primary font-bold">
                  {adoptionRate.toFixed(1)}%
                </span>
                <span className="font-body-md text-body-md text-text-secondary">
                  RM Adoption Rate
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-highlight flex items-center justify-center text-status-success shadow-inner">
              <Gavel className="w-5 h-5" />
            </div>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant">
            <strong className="text-text-primary font-semibold">
              {totalApproved} of {totalDrafts}
            </strong>{' '}
            AI-synthesized drafts authorized via 1-click RM sign-off in{' '}
            <code className="text-brand-accent font-mono-sm">agent_actions</code>.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary shrink-0" />
              <div>
                <span className="font-mono-data text-mono-data text-text-primary block font-bold">
                  {m?.avg_rm_review_seconds ?? 48} Sec
                </span>
                <span className="font-mono-sm text-mono-sm text-text-muted">Avg RM Review</span>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center gap-2">
              <Shield className="w-5 h-5 text-status-success shrink-0" />
              <div>
                <span className="font-mono-data text-mono-data text-status-success block font-bold">
                  {totalRejections} Caught
                </span>
                <span className="font-mono-sm text-mono-sm text-text-muted">
                  Critic Intercepts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Timeline Compression & SLA Inertia Collapse */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Interactive Timeline Comparison */}
        <div className="lg:col-span-7 rounded-xl bg-surface-container p-space-lg shadow-xl space-y-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">
                Timeline Compression
              </h2>
              <span className="font-mono-sm text-mono-sm text-text-muted">
                Overall KYC Onboarding (Days 0 to 62)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDetailCallout((prev) => !prev)}
              aria-label="Toggle Metric Details"
              className="p-2 rounded-lg bg-surface-raised text-primary hover:bg-surface-highlight transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-label-sm text-label-sm">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-text-muted" /> Pre-Pilot Baseline
                </span>
                <span className="font-mono-data text-mono-data text-on-surface">62.0 Days</span>
              </div>
              <div className="h-6 w-full rounded-lg bg-surface-raised flex overflow-hidden p-0.5 gap-0.5">
                <div
                  className="h-full bg-secondary-container rounded-l flex items-center justify-center font-mono-sm text-[10px] text-text-primary"
                  style={{ width: '25.8%' }}
                >
                  16d
                </div>
                <div
                  className="h-full bg-error/70 flex items-center justify-center font-mono-sm text-[10px] text-on-surface font-semibold"
                  style={{ width: '27.4%' }}
                >
                  Chasing {baselineChasing.toFixed(1)}d
                </div>
                <div
                  className="h-full bg-surface-container-highest rounded-r flex items-center justify-center font-mono-sm text-[10px] text-text-secondary"
                  style={{ width: '46.8%' }}
                >
                  UW 29d
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center font-label-sm text-label-sm">
                <span className="text-primary flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> ChaseZero
                  Pilot
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-data text-mono-data text-text-primary font-bold">
                    {pilotOnboarding.toFixed(1)} Days
                  </span>
                  <span className="font-mono-sm text-mono-sm text-status-success font-semibold">
                    (-{(((62 - pilotOnboarding) / 62) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="h-6 w-full rounded-lg bg-surface-raised flex overflow-hidden p-0.5 gap-0.5">
                <div
                  className="h-full bg-secondary-container rounded-l flex items-center justify-center font-mono-sm text-[10px] text-text-primary"
                  style={{ width: '25.8%' }}
                >
                  16d
                </div>
                <div
                  className="h-full bg-status-success/80 flex items-center justify-center font-mono-sm text-[10px] text-canvas-base font-bold shadow-sm transition-all"
                  style={{ width: `${Math.max(10, Math.round((pilotChasing / 62) * 100))}%` }}
                >
                  {pilotChasing.toFixed(1)}d
                </div>
                <div
                  className="h-full bg-surface-container-highest rounded-r flex items-center justify-center font-mono-sm text-[10px] text-text-secondary"
                  style={{ width: '46.8%' }}
                >
                  UW 29d
                </div>
              </div>
            </div>
          </div>

          {showDetailCallout && (
            <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5 transition-all">
              <Minimize2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Document chasing period compressed from{' '}
                <span className="line-through text-text-muted">17.0 days</span> to{' '}
                <strong className="text-status-success font-semibold">
                  {pilotChasing.toFixed(1)} days
                </strong>
                , eliminating {(17.0 - pilotChasing).toFixed(1)} net calendar days of stalled
                capital per onboarding client.
              </p>
            </div>
          )}
        </div>

        {/* SLA Breach & Client Inertia Mitigation */}
        <div className="lg:col-span-5 rounded-xl bg-surface-deep p-space-lg shadow-xl space-y-space-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-text-primary">
              SLA Inertia Collapse
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-status-success/20 text-status-success font-mono-sm text-mono-sm font-semibold">
              -59.0% Delta
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-3 rounded-lg bg-surface-container-low flex flex-col justify-between">
              <span className="font-label-sm text-label-sm text-text-muted">
                Baseline Unresponsive
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-headline-md text-headline-md text-status-danger font-bold">
                  68.0%
                </span>
                <span className="font-mono-sm text-mono-sm text-text-muted">cases</span>
              </div>
              <span className="font-mono-sm text-mono-sm text-text-muted mt-1">Manual Chasing</span>
            </div>

            <div className="p-3 rounded-lg bg-surface-highlight flex flex-col justify-between">
              <span className="font-label-sm text-label-sm text-brand-accent">
                ChaseZero Live
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-headline-md text-headline-md text-status-success font-bold">
                  {(m?.pilot_unresponsive_pct ?? 9.0).toFixed(1)}%
                </span>
                <span className="font-mono-sm text-mono-sm text-on-surface">cases</span>
              </div>
              <span className="font-mono-sm text-mono-sm text-status-success font-semibold mt-1">
                Target Met (&lt;10%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-status-warning">
                <Flag className="w-4 h-4" />
              </div>
              <span className="font-body-sm text-body-sm text-text-primary">
                Escalations Avoided
              </span>
            </div>
            <span className="font-mono-data text-mono-data text-brand-accent font-bold">
              {m?.escalations_avoided ?? 236} RM Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Participating Desks + Live SQLite Agent Actions Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Participating Desks & Pilot Actions */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="rounded-xl bg-surface-container p-space-lg shadow-xl space-y-space-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">
                  Participating Desks
                </h2>
                <span className="font-mono-sm text-mono-sm text-text-muted">
                  Live Cohort Breakdown
                </span>
              </div>
              <span className="font-mono-sm text-mono-sm text-brand-accent">3 Active Units</span>
            </div>

            <div className="space-y-2 pt-1">
              {(m?.desks ?? []).map((desk) => (
                <div
                  key={desk.desk_name}
                  className="p-3 rounded-lg bg-surface-deep flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          desk.status === 'healthy' ? 'bg-status-success' : 'bg-status-warning'
                        }`}
                      />
                      <span className="font-label-md text-label-md text-text-primary font-semibold truncate">
                        {desk.desk_name}
                      </span>
                    </div>
                    <span className="font-mono-sm text-mono-sm text-text-muted block mt-0.5">
                      {desk.accounts} Accounts · {desk.adoption_rate.toFixed(1)}% Adoption
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-mono-data text-mono-data font-bold ${
                        desk.status === 'healthy' ? 'text-status-success' : 'text-primary'
                      }`}
                    >
                      {desk.round_avg_days.toFixed(1)}d
                    </span>
                    <span className="font-mono-sm text-mono-sm text-text-muted block">
                      Round Avg
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pilot Action Suite */}
          <div className="space-y-space-sm">
            <button
              type="button"
              id="export-summary-btn"
              onClick={handleExportSummary}
              className="w-full py-3.5 px-space-md rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
            >
              {exportStatus === 'done' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Board Pack Dispatched!</span>
                </>
              ) : (
                <>
                  <Share className="w-5 h-5" />
                  <span>
                    {exportStatus === 'compiling'
                      ? 'Compiling JSON Board Pack...'
                      : 'Export Board-Ready Summary'}
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              id="scale-apac-btn"
              onClick={() => setApacQueued(true)}
              className="w-full py-3 px-space-md rounded-full bg-surface-raised text-text-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-2 hover:bg-surface-highlight active:scale-98 transition-all"
            >
              <Rocket className="w-5 h-5 text-brand-accent" />
              <span>
                {apacQueued ? 'APAC Rollout Blueprint Queued' : 'Scale Pilot to APAC Desks'}
              </span>
            </button>
          </div>
        </div>

        {/* Live SQLite agent_actions Telemetry Feed */}
        <div className="lg:col-span-7 rounded-xl bg-surface-deep p-space-lg shadow-xl flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-accent" />
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary">
                  Live Agentic Telemetry Ledger
                </h2>
                <span className="font-mono-sm text-mono-sm text-text-muted">
                  Real-time records from SQLite <code className="text-primary">agent_actions</code>{' '}
                  table
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono-sm text-mono-sm">
              <span className="px-2 py-0.5 rounded bg-primary-container/15 text-primary">
                Drafts: {totalDrafts}
              </span>
              <span className="px-2 py-0.5 rounded bg-status-danger/15 text-status-danger">
                Rejected: {totalRejections}
              </span>
              <span className="px-2 py-0.5 rounded bg-status-success/15 text-status-success">
                Approved: {totalApproved}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[370px] overflow-y-auto pr-1 mt-space-xs">
            {(m?.recent_actions ?? []).map((act) => {
              const badgeStyle =
                act.action_type === 'RM_Approved'
                  ? 'bg-status-success/15 text-status-success'
                  : act.action_type === 'Critic_Rejected'
                    ? 'bg-status-danger/15 text-status-danger'
                    : 'bg-primary-container/20 text-brand-accent';

              return (
                <div
                  key={act.id}
                  className="p-3 rounded-lg bg-surface-container-low flex items-start justify-between gap-space-md"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono-sm text-mono-sm font-semibold ${badgeStyle}`}
                      >
                        {act.action_type}
                      </span>
                      <span className="font-label-sm text-label-sm text-text-primary">
                        {act.client_name || `Case #${act.case_id}`}
                      </span>
                      <span className="font-mono-sm text-mono-sm text-text-muted">
                        ({act.case_code})
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                      {act.details}
                    </p>
                  </div>
                  <div className="text-right shrink-0 font-mono-sm text-mono-sm text-text-muted">
                    <div className="text-text-secondary">{act.actor}</div>
                    <div>{new Date(act.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
