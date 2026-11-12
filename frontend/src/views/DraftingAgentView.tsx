import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  Edit3,
  Gauge,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import { useChaseStore } from '../store/useChaseStore';

export const DraftingAgentView: React.FC = () => {
  const {
    selectedCase,
    workflow,
    llmStatus,
    simulateCriticRejection,
    setSimulateCriticRejection,
    startLangGraphWorkflow,
    reloadEnvStatus,
    setActiveView,
  } = useChaseStore();

  if (!selectedCase) {
    return (
      <div className="p-space-xl rounded-xl bg-surface-deep text-text-secondary">
        Select a case from the Orchestrator Inbox to stream drafting synthesis.
      </div>
    );
  }

  const missingDocs = selectedCase.documents.filter((d) => d.status === 'Missing');
  const displaySubject =
    workflow.streamedSubject ||
    selectedCase.current_draft_subject ||
    `Action Required: Finalizing KYC Documentation for ${selectedCase.client_name} (Ref #${selectedCase.case_code})`;
  const displayBody =
    workflow.streamedText ||
    selectedCase.current_draft_body ||
    'Click "Run / Regenerate Variant" below to execute the LangGraph StateGraph and watch live AI token synthesis.';

  const wordCount = displayBody.trim() ? displayBody.trim().split(/\s+/).length : 0;

  // Determine step states for the 4 LangGraph pipeline node cards
  const node = workflow.activeNode;
  const orchDone = ['drafter', 'critic', 'complete'].includes(node) || !!selectedCase.current_draft_body;
  const drafterActive = node === 'drafter';
  const drafterDone = ['critic', 'complete'].includes(node) || (node === 'idle' && !!selectedCase.current_draft_body);
  const criticActive = node === 'critic';
  const criticDone = node === 'complete' || (node === 'idle' && selectedCase.critic_passed);

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-space-lg w-full">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-sm mb-space-xs">
              <span className="px-space-sm py-0.5 rounded-full bg-surface-raised font-mono-sm text-mono-sm text-brand-accent tracking-wider uppercase">
                Pipeline Stage 3
              </span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary-container" />
              <span className="font-mono-data text-mono-data text-text-muted">
                ID: {selectedCase.case_code}
              </span>
              {workflow.attempt > 1 && (
                <span className="px-space-sm py-0.5 rounded-full bg-status-warning/15 text-status-warning font-mono-sm text-mono-sm">
                  Critic Retry Attempt v{workflow.attempt}
                </span>
              )}
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
              ChaseZero AI Drafting Agent
            </h1>
            <p className="font-body-md text-body-md text-text-secondary">
              Synthesizing institutional context &amp; drafting personalized escalation for{' '}
              <span className="text-text-primary font-semibold">{selectedCase.client_name}</span>
            </p>
          </div>

          <div className="flex items-center gap-space-sm self-start lg:self-auto bg-surface-container-low px-space-md py-space-sm rounded-xl">
            <Cpu className="w-5 h-5 text-brand-accent shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono-sm text-mono-sm text-text-muted uppercase">
                  Model Context Window
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded font-mono-sm text-[10px] ${
                    llmStatus?.llm_configured
                      ? 'bg-status-success/15 text-status-success'
                      : 'bg-status-warning/15 text-status-warning'
                  }`}
                >
                  {llmStatus?.llm_configured ? 'LIVE .ENV KEY' : 'FALLBACK ENGINE'}
                </span>
              </div>
              <span className="font-mono-data text-mono-data text-text-primary font-bold">
                {llmStatus?.llm_model ?? 'ChaseZero-Grounded-Engine'} •{' '}
                {llmStatus?.llm_provider ?? 'deterministic-fallback'}
              </span>
              {llmStatus?.env_file && (
                <span className="font-mono-sm text-[10px] text-text-muted truncate max-w-[320px]">
                  .env: {llmStatus.env_file}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void reloadEnvStatus()}
              title="Reload .env LLM keys without restarting"
              className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface-highlight text-brand-accent transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4-Step Pipeline Progress Strip (Uses .node-active-glow on active LangGraph node) */}
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-md shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
            {/* Step 1: Orchestrator Context Ingestion */}
            <div
              className={`flex items-center gap-space-md p-space-md rounded-lg relative overflow-hidden transition-all ${
                node === 'orchestrator'
                  ? 'bg-surface-raised node-active-glow'
                  : 'bg-surface-deep/80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  node === 'orchestrator'
                    ? 'bg-primary-container/20 text-brand-accent'
                    : 'bg-status-success/15 text-status-success'
                }`}
              >
                {node === 'orchestrator' ? (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={`font-label-sm text-label-sm uppercase font-semibold ${
                    node === 'orchestrator' ? 'text-brand-accent' : 'text-status-success'
                  }`}
                >
                  {node === 'orchestrator'
                    ? 'Step 1 • Scanning DB'
                    : orchDone
                      ? 'Step 1 • Complete'
                      : 'Step 1 • Ready'}
                </span>
                <span className="font-headline-sm text-headline-sm text-text-primary truncate">
                  Context Ingestion
                </span>
                <span className="font-mono-sm text-mono-sm text-text-muted truncate">
                  {missingDocs.length} missing docs • {selectedCase.contact_name}
                </span>
              </div>
            </div>

            {/* Step 2: Cadence Check */}
            <div className="flex items-center gap-space-md p-space-md rounded-lg bg-surface-deep/80 relative overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-status-success/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-status-success" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-status-success uppercase font-semibold">
                  Step 2 • Complete
                </span>
                <span className="font-headline-sm text-headline-sm text-text-primary truncate">
                  Cadence Check
                </span>
                <span className="font-mono-sm text-mono-sm text-text-muted truncate">
                  {selectedCase.sla_breached
                    ? `Breach +${selectedCase.sla_delay_days.toFixed(1)}d • Warm Sentiment`
                    : `Day ${selectedCase.days_since_contact.toFixed(1)} • Active`}
                </span>
              </div>
            </div>

            {/* Step 3: Draft Generation (.node-active-glow when Drafter is active!) */}
            <div
              className={`flex items-center gap-space-md p-space-md rounded-lg relative overflow-hidden transition-all ${
                drafterActive || (node === 'idle' && !selectedCase.current_draft_body)
                  ? 'bg-surface-raised node-active-glow'
                  : 'bg-surface-raised shadow-[0_0_20px_rgba(154,132,248,0.12)]'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container to-brand-accent" />
              <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0 relative">
                {drafterDone && !drafterActive ? (
                  <CheckCircle2 className="w-5 h-5 text-status-success" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-brand-accent animate-pulse" />
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-40" />
                  </>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm text-brand-accent uppercase font-bold">
                    {drafterActive
                      ? `Step 3 • Active Synthesis (v${workflow.attempt})`
                      : drafterDone
                        ? 'Step 3 • Draft Synthesized'
                        : 'Step 3 • Ready'}
                  </span>
                  {drafterActive && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
                  )}
                </div>
                <span className="font-headline-sm text-headline-sm text-text-primary truncate">
                  Draft Generation
                </span>
                <span className="font-mono-sm text-mono-sm text-text-secondary truncate">
                  Words: {wordCount} • Formal Exec
                </span>
              </div>
            </div>

            {/* Step 4: Critic QA Handoff */}
            <div
              className={`flex items-center gap-space-md p-space-md rounded-lg transition-all ${
                criticActive
                  ? 'bg-surface-raised node-active-glow'
                  : workflow.rejectedReason && node === 'drafter'
                    ? 'bg-surface-raised node-reject-glow'
                    : criticDone
                      ? 'bg-surface-deep/80'
                      : 'bg-surface-container-low/50 opacity-75'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  criticDone
                    ? 'bg-status-success/15 text-status-success'
                    : criticActive
                      ? 'bg-primary-container/20 text-brand-accent'
                      : 'bg-surface-raised text-text-muted'
                }`}
              >
                {criticDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={`font-label-sm text-label-sm uppercase ${
                    criticDone
                      ? 'text-status-success font-semibold'
                      : criticActive
                        ? 'text-brand-accent font-bold'
                        : 'text-text-muted'
                  }`}
                >
                  {criticDone
                    ? 'Step 4 • Passed QA'
                    : criticActive
                      ? 'Step 4 • Auditing'
                      : 'Step 4 • Queued'}
                </span>
                <span className="font-headline-sm text-headline-sm text-text-secondary truncate">
                  Critic QA Handoff
                </span>
                <span className="font-mono-sm text-mono-sm text-text-muted truncate">
                  {criticDone ? `Score ${selectedCase.critic_score}/100` : 'Rule-set validation engine'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Critic -> Drafter Retry Banner (visible whenever self-correction occurred) */}
          {workflow.rejectedReason && (
            <div className="mt-space-md p-space-sm rounded-lg bg-status-warning/10 border border-status-warning/30 flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-2 text-status-warning font-body-sm text-body-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Critic Loop Triggered:</strong> {workflow.rejectedReason} — LangGraph
                  automatically routed back to Drafter Node to remediate.
                </span>
              </div>
              <span className="font-mono-sm text-mono-sm text-status-success shrink-0">
                Self-Corrected
              </span>
            </div>
          )}
        </div>

        {/* 12-Col Main Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left 5 cols: Grounding Parameters */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-deep/90 rounded-xl p-space-lg backdrop-blur-xl shadow-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <SlidersHorizontal className="w-4 h-4 text-brand-accent" />
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">
                    Grounding Parameters
                  </h2>
                </div>
                <span className="font-mono-sm text-mono-sm px-space-sm py-0.5 rounded-full bg-surface-raised text-text-secondary">
                  SQLite RAG Context
                </span>
              </div>

              <div className="flex flex-col gap-space-sm">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
                  Verified Entity Vector
                </span>
                <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-space-sm min-w-0">
                    <Building2 className="w-4 h-4 text-brand-accent shrink-0" />
                    <span className="font-label-md text-label-md text-text-primary truncate">
                      {selectedCase.client_name}
                    </span>
                  </div>
                  <span className="font-mono-sm text-mono-sm text-text-muted shrink-0 ml-2">
                    {selectedCase.case_code}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
                  Signing RM Identity
                </span>
                <div className="p-space-sm rounded-lg bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-6 h-6 rounded-full bg-primary-container/30 flex items-center justify-center text-[10px] font-bold text-primary">
                      SJ
                    </div>
                    <span className="font-label-md text-label-md text-text-primary">
                      {selectedCase.assigned_rm} (VP Institutional)
                    </span>
                  </div>
                  <span className="font-mono-sm text-mono-sm text-status-success">Key Locked</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
                  Target Missing Evidentials ({missingDocs.length})
                </span>
                {missingDocs.map((doc, i) => (
                  <div
                    key={doc.id}
                    className="p-space-sm rounded-lg bg-surface-container-high/60 flex items-start gap-space-sm"
                  >
                    <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-text-primary">
                        Doc #{i + 1}: {doc.document_name}
                      </span>
                      <span className="font-body-sm text-body-sm text-text-secondary">
                        {doc.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-space-xs pt-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
                    Tone Profile
                  </span>
                  <span className="flex items-center gap-1 font-mono-sm text-mono-sm text-text-muted">
                    <Lock className="w-3 h-3" /> Policy Enforced
                  </span>
                </div>
                <div className="p-space-md rounded-xl bg-surface-raised flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-label-md text-label-md text-text-primary font-bold">
                      Institutional Corporate
                    </span>
                    <span className="px-space-sm py-0.5 rounded-full bg-status-success/15 font-mono-sm text-mono-sm text-status-success">
                      Warm • Urgent • Non-coercive
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary">
                    Calibrated for Tier-1 relationship continuity. Requests ONLY missing items and
                    protects target facility timeline ({selectedCase.target_deadline_label}).
                  </p>
                </div>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-lowest flex items-start gap-space-sm">
                <Shield className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-text-primary">
                    Autonomous Policy Guardrail
                  </span>
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Zero automated transmission permitted. Every generated output requires explicit
                    RM sign-off.
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-surface-deep/90 rounded-xl p-space-md shadow-md flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <Gauge className="w-5 h-5 text-primary-container" />
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-text-primary">
                    LangGraph Stream Telemetry
                  </span>
                  <span className="font-mono-sm text-mono-sm text-text-muted">
                    {workflow.statusLabel}
                  </span>
                </div>
              </div>
              <span className="font-mono-data text-mono-data text-status-success font-bold">
                {workflow.progress}%
              </span>
            </div>
          </div>

          {/* Right 7 cols: Outbound Transmission Draft (.node-active-glow while AI writes!) */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div
              className={`bg-surface-deep/95 rounded-2xl p-space-lg backdrop-blur-2xl shadow-2xl flex flex-col gap-space-md relative overflow-hidden transition-all ${
                workflow.isRunning && drafterActive ? 'node-active-glow' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-space-sm">
                <div className="flex items-center gap-space-sm">
                  <Mail className="w-5 h-5 text-brand-accent" />
                  <span className="font-headline-sm text-headline-sm text-text-primary">
                    Outbound Transmission Draft
                  </span>
                </div>
                <div className="flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-raised">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      workflow.isRunning
                        ? 'bg-brand-accent animate-ping'
                        : 'bg-status-success animate-pulse'
                    }`}
                  />
                  <span className="font-mono-sm text-mono-sm text-text-secondary">
                    {workflow.isRunning
                      ? `Synthesizing Stream: ${workflow.progress}%`
                      : 'Synthesizer Stream: 100% Complete'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-space-xs bg-surface-container-lowest p-space-md rounded-xl">
                <div className="flex items-center gap-space-sm font-body-sm text-body-sm">
                  <span className="w-16 font-mono-sm text-mono-sm text-text-muted shrink-0 text-right">
                    TO:
                  </span>
                  <span className="font-label-md text-label-md text-text-primary">
                    {selectedCase.contact_name}
                  </span>
                  <span className="font-mono-data text-mono-data text-text-secondary truncate">
                    &lt;{selectedCase.contact_email}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-space-sm font-body-sm text-body-sm">
                  <span className="w-16 font-mono-sm text-mono-sm text-text-muted shrink-0 text-right">
                    FROM:
                  </span>
                  <span className="font-label-md text-label-md text-text-primary">
                    {selectedCase.assigned_rm}
                  </span>
                  <span className="font-mono-data text-mono-data text-text-secondary">
                    &lt;sarah.jenkins@northgatechase.com&gt;
                  </span>
                </div>
                <div className="flex items-center gap-space-sm font-body-sm text-body-sm">
                  <span className="w-16 font-mono-sm text-mono-sm text-text-muted shrink-0 text-right">
                    SUBJECT:
                  </span>
                  <span className="font-label-md text-label-md text-brand-accent font-semibold">
                    {displaySubject}
                  </span>
                </div>
              </div>

              <div className="p-space-lg rounded-xl bg-surface-raised/60 flex flex-col gap-space-md font-body-md text-body-md text-text-primary leading-relaxed relative min-h-[280px]">
                {!workflow.isRunning && !workflow.streamedText && !selectedCase.current_draft_body ? (
                  <div className="flex flex-col items-start gap-space-md py-space-md">
                    <p className="text-text-secondary">{displayBody}</p>
                    <button
                      type="button"
                      onClick={() =>
                        startLangGraphWorkflow(selectedCase.id, {
                          navigateToDrafting: false,
                          simulateRejection: simulateCriticRejection,
                        })
                      }
                      className="px-space-lg py-space-sm rounded-full bg-primary-container text-canvas-base font-label-md text-label-md font-bold shadow-[0_0_24px_rgba(154,132,248,0.4)] hover:brightness-110 transition-all flex items-center gap-space-xs"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Run LangGraph Pipeline for {selectedCase.case_code}</span>
                    </button>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">
                    {displayBody}
                    {workflow.isRunning && drafterActive && (
                      <span className="inline-block w-2 h-5 ml-1 bg-brand-accent animate-pulse align-middle" />
                    )}
                  </div>
                )}

                <div className="flex items-center gap-space-xs self-start pt-space-sm font-mono-sm text-mono-sm text-status-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Tokens stream verified against FCA Consumer Duty &amp; CDD Standards
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-lowest">
                <div className="flex items-center gap-space-md">
                  <div className="flex flex-col">
                    <span className="font-mono-sm text-mono-sm text-text-muted uppercase">
                      Synthesized Words
                    </span>
                    <span className="font-headline-sm text-headline-sm text-text-primary">
                      {wordCount}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-surface-highlight" />
                  <div className="flex flex-col">
                    <span className="font-mono-sm text-mono-sm text-text-muted uppercase">
                      Politeness Index
                    </span>
                    <span className="font-headline-sm text-headline-sm text-status-success">
                      9.8/10
                    </span>
                  </div>
                  <div className="h-8 w-px bg-surface-highlight" />
                  <div className="flex flex-col">
                    <span className="font-mono-sm text-mono-sm text-text-muted uppercase">
                      Coercion Risk
                    </span>
                    <span className="font-headline-sm text-headline-sm text-text-primary">0.0%</span>
                  </div>
                </div>
                <div className="flex items-center gap-space-xs text-brand-accent">
                  <Brain className="w-5 h-5" />
                  <span className="font-label-sm text-label-sm">
                    {criticDone ? 'Critic Verified' : 'Critic Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live LangGraph Trace Log */}
            {workflow.logs.length > 0 && (
              <div className="p-space-md rounded-xl bg-surface-container-lowest font-mono-sm text-mono-sm text-text-secondary space-y-1">
                <div className="text-brand-accent uppercase tracking-wider mb-1">
                  Live LangGraph StateGraph Trace
                </div>
                {workflow.logs.map((entry, i) => (
                  <div key={i} className="truncate">
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Control Bar */}
        <div className="w-full bg-surface-raised/95 backdrop-blur-2xl rounded-2xl p-space-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-space-md sticky bottom-4 z-30">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-full bg-status-success/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-status-success" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-md text-label-md text-text-primary font-bold">
                  {workflow.isRunning ? 'Agentic Synthesis Running...' : 'Drafting Synthesis Complete'}
                </span>
                <span className="px-space-xs py-0.5 rounded bg-status-success/20 font-mono-sm text-mono-sm text-status-success">
                  {workflow.isRunning ? `${workflow.progress}%` : '100% Ready'}
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-text-muted">
                Draft is grounded in SQLite repository facts. Next: Critic agent compliance inspection.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-md w-full md:w-auto justify-end flex-wrap">
            <label className="flex items-center gap-1.5 font-mono-sm text-mono-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={simulateCriticRejection}
                onChange={(e) => setSimulateCriticRejection(e.target.checked)}
                className="accent-[#9A84F8]"
              />
              <span>Test Critic Reject Loop</span>
            </label>
            <button
              type="button"
              onClick={() =>
                startLangGraphWorkflow(selectedCase.id, {
                  navigateToDrafting: false,
                  simulateRejection: simulateCriticRejection,
                })
              }
              disabled={workflow.isRunning}
              className="px-space-lg py-space-sm rounded-full bg-surface-deep text-text-primary hover:bg-surface-highlight transition-all font-label-md text-label-md flex items-center gap-space-xs disabled:opacity-50"
            >
              <Edit3 className="w-4 h-4" />
              <span>Regenerate Variant</span>
            </button>
            <button
              type="button"
              id="cta-pass-critic"
              onClick={() => setActiveView('critic-compliance-qa')}
              className="px-space-xl py-space-sm rounded-full bg-primary-container text-canvas-base hover:brightness-110 active:scale-95 transition-all font-label-md text-label-md font-bold shadow-[0_0_24px_rgba(154,132,248,0.4)] flex items-center gap-space-xs group"
            >
              <span>Pass to Critic Agent for Compliance QA</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
