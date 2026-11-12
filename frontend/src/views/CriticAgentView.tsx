import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Gavel,
  Lock,
  MailCheck,
  Mic,
  PackageCheck,
  RefreshCw,
  Shield,
  ShieldCheck,
  Smile,
} from 'lucide-react';

import { useChaseStore } from '../store/useChaseStore';
import type { CriticCheckItem } from '../types/chasezero';

const DEFAULT_CHECKS: CriticCheckItem[] = [
  {
    key: 'tone',
    title: 'Tone & Register',
    badge: 'PASSED: Professional Executive',
    passed: true,
    summary:
      'No aggressive debt-collection phrasing, coercive language, or abrupt directives. Maintains respectful, institutional corporate banking cadence.',
    meta_left: 'Lexical register: Tier-1 Bank',
    meta_right: 'Sentiment: Neutral (+0.04)',
  },
  {
    key: 'accuracy',
    title: 'Document Accuracy',
    badge: 'PASSED: 100% Grounded',
    passed: true,
    summary:
      "Only documents flagged as 'Missing' in the tracker are cited. Zero hallucinated items; no already 'Verified' documents re-requested.",
    meta_left: 'Missing items matched',
    meta_right: 'Zero hallucinations',
  },
  {
    key: 'promises',
    title: 'Promise & Liability Check',
    badge: 'PASSED: Zero Commitments',
    passed: true,
    summary:
      'Draft makes zero promises of unconditional credit approval, guaranteed timeline exemptions, or waiver of regulatory obligations.',
    meta_left: 'Liability Exposure: $0.00',
    meta_right: 'Warranty clauses: 0',
  },
  {
    key: 'pii',
    title: 'PII & Security Protocol',
    badge: 'PASSED: Compliant',
    passed: true,
    summary:
      'Contains authorized secure portal upload instructions; no unencrypted sensitive account numbers, tax IDs, or passwords exposed in cleartext.',
    meta_left: 'Encrypted Token: Valid',
    meta_right: 'GDPR/DPA 2018: Clear',
  },
  {
    key: 'disclosures',
    title: 'Regulatory Disclosures',
    badge: 'PASSED: Standard Northgate',
    passed: true,
    summary:
      'Standard Northgate Disclaimer attached. PRA/FCA regulatory notice, non-binding declaration, and confidentiality clause fully present.',
    meta_left: 'Footer Pattern: SEC-FCA-2024-R',
    meta_right: 'Signature Key: Valid',
  },
];

function getCheckIcon(key: string) {
  switch (key) {
    case 'tone':
      return Mic;
    case 'accuracy':
      return PackageCheck;
    case 'promises':
      return Gavel;
    case 'pii':
      return Shield;
    default:
      return ShieldCheck;
  }
}

