import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  Bot,
  Building2,
  CheckCheck,
  Clock,
  FolderKanban,
  Gavel,
  Headphones,
  History,
  Hourglass,
  Mail,
  RotateCcw,
  X,
  Zap,
} from 'lucide-react';

import { useChaseStore } from '../store/useChaseStore';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export const CaseTracker: React.FC = () => {
  const {
    summary,
    selectedCase,
    selectCase,
    toggleDocumentStatus,
    startLangGraphWorkflow,
    resetCaseDemo,
    updateCaseNote,
    simulateCriticRejection,
    setSimulateCriticRejection,
  } = useChaseStore();

  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  if (!selectedCase) {
    return (
      <div className="p-space-xl rounded-xl bg-surface-deep text-text-secondary">
        Loading case telemetry...
      </div>
    );
  }

  const missingDocs = selectedCase.documents.filter((d) => d.status === 'Missing');
  const cadencePct = Math.min(100, Math.round((selectedCase.days_open / 62) * 1000) / 10);

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Quick Case Switcher Bar (Non-intrusive helper to jump between DB cases) */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm px-space-sm">
        <div className="flex items-center gap-space-xs flex-wrap">
          <span className="font-mono-sm text-mono-sm text-text-muted uppercase mr-1">
            Active Case:
          </span>
          {(summary?.cases ?? []).slice(0, 5).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => void selectCase(c.id)}
              className={`px-space-sm py-1 rounded-full font-mono-sm text-mono-sm transition-colors ${
                c.id === selectedCase.id
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'bg-surface-deep text-text-secondary hover:bg-surface-raised'
              }`}
            >
              {c.case_code} • {c.client_name.split(' ')[0]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void resetCaseDemo(selectedCase.id)}
          className="flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-deep hover:bg-surface-raised text-text-secondary hover:text-text-primary font-mono-sm text-mono-sm transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-brand-accent" />
          <span>Reset Case to SLA Breach</span>
        </button>
      </div>

      {/* Case Header & Hero Banner */}
      <section className="relative w-full rounded-xl overflow-hidden bg-surface-raised p-space-lg shadow-xl backdrop-blur-xl">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary-container/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex flex-wrap items-center gap-space-sm">
              <span className="font-mono-data text-mono-data px-space-sm py-space-xs rounded-full bg-surface-deep text-brand-accent">
                {selectedCase.case_code}
              </span>
              <span
                className={`px-space-sm py-space-xs rounded-full font-label-sm text-label-sm flex items-center gap-1 ${
                  selectedCase.status === 'Completed'
                    ? 'bg-status-success/15 text-status-success'
                    : selectedCase.sla_breached
                      ? 'bg-status-danger/15 text-status-danger'
                      : 'bg-primary-container/20 text-primary'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {selectedCase.status === 'Completed'
                  ? 'Completed • Dispatched'
                  : selectedCase.status === 'Draft_Ready'
                    ? 'Draft_Ready'
                    : selectedCase.sla_breached
                      ? 'Stalled Case (SLA Breach)'
                      : 'Active Case'}
              </span>
              <span className="px-space-sm py-space-xs rounded-full bg-surface-container text-text-secondary font-label-sm text-label-sm">
                {selectedCase.jurisdiction}
              </span>
              <span className="px-space-sm py-space-xs rounded-full bg-surface-highlight text-primary font-mono-sm text-mono-sm">
                {selectedCase.desk}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight mt-space-xs">
              {selectedCase.client_name}
            </h1>
            <p className="font-body-sm text-body-sm text-text-muted flex items-center gap-space-xs flex-wrap">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>
                {selectedCase.address} • LEI: {selectedCase.lei} • {selectedCase.facility_value}{' '}
                Facility
              </span>
            </p>
          </div>

          {/* Timeline Metric Card */}
          <div className="flex flex-col gap-space-xs bg-surface-deep p-space-md rounded-xl min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-text-secondary">
                Onboarding Cadence
              </span>
              <span className="font-mono-data text-mono-data text-status-warning">
                Day {selectedCase.days_open} of 62
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden relative">
              <div
                className="h-full bg-status-warning rounded-full transition-all duration-500"
                style={{ width: `${cadencePct}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-status-success"
                style={{ left: '56.4%' }}
                title="Target: 35 Days"
              />
            </div>
            <div className="flex items-center justify-between text-text-muted font-mono-sm text-mono-sm pt-0.5">
              <span>T+0 Initiation</span>
              <span className="text-status-success">Target: 35 days</span>
              <span>Max: 62 days</span>
            </div>
          </div>
        </div>
      </section>

      {/* Explicit Scope & Regulatory Boundary Notice */}
      <aside className="relative overflow-hidden rounded-xl bg-surface-deep p-space-md shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-accent" />
        <div className="flex items-start gap-space-md pl-space-xs">
          <div className="p-space-xs rounded-lg bg-surface-raised text-brand-accent mt-0.5">
            <Gavel className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-label-md text-label-md text-text-primary">
                Scope &amp; Regulatory Boundary Protocol
              </span>
              <span className="font-mono-sm text-mono-sm px-2 py-0.5 rounded bg-surface-raised text-primary">
                Compliance Directive 4.8
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
              ChaseZero monitors communication cadence and autonomously drafts follow-up requests.{' '}
              <span className="text-text-primary font-medium">
                Document authenticity, PEP sanctions checks, and final verification are strictly
                owned and executed by Senior Compliance Analysts.
              </span>{' '}
              AI agents hold zero authorization to clear KYC checkpoints or bypass analyst
              verification queues.
            </p>
          </div>
        </div>
      </aside>

      {/* Main 3-Column Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Column 1: Required KYC Document Checklist (Span 6) */}
        <div className="lg:col-span-6 flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-space-sm">
              <FolderKanban className="w-5 h-5 text-primary" />
              <h2 className="font-headline-sm text-headline-sm text-text-primary">
                Required KYC Document Matrix
              </h2>
            </div>
            <span className="font-mono-sm text-mono-sm text-text-muted">
              {selectedCase.documents.length} Items • Click badge to toggle status
            </span>
          </div>

          <div className="flex flex-col gap-space-sm">
            {selectedCase.documents.map((doc, idx) => {
              const isMissing = doc.status === 'Missing';
              const isVerified = doc.status === 'Verified';
              const isPrimaryMissing = isMissing && idx === 0;

              return (
                <div
                  key={doc.id}
                  className={
                    isMissing
                      ? 'group relative rounded-xl bg-surface-raised p-space-md shadow-md transition-all hover:bg-surface-highlight'
                      : 'relative rounded-xl bg-surface-deep/80 p-space-md shadow-sm transition-all hover:bg-surface-deep'
                  }
                >
                  <div className="flex items-start justify-between gap-space-md">
                    <div className="flex items-start gap-space-sm">
                      <div
                        className={`p-space-xs rounded-lg mt-0.5 ${
                          isVerified
                            ? 'bg-status-success/10 text-status-success'
                            : isPrimaryMissing
                              ? 'bg-status-danger/10 text-status-danger'
                              : isMissing
                                ? 'bg-status-warning/10 text-status-warning'
                                : 'bg-primary-container/20 text-brand-accent'
                        }`}
                      >
                        {isVerified ? (
                          <BadgeCheck className="w-4 h-4" />
                        ) : isPrimaryMissing ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : isMissing ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <Hourglass className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-text-primary">
                          {idx + 1}. {doc.document_name}
                        </span>
                        {isVerified ? (
                          <div className="flex items-center gap-space-xs mt-1">
                            <span className="font-body-sm text-body-sm text-status-success">
                              {doc.assigned_to_or_verifier}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`font-body-sm text-body-sm mt-1 ${
                              isPrimaryMissing ? 'text-status-danger' : 'text-text-secondary'
                            }`}
                          >
                            {doc.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void toggleDocumentStatus(selectedCase.id, doc.id)}
                      title="Click to cycle document status (Missing / Received / Verified)"
                      className={`shrink-0 font-mono-data text-mono-data px-2.5 py-1 rounded-full flex items-center gap-1 transition-transform hover:scale-105 ${
                        isVerified
                          ? 'bg-status-success/20 text-status-success'
                          : isPrimaryMissing
                            ? 'bg-status-danger/20 text-status-danger'
                            : isMissing
                              ? 'bg-status-warning/20 text-status-warning'
                              : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {isVerified && <CheckCheck className="w-3.5 h-3.5" />}
                      <span>
                        {isVerified
                          ? 'VERIFIED'
                          : isPrimaryMissing
                            ? `MISSING • Chased ${Math.round(selectedCase.days_since_contact)}d ago`
                            : isMissing
                              ? 'MISSING • Outstanding'
                              : 'RECEIVED • In Queue'}
                      </span>
                    </button>
                  </div>

                  <div className="mt-space-sm pt-space-xs flex items-center justify-between text-text-muted font-mono-sm text-mono-sm">
                    <span>{doc.requirement_meta}</span>
                    <span className={isMissing ? 'text-status-warning' : ''}>
                      {isVerified ? `Doc ID: ${doc.doc_code}` : doc.assigned_to_or_verifier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: SLA & Communication Timeline (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-space-sm">
              <History className="w-5 h-5 text-primary" />
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Chase Cadence</h2>
            </div>
            <span className="font-mono-sm text-mono-sm text-status-danger">Breach Log</span>
          </div>

          <div className="flex flex-col p-space-md rounded-xl bg-surface-raised shadow-md relative">
            <div className="absolute left-7 top-7 bottom-7 w-0.5 bg-surface-container-highest" />

            <div className="relative flex items-start gap-space-md mb-space-lg">
              <div className="relative z-10 w-6 h-6 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-accent" />
              </div>
              <div className="flex flex-col gap-0.5 pt-0.5">
                <span className="font-label-sm text-label-sm text-text-primary">
                  Round #{selectedCase.chase_round_count} ({selectedCase.days_since_contact.toFixed(1)}{' '}
                  days ago)
                </span>
                <p className="font-body-sm text-body-sm text-text-secondary leading-snug">
                  Prior KYC documentation request dispatched to counterparty.
                </p>
                <span className="font-mono-sm text-mono-sm text-text-muted mt-1">
                  Recipient: {selectedCase.contact_name}
                </span>
              </div>
            </div>

            <div className="relative flex items-start gap-space-md mb-space-lg">
              <div className="relative z-10 w-6 h-6 rounded-full bg-surface-raised flex items-center justify-center shrink-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedCase.sla_breached ? 'bg-status-danger' : 'bg-status-success'
                  }`}
                />
              </div>
              <div className="flex flex-col gap-0.5 pt-0.5">
                <span
                  className={`font-label-sm text-label-sm font-semibold ${
                    selectedCase.sla_breached ? 'text-status-danger' : 'text-status-success'
                  }`}
                >
                  {selectedCase.sla_breached ? '3-Day SLA Breach' : 'Within 3-Day SLA Window'}
                </span>
                <p className="font-body-sm text-body-sm text-text-secondary leading-snug">
                  {selectedCase.sla_breached
                    ? `Exceeded 3.0-day threshold (+${selectedCase.sla_delay_days.toFixed(1)}d) without inbound upload.`
                    : 'Monitoring inbound counterparty document portal.'}
                </p>
                <span className="font-mono-sm text-mono-sm text-status-danger mt-1">
                  {missingDocs.length} Missing Docs Remaining
                </span>
              </div>
            </div>

            <div className="relative flex items-start gap-space-md">
              <div className="relative z-10 w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(154,132,248,0.5)]">
                <Zap className="w-3.5 h-3.5 text-canvas-base" />
              </div>
              <div className="flex flex-col gap-0.5 pt-0.5">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-primary font-semibold">
                    Current State
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-status-danger/20 text-status-danger font-mono-sm text-mono-sm">
                    {selectedCase.status}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-text-primary leading-snug">
                  Queued for ChaseZero LangGraph Orchestrator -&gt; Drafter -&gt; Critic pipeline.
                </p>
                <span className="font-mono-sm text-mono-sm text-brand-accent mt-1">
                  Awaiting RM Launch
                </span>
              </div>
            </div>
          </div>

          <div className="p-space-md rounded-xl bg-surface-deep shadow-sm flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm text-text-secondary">
              Expected Closing Window
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-headline-sm text-headline-sm text-text-primary">
                {Math.max(1, 35 - selectedCase.days_open)} Days Left
              </span>
              <span className="font-mono-data text-mono-data text-status-warning">
                Target: {selectedCase.target_deadline_label}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-muted mt-1">
              {selectedCase.relationship_notes}
            </p>
          </div>
        </div>

        {/* Column 3: Action & Recipient Summary (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-space-sm">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="font-headline-sm text-headline-sm text-text-primary">
                Target &amp; Action
              </h2>
            </div>
            <span className="font-mono-sm text-mono-sm text-text-muted">Step 2 of 4</span>
          </div>

          <div className="flex flex-col gap-space-md p-space-md rounded-xl bg-surface-raised shadow-xl">
            <div className="flex flex-col gap-space-sm pb-space-sm">
              <span className="font-mono-sm text-mono-sm text-text-muted uppercase tracking-wider">
                Primary Counterparty
              </span>
              <div className="flex items-center gap-space-sm">
                <div className="w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-headline-sm font-semibold shrink-0">
                  {getInitials(selectedCase.contact_name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-text-primary truncate">
                    {selectedCase.contact_name}
                  </span>
                  <span className="font-body-sm text-body-sm text-text-secondary truncate">
                    {selectedCase.contact_role}
                  </span>
                  <span className="font-mono-sm text-mono-sm text-brand-accent truncate mt-0.5">
                    {selectedCase.contact_email}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-deep text-text-secondary font-mono-sm text-mono-sm">
                <span className="w-2 h-2 rounded-full bg-status-success" />
                <span>Corporate Key Authority Verified</span>
              </div>
            </div>

            <div className="flex flex-col gap-space-xs p-space-sm rounded-lg bg-surface-deep">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-secondary">
                  Outstanding Payload
                </span>
                <span className="font-mono-data text-mono-data text-status-danger font-semibold">
                  {missingDocs.length} Docs Missing
                </span>
              </div>
              <ul className="flex flex-col gap-1 text-text-primary font-body-sm text-body-sm mt-1 list-none pl-0">
                {missingDocs.map((doc, idx) => (
                  <li key={doc.id} className="flex items-center gap-1.5 text-text-secondary">
                    <X
                      className={`w-3.5 h-3.5 shrink-0 ${
                        idx === 0 ? 'text-status-danger' : 'text-status-warning'
                      }`}
                    />
                    <span className="truncate">{doc.document_name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-1 text-text-muted font-mono-sm text-mono-sm">
              <div className="flex justify-between">
                <span>Tone Vector:</span>
                <span className="text-text-primary">Institutional Firm • High Stakes</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Channel:</span>
                <span className="text-text-primary">Encrypted Corporate Email</span>
              </div>
              <div className="flex justify-between">
                <span>Follow-up Window:</span>
                <span className="text-text-primary">48 Hours SLA</span>
              </div>
            </div>

            {/* Optional Demo Toggle for Critic -> Drafter Self-Correction Loop */}
            <label className="flex items-center justify-between gap-2 p-space-sm rounded-lg bg-surface-deep/80 cursor-pointer">
              <span className="font-mono-sm text-mono-sm text-text-secondary">
                Demo Critic Reject -&gt; Retry Loop
              </span>
              <input
                type="checkbox"
                checked={simulateCriticRejection}
                onChange={(e) => setSimulateCriticRejection(e.target.checked)}
                className="w-4 h-4 accent-[#9A84F8] cursor-pointer"
              />
            </label>

            <button
              type="button"
              id="launchDraftBtn"
              onClick={() =>
                startLangGraphWorkflow(selectedCase.id, {
                  navigateToDrafting: true,
                  simulateRejection: simulateCriticRejection,
                })
              }
              className="w-full py-space-sm px-space-md rounded-full bg-primary-container text-canvas-base font-label-md text-label-md font-semibold transition-all duration-200 hover:brightness-110 active:scale-95 shadow-[0_0_24px_rgba(154,132,248,0.4)] flex items-center justify-center gap-space-sm"
            >
              <Bot className="w-5 h-5" />
              <span>Launch Drafting Agent ({missingDocs.length} Docs)</span>
            </button>
            <span className="text-center font-mono-sm text-mono-sm text-text-muted">
              Generates human-in-the-loop review package before sending
            </span>
          </div>

          <div className="flex flex-col gap-space-xs p-space-sm rounded-xl bg-surface-deep/60 px-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <Headphones className="w-4 h-4 text-text-secondary" />
                <span className="font-label-sm text-label-sm text-text-secondary">
                  Assigned RM: {selectedCase.assigned_rm}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNoteDraft(selectedCase.relationship_notes);
                  setEditingNote((prev) => !prev);
                }}
                className="text-primary hover:text-brand-accent transition-colors font-mono-sm text-mono-sm"
              >
                {editingNote ? 'Cancel' : 'Edit Case Note'}
              </button>
            </div>
            {editingNote && (
              <div className="flex flex-col gap-2 pt-1">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-surface-container p-2 text-body-sm font-body-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await updateCaseNote(selectedCase.id, noteDraft);
                    setEditingNote(false);
                  }}
                  className="self-end px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm font-semibold"
                >
                  Save Note to DB
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
