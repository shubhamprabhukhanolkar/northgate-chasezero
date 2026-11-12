import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Brain,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileEdit,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { apiClient } from '../api/client';
import { useChaseStore } from '../store/useChaseStore';
import type { KycCase } from '../types/chasezero';

function getInitials(name: string): string {
  const parts = name
    .replace(/[^A-Za-z0-9\s]/g, '')
    .trim()
    .split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const OrchestratorInbox: React.FC = () => {
  const {
    summary,
    filterTab,
    setFilterTab,
    selectCase,
    startLangGraphWorkflow,
    setActiveView,
  } = useChaseStore();

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [exporting, setExporting] = useState(false);

  const allCases = summary?.cases ?? [];
  const filteredCases =
    regionFilter === 'ALL'
      ? allCases
      : allCases.filter((c) => c.region.toLowerCase().includes(regionFilter.toLowerCase()));

  const totalCases = summary?.total_active_cases ?? 8;
  const breachedCount = summary?.sla_breached_count ?? 0;
  const pendingRmCount = summary?.pending_rm_action_count ?? 0;
  const avgLatency = summary?.avg_chase_latency_days ?? 3.4;

  const topBreachedCases = allCases.filter((c) => c.sla_breached).slice(0, 3);

  const handleBatchChase = () => {
    const firstBreach = allCases.find((c) => c.sla_breached) ?? allCases[0];
    if (firstBreach) {
      startLangGraphWorkflow(firstBreach.id, { navigateToDrafting: true });
    }
  };

  const handleExportAuditLog = async () => {
    setExporting(true);
    try {
      const actions = await apiClient.getActions(100);
      const blob = new Blob([JSON.stringify(actions, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `northgate-chasezero-audit-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-primary-container/10 blur-[100px] pointer-events-none" />
        <div className="absolute -top-20 right-10 w-80 h-80 rounded-full bg-status-warning/5 blur-[90px] pointer-events-none" />

        {/* Header Section with Monospace Metadata and Asymmetric Layout */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mb-space-xl">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs mb-space-xs">
              <span className="font-mono-sm text-mono-sm text-brand-accent tracking-widest uppercase">
                System Orchestration Layer
              </span>
              <span className="text-text-muted">•</span>
              <span className="font-mono-sm text-mono-sm text-text-muted">
                POLL_CYCLE_REF: #994-EST
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
              KYC Orchestrator Inbox
            </h1>
            <p className="font-body-md text-body-md text-text-secondary mt-space-xs">
              Autonomous tracking across{' '}
              <span className="text-text-primary font-bold">
                {totalCases} active corporate onboarding pipelines
              </span>{' '}
              •{' '}
              <span className="text-status-warning font-semibold">
                {breachedCount} cases currently breaching 3-day reply SLA
              </span>
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-surface-raised text-text-primary font-label-md text-label-md hover:bg-surface-highlight transition-all shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 text-brand-accent" />
              <span>Rules Engine</span>
            </button>
            <button
              type="button"
              onClick={handleExportAuditLog}
              disabled={exporting}
              className="flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-surface-raised text-text-primary font-label-md text-label-md hover:bg-surface-highlight transition-all shadow-sm disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-brand-accent" />
              <span>{exporting ? 'Exporting...' : 'Export Audit Log'}</span>
            </button>
            <button
              type="button"
              onClick={handleBatchChase}
              className="flex items-center gap-space-xs px-space-lg py-space-sm rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md hover:opacity-95 transition-all shadow-[0_0_24px_rgba(154,132,248,0.25)]"
            >
              <Zap className="w-4 h-4" />
              <span>Batch Chase ({breachedCount} Breaches)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip with Glass Depth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter mb-space-xl">
          {/* Metric 1 */}
          <div className="p-space-lg rounded-xl bg-surface-deep shadow-md flex flex-col justify-between relative overflow-hidden group hover:bg-surface-raised/80 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono-sm text-mono-sm text-text-muted tracking-wide uppercase">
                Active Onboarding Cases
              </span>
              <Building2 className="w-5 h-5 text-text-secondary" />
            </div>
            <div className="flex items-baseline gap-space-sm mt-space-md">
              <span className="font-display-hero-mobile text-display-hero-mobile text-text-primary font-bold tracking-tight">
                {totalCases}
              </span>
              <span className="font-label-sm text-label-sm text-status-success flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +3 this wk
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-space-md overflow-hidden">
              <div className="bg-primary-container h-full rounded-full w-[70%]" />
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-space-lg rounded-xl bg-surface-deep shadow-md flex flex-col justify-between relative overflow-hidden group hover:bg-surface-raised/80 transition-all">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-status-warning/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="font-mono-sm text-mono-sm text-status-warning tracking-wide uppercase font-semibold">
                SLA Breached (&gt;3 Days)
              </span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-warning opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-warning" />
              </span>
            </div>
            <div className="flex items-baseline gap-space-sm mt-space-md">
              <span className="font-display-hero-mobile text-display-hero-mobile text-status-warning font-bold tracking-tight">
                {breachedCount}
              </span>
              <span className="font-label-sm text-label-sm text-status-danger flex items-center font-medium">
                Requires RM Sign-off
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-space-md overflow-hidden">
              <div
                className="bg-status-warning h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((breachedCount / Math.max(1, totalCases)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-space-lg rounded-xl bg-surface-deep shadow-md flex flex-col justify-between relative overflow-hidden group hover:bg-surface-raised/80 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono-sm text-mono-sm text-text-muted tracking-wide uppercase">
                Pending RM Action
              </span>
              <Clock className="w-5 h-5 text-text-secondary" />
            </div>
            <div className="flex items-baseline gap-space-sm mt-space-md">
              <span className="font-display-hero-mobile text-display-hero-mobile text-text-primary font-bold tracking-tight">
                {pendingRmCount}
              </span>
              <span className="font-label-sm text-label-sm text-brand-accent">
                Draft_Ready in outbox
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-space-md overflow-hidden">
              <div className="bg-brand-accent h-full rounded-full w-[45%]" />
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-space-lg rounded-xl bg-surface-deep shadow-md flex flex-col justify-between relative overflow-hidden group hover:bg-surface-raised/80 transition-all">
            <div className="flex items-center justify-between">
              <span className="font-mono-sm text-mono-sm text-text-muted tracking-wide uppercase">
                Avg Chase Latency
              </span>
              <span className="font-mono-sm text-mono-sm text-text-muted">Target: 3.0d</span>
            </div>
            <div className="flex items-end justify-between mt-space-sm">
              <div>
                <span className="font-display-hero-mobile text-display-hero-mobile text-text-primary font-bold tracking-tight">
                  {avgLatency.toFixed(1)}
                </span>
                <span className="font-headline-sm text-headline-sm text-text-secondary ml-1">
                  d
                </span>
              </div>
              <div className="w-24 h-9">
                <svg className="w-full h-full text-status-warning" fill="none" viewBox="0 0 100 40">
                  <path
                    d="M0 32 L20 28 L40 35 L60 20 L80 25 L100 8"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M0 32 L20 28 L40 35 L60 20 L80 25 L100 8 V40 H0 Z"
                    fill="currentColor"
                    fillOpacity="0.1"
                  />
                </svg>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1 rounded-full mt-space-md overflow-hidden">
              <div className="bg-status-danger h-full rounded-full w-[78%]" />
            </div>
          </div>
        </div>

        {/* AI Intelligence Notification Banner */}
        <div className="mb-space-xl p-space-md lg:p-space-lg rounded-xl bg-surface-raised shadow-md flex flex-col md:flex-row md:items-center justify-between gap-space-md relative overflow-hidden">
          <div className="absolute -left-10 top-0 bottom-0 w-2 bg-gradient-to-b from-brand-accent to-primary-container" />
          <div className="flex items-start md:items-center gap-space-md min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest text-brand-accent">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-label-md text-label-md text-text-primary">
                  ChaseZero Intelligence Agent
                </span>
                <span className="font-mono-sm text-mono-sm px-space-xs rounded bg-surface-deep text-text-secondary">
                  SCAN: 08:00 EST
                </span>
                <span className="font-mono-sm text-mono-sm text-status-warning font-semibold">
                  {breachedCount} Breaches Detected
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-text-secondary truncate mt-0.5">
                Automated SQLite scan indicates institutional accounts breaching the 3-day contact
                SLA. LangGraph drafting pipeline primed for 1-click orchestration.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('executive-success-dashboard')}
              className="px-space-md py-space-xs rounded-full bg-surface-deep hover:bg-surface-highlight text-text-primary font-label-sm text-label-sm transition-colors"
            >
              View Anomaly Vectors
            </button>
            <button
              type="button"
              onClick={handleBatchChase}
              className="px-space-md py-space-xs rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold hover:opacity-95 transition-all"
            >
              Trigger Auto-Queue
            </button>
          </div>
        </div>

        {/* Main Workspace Layout: Filter Tabs & Complex Worklist Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
          {/* Primary Cases Table (Left 9 cols) */}
          <div className="xl:col-span-9 flex flex-col gap-space-md">
            {/* Table Filter Tabs Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-sm bg-surface-deep p-space-xs rounded-xl">
              <div className="flex items-center gap-space-xs overflow-x-auto py-space-xs px-space-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={
                    filterTab === 'all'
                      ? 'px-space-md py-space-xs rounded-full bg-surface-raised font-label-sm text-label-sm text-text-primary whitespace-nowrap shadow-sm'
                      : 'px-space-md py-space-xs rounded-full hover:bg-surface-raised font-label-sm text-label-sm text-text-secondary whitespace-nowrap transition-colors'
                  }
                >
                  All Active <span className="font-mono-sm text-text-muted ml-1">{totalCases}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('breached')}
                  className={
                    filterTab === 'breached'
                      ? 'px-space-md py-space-xs rounded-full bg-status-warning/20 font-label-sm text-label-sm text-status-warning whitespace-nowrap font-bold flex items-center gap-1.5 ring-1 ring-status-warning/40'
                      : 'px-space-md py-space-xs rounded-full bg-status-warning/15 font-label-sm text-label-sm text-status-warning whitespace-nowrap font-bold flex items-center gap-1.5'
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-status-warning" />
                  SLA Breached (&gt;3 Days){' '}
                  <span className="font-mono-sm ml-1 font-bold">{breachedCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('draft_ready')}
                  className={
                    filterTab === 'draft_ready'
                      ? 'px-space-md py-space-xs rounded-full bg-surface-raised font-label-sm text-label-sm text-brand-accent whitespace-nowrap shadow-sm font-semibold'
                      : 'px-space-md py-space-xs rounded-full hover:bg-surface-raised font-label-sm text-label-sm text-text-secondary whitespace-nowrap transition-colors'
                  }
                >
                  Draft Ready{' '}
                  <span className="font-mono-sm text-text-muted ml-1">{pendingRmCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('completed')}
                  className={
                    filterTab === 'completed'
                      ? 'px-space-md py-space-xs rounded-full bg-surface-raised font-label-sm text-label-sm text-status-success whitespace-nowrap shadow-sm font-semibold'
                      : 'px-space-md py-space-xs rounded-full hover:bg-surface-raised font-label-sm text-label-sm text-text-secondary whitespace-nowrap transition-colors'
                  }
                >
                  On Schedule / Completed
                </button>
              </div>

              <div className="flex items-center gap-space-xs px-space-xs">
                <button
                  type="button"
                  onClick={() =>
                    setRegionFilter((prev) =>
                      prev === 'ALL' ? 'UK' : prev === 'UK' ? 'US' : 'ALL'
                    )
                  }
                  className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-high hover:bg-surface-highlight font-label-sm text-label-sm text-text-secondary transition-colors"
                >
                  <span>Region: {regionFilter}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-space-xs px-space-sm py-space-xs rounded-lg bg-surface-container-high font-label-sm text-label-sm text-text-secondary">
                  <span>RM: Sarah J.</span>
                </div>
              </div>
            </div>

            {/* Case Cards List */}
            <div className="flex flex-col gap-space-sm">
              {filteredCases.length === 0 ? (
                <div className="p-space-xl rounded-xl bg-surface-deep text-center text-text-secondary">
                  No KYC cases match the current filter. Try switching back to &ldquo;All Active&rdquo;.
                </div>
              ) : (
                filteredCases.map((kycCase, index) => (
                  <CaseCardRow
                    key={kycCase.id}
                    kycCase={kycCase}
                    isPrimaryFocus={index === 0 && kycCase.sla_breached}
                    onInspect={() => void selectCase(kycCase.id, 'case-tracker')}
                    onRunAgent={() => startLangGraphWorkflow(kycCase.id, { navigateToDrafting: true })}
                  />
                ))
              )}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between pt-space-sm px-space-xs text-text-muted font-mono-sm text-mono-sm">
              <span>
                Showing {filteredCases.length} of {totalCases} Corporate Entities
              </span>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  className="p-space-xs rounded bg-surface-deep text-text-secondary hover:bg-surface-raised"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-space-sm text-text-primary">1 / 1</span>
                <button
                  type="button"
                  className="p-space-xs rounded bg-surface-deep text-text-secondary hover:bg-surface-raised"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Batch Intelligence Drawer & Autonomous Orchestrator Health (3 cols) */}
          <div className="xl:col-span-3 flex flex-col gap-space-md">
            <div className="p-space-lg rounded-xl bg-surface-deep shadow-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <span className="font-mono-sm text-mono-sm text-brand-accent uppercase tracking-wider">
                  Engine Status
                </span>
                <span className="flex items-center gap-1 font-mono-sm text-mono-sm text-status-success">
                  <span className="h-2 w-2 rounded-full bg-status-success" />
                  Live Sync
                </span>
              </div>
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-text-primary">
                  Chasing Execution Protocol
                </span>
                <p className="font-body-sm text-body-sm text-text-muted">
                  Tone adapts dynamically based on client hierarchy, jurisdiction sensitivity, and
                  existing relationship warmth.
                </p>
              </div>
              <div className="flex flex-col gap-space-sm pt-space-xs">
                <div className="flex justify-between items-center text-body-sm">
                  <span className="text-text-secondary">Politeness Score</span>
                  <span className="font-mono-data text-status-success">9.8/10</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-status-success h-full w-[98%] rounded-full" />
                </div>
                <div className="flex justify-between items-center text-body-sm mt-1">
                  <span className="text-text-secondary">Legal Accuracy</span>
                  <span className="font-mono-data text-primary">100%</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-container h-full w-full rounded-full" />
                </div>
                <div className="flex justify-between items-center text-body-sm mt-1">
                  <span className="text-text-secondary">Client Response Rate</span>
                  <span className="font-mono-data text-text-primary">84.2%</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="bg-brand-accent h-full w-[84%] rounded-full" />
                </div>
              </div>
              <div className="p-space-sm rounded-lg bg-surface-container-lowest/80 mt-space-xs">
                <span className="font-mono-sm text-mono-sm text-text-muted block">
                  Next Automated Scan
                </span>
                <span className="font-mono-data text-mono-data text-text-primary font-semibold">
                  12:00:00 EST (Active Watchdog)
                </span>
              </div>
            </div>

            {/* Priority Breakdown / Donut Card */}
            <div className="p-space-lg rounded-xl bg-surface-deep shadow-md flex flex-col gap-space-md">
              <span className="font-mono-sm text-mono-sm text-text-muted uppercase tracking-wider">
                Delay Attribution
              </span>
              <div className="flex items-center gap-space-md">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-high"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4.5"
                    />
                    <path
                      className="text-status-warning"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="65, 100"
                      strokeLinecap="round"
                      strokeWidth="4.5"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono-data text-mono-data text-status-warning font-bold">
                    65%
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-text-primary">
                    {topBreachedCases.length} High-Impact Accounts
                  </span>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Accountable for majority of cycle friction
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-space-xs text-body-sm pt-space-xs">
                {topBreachedCases.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <span className="text-text-secondary truncate">{c.client_name}</span>
                    <span className="font-mono-sm text-status-warning shrink-0">
                      +{c.sla_delay_days}d latency
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RM Productivity Safety Card */}
            <div className="p-space-lg rounded-xl bg-surface-deep shadow-md flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm">
                <Brain className="w-5 h-5 text-brand-accent" />
                <span className="font-label-md text-label-md text-text-primary">
                  Human-In-The-Loop Safety
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-text-secondary">
                Zero emails leave the perimeter without explicit Relationship Manager digital
                authorization.
              </p>
              <div className="p-space-sm rounded-lg bg-surface-raised flex items-center gap-space-sm">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                <span className="font-mono-sm text-mono-sm text-text-muted">
                  Strict Rule: SEC &amp; FinCEN Compliant
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Engine Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-canvas-base/80 backdrop-blur-md flex items-center justify-center p-space-md">
          <div className="w-full max-w-lg rounded-2xl bg-surface-raised p-space-lg shadow-2xl border border-white/10 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-text-primary">
                Orchestrator SLA &amp; LangGraph Rules
              </span>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="font-mono-sm text-mono-sm text-text-muted hover:text-text-primary"
              >
                CLOSE
              </button>
            </div>
            <div className="space-y-2 font-body-sm text-body-sm text-text-secondary">
              <div className="p-space-sm rounded-lg bg-surface-deep">
                <span className="text-brand-accent font-mono-sm block">RULE 01 • SLA TRIGGER</span>
                Cases with <code className="text-text-primary">last_contact_date &gt; 3 days</code>{' '}
                and status != Completed are automatically flagged for ChaseZero orchestration.
              </div>
              <div className="p-space-sm rounded-lg bg-surface-deep">
                <span className="text-brand-accent font-mono-sm block">RULE 02 • CRITIC GATE</span>
                Critic Node verifies 100% missing-document grounding and zero credit commitments;
                rejections automatically route back to Drafter Node.
              </div>
              <div className="p-space-sm rounded-lg bg-surface-deep">
                <span className="text-brand-accent font-mono-sm block">RULE 03 • HITL MANDATE</span>
                Final status transition to <code className="text-text-primary">Completed</code>{' '}
                requires explicit RM approval in the HITL Dispatch Gateway.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CaseCardRowProps {
  kycCase: KycCase;
  isPrimaryFocus: boolean;
  onInspect: () => void;
  onRunAgent: () => void;
}

const CaseCardRow: React.FC<CaseCardRowProps> = ({
  kycCase,
  isPrimaryFocus,
  onInspect,
  onRunAgent,
}) => {
  const missingDocs = kycCase.documents.filter((d) => d.status === 'Missing');
  const initials = getInitials(kycCase.client_name);

  if (kycCase.sla_breached) {
    return (
      <div className="p-space-lg rounded-xl bg-surface-deep shadow-md flex flex-col gap-space-md transition-all relative overflow-hidden group hover:bg-surface-raised">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-status-warning" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-md min-w-0">
            <div
              className={`h-12 w-12 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 font-headline-sm font-bold ${
                isPrimaryFocus ? 'text-primary-container' : 'text-text-secondary'
              }`}
            >
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-headline-sm text-headline-sm text-text-primary font-bold truncate">
                  {kycCase.client_name}
                </span>
                <span className="px-space-xs py-0.5 rounded bg-surface-highlight font-mono-sm text-mono-sm text-text-secondary">
                  LEI: {kycCase.lei}
                </span>
                <span className="px-space-xs py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-brand-accent">
                  {kycCase.entity_type}
                </span>
              </div>
              <div className="flex items-center gap-space-md mt-1 flex-wrap">
                <span className="font-body-sm text-body-sm text-text-muted flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Onboarding: Day {kycCase.days_open} / 62
                </span>
                <span className="text-text-muted">•</span>
                <span className="font-body-sm text-body-sm text-status-danger font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Last Client Contact:{' '}
                  {kycCase.days_since_contact.toFixed(1)} days ago
                </span>
                <span className="text-text-muted">•</span>
                <span className="font-mono-sm text-mono-sm text-text-muted">
                  Round #{kycCase.chase_round_count} • {kycCase.case_code}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-md shrink-0 self-end lg:self-center flex-wrap">
            <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-status-warning/15 text-status-warning">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-warning opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-warning" />
              </span>
              <span className="font-label-sm text-label-sm font-bold tracking-tight">
                3-Day SLA Breached (+{kycCase.sla_delay_days.toFixed(1)}d delay)
              </span>
            </div>

            <button
              type="button"
              onClick={onInspect}
              className={
                isPrimaryFocus
                  ? 'flex items-center gap-space-xs px-space-lg py-space-sm rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(154,132,248,0.3)]'
                  : 'flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-surface-raised text-text-primary font-label-md text-label-md hover:bg-surface-highlight transition-all'
              }
            >
              {isPrimaryFocus ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <FileEdit className="w-4 h-4 text-brand-accent" />
              )}
              <span>Review Missing Docs &amp; Draft Chase</span>
            </button>
          </div>
        </div>

        {/* Missing Docs Micro-Tray */}
        <div className="pt-space-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest/60 p-space-sm rounded-lg">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="font-mono-sm text-mono-sm text-text-muted uppercase tracking-wide">
              Missing Documentation ({missingDocs.length}):
            </span>
            {missingDocs.map((doc) => (
              <span
                key={doc.id}
                className="px-space-sm py-0.5 rounded-full bg-status-danger/10 text-status-danger font-label-sm text-label-sm flex items-center gap-1"
              >
                <Clock className="w-3 h-3" /> {doc.document_name}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-space-sm text-text-muted font-mono-sm text-mono-sm shrink-0">
            <span className="text-brand-accent">Status: {kycCase.status}</span>
            <button
              type="button"
              onClick={onRunAgent}
              className="px-2.5 py-1 rounded-full bg-surface-raised hover:bg-surface-highlight text-primary font-mono-sm transition-colors"
            >
              Quick Run LangGraph
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Draft_Ready / On Schedule / Completed Card
  const isCompleted = kycCase.status === 'Completed';
  const isDraftReady = kycCase.status === 'Draft_Ready';

  return (
    <div className="p-space-lg rounded-xl bg-surface-deep/70 shadow-md flex flex-col gap-space-sm transition-all relative overflow-hidden group hover:bg-surface-raised">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex items-start gap-space-md min-w-0">
          <div className="h-12 w-12 rounded-xl bg-surface-container-high/60 flex items-center justify-center text-text-muted shrink-0 font-headline-sm font-bold">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-headline-sm text-headline-sm text-text-primary font-medium truncate">
                {kycCase.client_name}
              </span>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-text-secondary">
                {kycCase.entity_type}
              </span>
              <span className="px-space-xs py-0.5 rounded bg-surface-highlight font-mono-sm text-mono-sm text-text-muted">
                {kycCase.case_code}
              </span>
            </div>
            <div className="flex items-center gap-space-md mt-1 flex-wrap">
              <span className="font-body-sm text-body-sm text-text-muted">
                Onboarding: Day {kycCase.days_open}
              </span>
              <span className="text-text-muted">•</span>
              <span className="font-body-sm text-body-sm text-text-secondary">
                Last Contact: {kycCase.days_since_contact.toFixed(1)} days ago
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-md shrink-0 self-end lg:self-center">
          <div
            className={`flex items-center gap-space-xs px-space-md py-space-xs rounded-full ${
              isDraftReady
                ? 'bg-primary-container/15 text-primary'
                : 'bg-status-success/10 text-status-success'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isDraftReady ? 'bg-primary' : 'bg-status-success'
              }`}
            />
            <span className="font-label-sm text-label-sm font-semibold">
              {isCompleted
                ? 'Completed • Chase Dispatched'
                : isDraftReady
                  ? 'Draft_Ready • Pending RM Sign-off'
                  : `On Schedule (${Math.max(0.1, 3 - kycCase.days_since_contact).toFixed(1)}d left)`}
            </span>
          </div>
          <button
            type="button"
            onClick={onInspect}
            className="flex items-center gap-space-xs px-space-md py-space-sm rounded-full bg-surface-raised/70 text-text-secondary font-label-md text-label-md hover:bg-surface-highlight hover:text-text-primary transition-all"
          >
            <span>View Case</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