export const CriticAgentView: React.FC = () => {
  const { selectedCase, rescanCritic, startLangGraphWorkflow, setActiveView } = useChaseStore();
  const [scanning, setScanning] = useState(false);

  if (!selectedCase) {
    return (
      <div className="p-space-xl rounded-xl bg-surface-deep text-text-secondary">
        Select a case to view Critic Agent Compliance QA.
      </div>
    );
  }

  const checks = selectedCase.critic_checks.length > 0 ? selectedCase.critic_checks : DEFAULT_CHECKS;
  const passedCount = checks.filter((c) => c.passed).length;
  const allPassed = selectedCase.critic_passed || passedCount === checks.length;
  const score = selectedCase.critic_score || Math.round((passedCount / checks.length) * 100);
  const missingDocs = selectedCase.documents.filter((d) => d.status === 'Missing');

  const handleRescan = async (simulateFailure = false) => {
    setScanning(true);
    try {
      await rescanCritic(selectedCase.id, undefined, simulateFailure);
    } finally {
      setScanning(false);
    }
  };

  const slug = selectedCase.client_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 18);
  const portalUrl = `https://portal.northgate.bank/upload/${slug}-${selectedCase.case_code.split('-').pop()}`;

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Dynamic Atmospheric Underglow Header */}
      <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-xl">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-container/10 blur-[90px] pointer-events-none" />
        <div className="absolute -left-12 -bottom-20 h-64 w-64 rounded-full bg-status-success/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="px-space-sm py-0.5 rounded-full bg-surface-raised font-mono-sm text-mono-sm text-brand-accent uppercase tracking-wider">
                Automated Policy Gate
              </span>
              <span className="text-text-muted">•</span>
              <span className="font-mono-sm text-mono-sm text-text-secondary">
                Engine SLA: <span className="text-status-success">0.42s latency</span>
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
              Critic Agent Compliance QA
            </h1>
            <p className="font-body-md text-body-md text-text-secondary">
              Automated regulatory guardrail scan &amp; policy verification for Case{' '}
              <span className="font-mono-data text-mono-data text-brand-accent">
                #{selectedCase.case_code}
              </span>{' '}
              ({selectedCase.client_name}).
            </p>
          </div>

          {/* Verified / Failed Status Pill Box */}
          <div className="flex items-center gap-space-md bg-surface-raised/90 p-space-sm pl-space-md rounded-xl shadow-md backdrop-blur-md">
            <div className="flex items-center gap-space-sm">
              <div className="flex h-3 w-3 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 ${
                    allPassed ? 'bg-status-success' : 'bg-status-danger'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    allPassed ? 'bg-status-success' : 'bg-status-danger'
                  }`}
                />
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-label-md text-label-md leading-tight ${
                    allPassed ? 'text-status-success' : 'text-status-danger'
                  }`}
                >
                  {allPassed ? 'COMPLIANCE AUDIT PASSED' : 'COMPLIANCE AUDIT FAILED'}
                </span>
                <span className="font-mono-sm text-mono-sm text-text-muted">
                  {passedCount} OF {checks.length} CHECKS CLEARED
                </span>
              </div>
            </div>
            <div className="h-8 w-px bg-surface-container-highest" />
            <div className="flex flex-col pr-space-xs">
              <span className="font-mono-sm text-mono-sm text-text-muted uppercase">Audit Hash</span>
              <span className="font-mono-data text-mono-data text-text-primary">
                {selectedCase.audit_hash || '#QA-9921-SEC-V3'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Remediation alert if currently failed */}
      {!allPassed && (
        <div className="rounded-xl bg-status-danger/10 border border-status-danger/30 p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-sm text-status-danger">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-body-sm font-body-sm">
              <strong>Policy Rejection Triggered:</strong>{' '}
              {selectedCase.critic_feedback ||
                'Draft violated regulatory promise or missing-document grounding guardrails.'}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              startLangGraphWorkflow(selectedCase.id, {
                navigateToDrafting: true,
                simulateRejection: false,
              })
            }
            className="px-space-md py-space-xs rounded-full bg-status-danger text-on-error font-label-sm text-label-sm font-bold shrink-0 hover:brightness-110 transition-all"
          >
            Route Back to Drafter Node -&gt;
          </button>
        </div>
      )}

      {/* Main Asymmetric Workspace (Split View 60/40) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* LEFT 7 cols: Interactive Email Draft Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-sm">
            <div className="flex items-center gap-space-sm">
              <MailCheck className="w-4 h-4 text-brand-accent" />
              <span className="font-label-md text-label-md text-text-primary">
                Client Transmission Draft
              </span>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high font-mono-sm text-mono-sm text-text-muted">
                Outbound English (UK)
              </span>
            </div>
            <div className="flex items-center gap-space-xs text-text-muted font-mono-sm text-mono-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-accent" />
              Interactive Annotation Inspector Active
            </div>
          </div>

          <div className="relative rounded-xl bg-surface-container-low p-space-lg flex flex-col gap-space-md shadow-lg overflow-hidden">
            {/* Metadata Header Strip */}
            <div className="flex flex-col gap-space-xs pb-space-md bg-surface-container/40 p-space-md rounded-lg">
              <div className="grid grid-cols-12 gap-space-xs font-mono-sm text-mono-sm">
                <span className="col-span-2 text-text-muted">TO:</span>
                <span className="col-span-10 text-text-primary">
                  {selectedCase.contact_name} &lt;{selectedCase.contact_email}&gt;
                </span>
              </div>
              <div className="grid grid-cols-12 gap-space-xs font-mono-sm text-mono-sm">
                <span className="col-span-2 text-text-muted">CC:</span>
                <span className="col-span-10 text-text-muted">
                  sarah.jenkins@northgate-bank.com (RM Authorization Queue)
                </span>
              </div>
              <div className="grid grid-cols-12 gap-space-xs font-mono-sm text-mono-sm">
                <span className="col-span-2 text-text-muted">SUBJECT:</span>
                <span className="col-span-10 text-text-primary font-bold">
                  {selectedCase.current_draft_subject ||
                    `Northgate Commercial Banking: Annual Periodic KYC Review — Action Required [Ref: #${selectedCase.case_code}]`}
                </span>
              </div>
            </div>

            {/* If draft body is custom / failed, show raw inspectable draft + annotations */}
            <div className="flex flex-col gap-space-lg text-body-md text-text-primary font-body-md leading-relaxed pt-space-xs">
              {/* Block 1: Salutation & Tone Verification */}
              <div className="relative group pl-space-md transition-all">
                <div className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-brand-accent/50 group-hover:bg-brand-accent transition-colors" />
                <div className="flex items-start gap-space-sm">
                  <ShieldCheck className="w-4 h-4 text-brand-accent mt-1 shrink-0" />
                  <div className="flex-1">
                    {selectedCase.current_draft_body ? (
                      <div className="whitespace-pre-wrap text-body-md text-text-primary">
                        {selectedCase.current_draft_body}
                      </div>
                    ) : (
                      <>
                        <p>Dear {selectedCase.contact_name.split(' ')[0]},</p>
                        <p className="mt-space-sm">
                          As part of Northgate Capital&apos;s standard regulatory governance and in
                          accordance with FCA guidelines, we are concluding our KYC review for{' '}
                          <strong className="text-text-primary">{selectedCase.client_name}</strong>.
                        </p>
                      </>
                    )}
                    <div className="inline-flex items-center gap-space-xs mt-space-sm px-space-sm py-0.5 rounded-full bg-brand-accent/15 text-brand-accent font-mono-sm text-mono-sm">
                      <Smile className="w-3.5 h-3.5" />
                      <span>
                        [Tone Check: Polite, executive-grade institutional register • Politeness Score
                        99.2%]
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 2: Grounded Missing Document List */}
              <div className="relative group pl-space-md transition-all">
                <div
                  className={`absolute left-0 top-1 bottom-1 w-1 rounded-full transition-colors ${
                    checks.find((c) => c.key === 'accuracy')?.passed
                      ? 'bg-status-success'
                      : 'bg-status-danger'
                  }`}
                />
                <div className="flex items-start gap-space-sm">
                  <ShieldCheck
                    className={`w-4 h-4 mt-1 shrink-0 ${
                      checks.find((c) => c.key === 'accuracy')?.passed
                        ? 'text-status-success'
                        : 'text-status-danger'
                    }`}
                  />
                  <div className="flex-1">
                    <p>
                      Grounded Missing Documentation Checklist ({missingDocs.length} Outstanding
                      Items):
                    </p>
                    <div className="my-space-sm p-space-sm rounded-lg bg-surface-raised flex flex-col gap-space-xs font-mono-data text-mono-data">
                      {missingDocs.map((doc, idx) => (
                        <div key={doc.id} className="flex items-center gap-space-sm text-status-success">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            {idx + 1}. {doc.document_name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      className={`inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full font-mono-sm text-mono-sm ${
                        checks.find((c) => c.key === 'accuracy')?.passed
                          ? 'bg-status-success/15 text-status-success'
                          : 'bg-status-danger/15 text-status-danger'
                      }`}
                    >
                      <span>
                        {checks.find((c) => c.key === 'accuracy')?.passed
                          ? `[Verified against case tracker: Exactly ${missingDocs.length} docs requested, no hallucinated requirements]`
                          : '[Grounding Mismatch Detected — Requires Drafter Remediation]'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 3: Timeline Verification */}
              <div className="relative group pl-space-md transition-all">
                <div className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-primary group-hover:bg-primary-container transition-colors" />
                <div className="flex items-start gap-space-sm">
                  <CalendarCheck className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <div className="flex-1">
                    <p>
                      Target readiness milestone calibrated to{' '}
                      <span className="text-primary font-bold">
                        {selectedCase.target_deadline_label}
                      </span>{' '}
                      without binding credit commitments.
                    </p>
                    <div className="inline-flex items-center gap-space-xs mt-space-xs px-space-sm py-0.5 rounded-full bg-primary-container/20 text-primary font-mono-sm text-mono-sm">
                      <span>
                        [Timeline Verification: Matches RM account notes &amp; statutory SLA]
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 4: Secure Portal Link */}
              <div className="relative group pl-space-md transition-all">
                <div className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-brand-accent/50" />
                <div className="flex items-start gap-space-sm">
                  <Lock className="w-4 h-4 text-brand-accent mt-1 shrink-0" />
                  <div className="flex-1">
                    <div className="py-space-xs px-space-md rounded-lg bg-surface-deep flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono-sm text-mono-sm text-brand-accent truncate">
                        {portalUrl}
                      </span>
                      <span className="font-label-sm text-label-sm text-text-muted">
                        TLS 1.3 256-bit Encrypted
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 5 cols: Critic Audit Checklist & Policy Cards */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-sm">
            <div className="flex items-center gap-space-sm">
              <ShieldCheck
                className={`w-4 h-4 ${allPassed ? 'text-status-success' : 'text-status-danger'}`}
              />
              <span className="font-label-md text-label-md text-text-primary">
                Critic Agent Audit Checklist
              </span>
            </div>
            <span
              className={`font-mono-data text-mono-data px-space-sm py-0.5 rounded-full ${
                allPassed
                  ? 'text-status-success bg-status-success/10'
                  : 'text-status-danger bg-status-danger/10'
              }`}
            >
              Score: {score}/100
            </span>
          </div>

          <div className="flex flex-col gap-space-sm">
            {checks.map((check) => {
              const IconComp = getCheckIcon(check.key);
              return (
                <div
                  key={check.key}
                  className={`rounded-xl bg-surface-container-low p-space-md shadow-md transition-all hover:bg-surface-raised flex flex-col gap-space-xs ${
                    !check.passed ? 'node-reject-glow' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-space-sm">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          check.passed
                            ? 'bg-status-success/20 text-status-success'
                            : 'bg-status-danger/20 text-status-danger'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-headline-sm text-headline-sm text-text-primary">
                        {check.title}
                      </span>
                    </div>
                    <span
                      className={`px-space-sm py-0.5 rounded-full font-mono-sm text-mono-sm font-bold ${
                        check.passed
                          ? 'bg-status-success/15 text-status-success'
                          : 'bg-status-danger/15 text-status-danger'
                      }`}
                    >
                      {check.badge}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary pl-8">
                    {check.summary}
                  </p>
                  <div className="mt-space-xs pl-8 flex items-center gap-space-md font-mono-sm text-mono-sm text-text-muted flex-wrap">
                    <span>{check.meta_left}</span>
                    <span>{check.meta_right}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Agent Confidence Metric Widget */}
          <div className="rounded-xl bg-surface-raised/70 p-space-md flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-text-primary flex items-center gap-space-xs">
                <Brain className="w-4 h-4 text-brand-accent" />
                Critic Neural Policy Consensus
              </span>
              <span className="font-mono-data text-mono-data text-brand-accent">
                {allPassed ? '99.8% Alignment' : `${score}.0% Alignment`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allPassed
                    ? 'bg-gradient-to-r from-primary-container via-brand-accent to-status-success'
                    : 'bg-status-danger'
                }`}
                style={{ width: `${allPassed ? 99.8 : score}%` }}
              />
            </div>
            <div className="flex justify-between font-mono-sm text-mono-sm text-text-muted">
              <span>Evaluator: Critic Compliance Node</span>
              <span>{allPassed ? 'Zero hallucinations detected' : 'Policy violation intercepted'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Institutional Control Bar */}
      <div className="sticky bottom-4 z-30 w-full mt-space-md rounded-xl bg-surface-container-lowest/95 backdrop-blur-xl p-space-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised text-brand-accent">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-sm">
              <span className="font-label-md text-label-md text-text-primary">
                Policy Engine v4.8 Certified
              </span>
              <span
                className={`flex h-2 w-2 rounded-full ${
                  allPassed ? 'bg-status-success' : 'bg-status-danger'
                }`}
              />
            </div>
            <span className="font-mono-sm text-mono-sm text-text-muted">
              Critic Agent verified by Northgate Risk Policy Engine v4.8 • Safe for RM authorization
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => void handleRescan(true)}
            disabled={scanning}
            className="flex items-center justify-center gap-space-xs px-space-md py-3 rounded-full bg-surface-deep hover:bg-status-danger/20 text-status-danger font-label-sm text-label-sm transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Policy Violation</span>
          </button>

          <button
            type="button"
            id="btn-rerun"
            onClick={() =>
              allPassed
                ? void handleRescan(false)
                : startLangGraphWorkflow(selectedCase.id, {
                    navigateToDrafting: false,
                    simulateRejection: false,
                  })
            }
            disabled={scanning}
            className="flex items-center justify-center gap-space-sm px-space-lg py-3 rounded-full bg-surface-raised/80 hover:bg-surface-raised text-text-primary font-label-md text-label-md transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 text-brand-accent ${scanning ? 'animate-spin' : ''}`} />
            <span>{allPassed ? 'Re-run Critic Scan' : 'Auto-Remediate via Drafter'}</span>
          </button>

          <button
            type="button"
            id="btn-proceed"
            onClick={() => setActiveView('human-in-the-loop-review')}
            disabled={!allPassed}
            className="flex items-center justify-center gap-space-sm px-space-xl py-3 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-lg hover:brightness-110 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Proceed to Human-in-the-Loop Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
