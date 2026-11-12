import React, { useEffect, useRef, useState } from 'react';
import {
  AlarmClock,
  Bold,
  BookmarkPlus,
  Building2,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Gavel,
  Italic,
  Link2,
  List,
  ListOrdered,
  Lock,
  Mail,
  MailCheck,
  MessageSquare,
  Paperclip,
  Quote,
  RotateCcw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  StickyNote,
  Trash2,
  Underline,
  X,
} from 'lucide-react';

import { useChaseStore } from '../store/useChaseStore';
import type { ApproveDispatchResponse } from '../types/chasezero';

export const HitlReviewView: React.FC = () => {
  const {
    selectedCase,
    adjustTone,
    approveAndSend,
    resetCaseDemo,
    setActiveView,
  } = useChaseStore();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ccList, setCcList] = useState<string[]>([
    'Marcus Vance (KYC Analyst)',
    'legal-approvals@northgate.com',
  ]);
  const [newCc, setNewCc] = useState('');
  const [notifyAnalyst, setNotifyAnalyst] = useState(true);
  const [editStatus, setEditStatus] = useState('All edits autosaved to draft buffer');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchModal, setDispatchModal] = useState<ApproveDispatchResponse | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const insertFormat = (prefix: string, suffix = '') => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const selected = body.slice(start, end) || 'item';
    const next = body.slice(0, start) + prefix + selected + suffix + body.slice(end);
    handleBodyChange(next);
  };

  useEffect(() => {
    if (!selectedCase) return;
    setSubject(
      selectedCase.current_draft_subject ||
        `Action Required: Finalizing KYC Documentation for ${selectedCase.client_name} (Ref #${selectedCase.case_code})`
    );
    setBody(
      selectedCase.current_draft_body ||
        `Dear ${selectedCase.contact_name.split(' ')[0]},\n\nPlease upload the missing KYC documents to your encrypted Northgate Secure Client Workspace.\n\nWarm regards,\nSarah Jenkins`
    );
  }, [selectedCase]);

  if (!selectedCase) {
    return (
      <div className="p-space-xl rounded-xl bg-surface-deep text-text-secondary">
        Select a case to review and authorize outbound transmission.
      </div>
    );
  }

  const missingDocs = selectedCase.documents.filter((d) => d.status === 'Missing');
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  const handleBodyChange = (val: string) => {
    setBody(val);
    setEditStatus('Unsaved RM customizations...');
    window.setTimeout(() => {
      setEditStatus('All edits autosaved to draft buffer');
    }, 600);
  };

  const handleAddCc = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newCc.trim()) {
      e.preventDefault();
      setCcList((prev) => [...prev, newCc.trim()]);
      setNewCc('');
    }
  };

  const handleToneClick = async (tone: string) => {
    await adjustTone(selectedCase.id, tone);
  };

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      const res = await approveAndSend(selectedCase.id, {
        subject,
        body,
        notify_analyst: notifyAnalyst,
        cc_emails: ccList,
      });
      setDispatchModal(res);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-space-lg w-full max-w-[1400px] mx-auto pb-space-2xl">
        {/* Top Metadata Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-raised font-mono-sm text-mono-sm text-brand-accent">
                <ShieldCheck className="w-3.5 h-3.5" />
                STAGE 5: RM DISPATCH GATEWAY
              </span>
              <span className="font-mono-sm text-mono-sm text-text-muted">
                Case #{selectedCase.case_code}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
              Human-in-the-Loop Review &amp; Authorization
            </h1>
            <p className="font-body-md text-body-md text-text-secondary">
              {selectedCase.client_name} <span className="text-text-muted">•</span> Legal Entity
              ID: <span className="font-mono-data text-mono-data text-primary">{selectedCase.lei}</span>
            </p>
          </div>

          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm px-space-md py-space-sm rounded-xl bg-surface-container-low shadow-sm">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary-container/30 border border-brand-accent/40 flex items-center justify-center font-label-md text-primary font-bold">
                  SJ
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-status-success ring-2 ring-surface-container-low" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-text-primary">
                  {selectedCase.assigned_rm}
                </span>
                <span className="font-mono-sm text-mono-sm text-brand-accent">
                  {selectedCase.status === 'Completed'
                    ? 'RM Dispatch Authorized'
                    : 'RM Sign-off Required'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Governance Banner (Zero Auto-Sending Principle) */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-surface-raised via-surface-container to-surface-raised p-space-md shadow-md">
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <div className="flex items-start md:items-center justify-between gap-space-md relative z-10">
            <div className="flex items-start gap-space-md">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-status-warning/15 flex items-center justify-center text-status-warning mt-0.5 md:mt-0">
                <Gavel className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <span className="font-label-md text-label-md text-text-primary">
                    Human Accountability Principle
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-status-warning/20 text-status-warning font-mono-sm text-mono-sm uppercase tracking-wider">
                    Zero Auto-Send Mandate
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary max-w-4xl">
                  ChaseZero never dispatches external client communications autonomously. You are
                  reviewing, customizing, and transmitting this outreach as the designated
                  Relationship Manager under Northgate Conduct Risk Guidelines.
                </p>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-1 flex-shrink-0">
              <span className="font-mono-sm text-mono-sm text-text-muted">
                Policy Code: NCR-FIN-66A
              </span>
              <span className="font-mono-data text-mono-data text-status-success flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Compliant Protocol
              </span>
            </div>
          </div>
        </div>

        {/* Main Workspace Bento Layout: Composer (8 cols) + Side Inspector (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Composer Pane (Left - 8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <div className="rounded-xl bg-surface-container-low shadow-xl overflow-hidden flex flex-col">
              {/* Composer Header & Recipient Meta */}
              <div className="p-space-lg bg-surface-deep flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <Mail className="w-5 h-5 text-brand-accent" />
                    <span className="font-headline-sm text-headline-sm text-text-primary">
                      Outbound Chase Dispatcher
                    </span>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <span className="px-2.5 py-1 rounded-full bg-surface-raised font-mono-sm text-mono-sm text-text-secondary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      Active RM Draft
                    </span>
                  </div>
                </div>

                {/* TO Row */}
                <div className="flex items-center gap-space-md bg-surface-container-lowest/70 px-space-md py-space-sm rounded-lg">
                  <span className="font-mono-sm text-mono-sm text-text-muted w-16">To:</span>
                  <div className="flex-1 flex items-center flex-wrap gap-space-xs">
                    <span className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-surface-raised text-text-primary font-label-sm text-label-sm">
                      <span className="w-4 h-4 rounded-full bg-primary-container/30 text-[9px] flex items-center justify-center font-bold">
                        {selectedCase.contact_name
                          .split(' ')
                          .map((p) => p[0])
                          .join('')}
                      </span>
                      {selectedCase.contact_name}
                      <span className="font-mono-sm text-mono-sm text-text-muted">
                        &lt;{selectedCase.contact_email}&gt;
                      </span>
                    </span>
                  </div>
                </div>

                {/* CC Row */}
                <div className="flex items-center gap-space-md bg-surface-container-lowest/70 px-space-md py-space-sm rounded-lg">
                  <span className="font-mono-sm text-mono-sm text-text-muted w-16">CC:</span>
                  <div className="flex-1 flex items-center flex-wrap gap-space-xs">
                    {ccList.map((cc) => (
                      <span
                        key={cc}
                        className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-surface-container-high text-text-secondary font-label-sm text-label-sm"
                      >
                        {cc}
                        <button
                          type="button"
                          onClick={() => setCcList((prev) => prev.filter((item) => item !== cc))}
                          className="hover:text-status-danger cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={newCc}
                      onChange={(e) => setNewCc(e.target.value)}
                      onKeyDown={handleAddCc}
                      placeholder="Add additional address & press Enter..."
                      className="bg-transparent text-text-primary placeholder:text-text-muted font-body-sm text-body-sm focus:outline-none flex-1 min-w-[160px]"
                    />
                  </div>
                </div>

                {/* Subject Line */}
                <div className="flex items-center gap-space-md bg-surface-container-lowest/70 px-space-md py-space-sm rounded-lg">
                  <span className="font-mono-sm text-mono-sm text-text-muted w-16">Subject:</span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex-1 bg-transparent font-label-md text-label-md text-text-primary focus:outline-none"
                  />
                </div>

                {/* Attached Missing Items Capsule */}
                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-raised/70 flex-wrap gap-2">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <Paperclip className="w-4 h-4 text-primary" />
                    <span className="font-label-sm text-label-sm text-text-primary">
                      {missingDocs.length} Missing Items Linked (Secure Vault Uplink):
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {missingDocs.map((doc) => (
                        <span
                          key={doc.id}
                          className="px-2 py-0.5 rounded bg-surface-highlight text-brand-accent font-mono-sm text-mono-sm"
                        >
                          {doc.document_name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="font-mono-sm text-mono-sm text-status-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                    Encrypted Uplink Ready
                  </span>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="px-space-lg py-space-sm bg-surface-container flex items-center justify-between gap-space-sm overflow-x-auto">
                <div className="flex items-center gap-1 text-text-secondary">
                  <button
                    type="button"
                    onClick={() => insertFormat('**', '**')}
                    className="p-1.5 rounded hover:bg-surface-highlight hover:text-text-primary transition-colors"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('_', '_')}
                    className="p-1.5 rounded hover:bg-surface-highlight hover:text-text-primary transition-colors"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('__', '__')}
                    className="p-1.5 rounded hover:bg-surface-highlight hover:text-text-primary transition-colors"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <span className="w-px h-4 bg-outline-variant/40 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormat('\n• ')}
                    className="p-1.5 rounded hover:bg-surface-highlight hover:text-text-primary transition-colors"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('\n1. ')}
                    className="p-1.5 rounded hover:bg-surface-highlight hover:text-text-primary transition-colors"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <span className="w-px h-4 bg-outline-variant/40 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormat('https://portal.northgatebank.com/secure-vault ')}
                    className="p-1.5 rounded hover:bg-surface-highlight hover:text-text-primary transition-colors"
                    title="Insert Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('\n> ')}
                    className="p-1.5 rounded hover:bg-surface-highlight hover:text-text-primary transition-colors"
                    title="Insert Quote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-space-sm shrink-0">
                  <span className="font-mono-sm text-mono-sm text-text-muted">{editStatus}</span>
                  <button
                    type="button"
                    onClick={() => void handleToneClick('baseline')}
                    className="px-2.5 py-1 rounded bg-surface-highlight hover:bg-surface-bright text-text-secondary hover:text-text-primary font-label-sm text-label-sm transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset to Critic Draft
                  </button>
                </div>
              </div>

              {/* Editable Text Area */}
              <div className="relative p-space-lg bg-surface-deep/40 min-h-[380px] flex flex-col">
                <textarea
                  ref={editorRef}
                  id="email-editor"
                  value={body}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  rows={16}
                  className="w-full flex-1 bg-transparent outline-none text-text-primary font-body-md text-body-md leading-relaxed focus:ring-1 focus:ring-primary-container/40 p-space-md rounded-xl transition-all resize-y"
                />

                <div className="mt-space-md pt-space-sm flex items-center justify-between font-mono-sm text-mono-sm text-text-muted flex-wrap gap-2">
                  <div className="flex items-center gap-space-sm">
                    <span className="flex h-2 w-2 rounded-full bg-brand-accent" />
                    <span>
                      RM {selectedCase.assigned_rm} (Authenticated Gateway: Microsoft 365
                      Enterprise)
                    </span>
                  </div>
                  <div>
                    Words: <span className="text-text-primary">{wordCount}</span> • Characters:{' '}
                    <span className="text-text-primary">{charCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RM Audit Assurance Bar */}
            <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center text-status-success">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-text-primary">
                    E2E Cryptographic Audit Trail
                  </span>
                  <span className="font-mono-sm text-mono-sm text-text-muted">
                    Draft Hash: {selectedCase.audit_hash || '9f8a3c8e...d2e1'} (Stored on Northgate
                    SQLite Ledger)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-status-success/10 text-status-success font-mono-sm text-mono-sm flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pre-Flight Check: Passed
              </span>
            </div>
          </div>

          {/* Right Side Inspector Panel (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-space-md">
            {/* Client Dossier Summary Card */}
            <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col gap-space-md shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <Building2 className="w-5 h-5 text-brand-accent" />
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">
                    Client Dossier
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-mono-sm text-mono-sm">
                  High-Touch Tier
                </span>
              </div>

              <div className="flex flex-col gap-space-sm pt-space-xs">
                <div className="p-space-sm rounded-lg bg-surface-deep flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Projected Annual Facility
                  </span>
                  <span className="font-headline-sm text-headline-sm text-status-success font-mono-data">
                    {selectedCase.facility_value}
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-deep flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-text-muted">Desk Unit</span>
                  <span className="font-label-md text-label-md text-text-primary">
                    {selectedCase.desk}
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-deep flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-text-muted">
                    Current KYC Velocity
                  </span>
                  <span className="font-mono-data text-mono-data text-status-warning">
                    {selectedCase.days_since_contact.toFixed(1)}d Since Contact
                  </span>
                </div>
              </div>

              <div className="p-space-md rounded-lg bg-surface-raised flex flex-col gap-space-xs">
                <div className="flex items-center gap-1.5 text-primary">
                  <StickyNote className="w-4 h-4" />
                  <span className="font-label-sm text-label-sm uppercase tracking-wider">
                    RM Private Intelligence
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-text-primary italic leading-relaxed">
                  &ldquo;{selectedCase.relationship_notes}&rdquo;
                </p>
                <div className="pt-1 flex items-center justify-between text-text-muted font-mono-sm text-mono-sm">
                  <span>Author: {selectedCase.assigned_rm}</span>
                  <span>Round #{selectedCase.chase_round_count}</span>
                </div>
              </div>
            </div>

            {/* Quick Tone Adjusters */}
            <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col gap-space-md shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">
                    Quick Tone Adjusters
                  </h2>
                </div>
                <span className="font-mono-sm text-mono-sm text-text-muted">Assisted Tuning</span>
              </div>
              <p className="font-body-sm text-body-sm text-text-secondary">
                Apply automated RM voice modifications while retaining all mandatory compliance and
                legal clauses:
              </p>

              <div className="flex flex-col gap-space-sm">
                <button
                  type="button"
                  onClick={() => void handleToneClick('casual')}
                  className="w-full text-left p-space-sm rounded-xl bg-surface-deep hover:bg-surface-raised transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high group-hover:bg-primary group-hover:text-canvas-base flex items-center justify-center transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-text-primary group-hover:text-primary transition-colors">
                        Slightly More Casual
                      </span>
                      <span className="font-mono-sm text-mono-sm text-text-muted">
                        Softens executive phrasing
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => void handleToneClick('urgent')}
                  className="w-full text-left p-space-sm rounded-xl bg-surface-deep hover:bg-surface-raised transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high group-hover:bg-status-warning group-hover:text-canvas-base flex items-center justify-center transition-colors">
                      <AlarmClock className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-text-primary group-hover:text-status-warning transition-colors">
                        More Urgent / Deadline Focus
                      </span>
                      <span className="font-mono-sm text-mono-sm text-text-muted">
                        Emphasizes board cut-off
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-status-warning transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  type="button"
                  onClick={() => void handleToneClick('calendar')}
                  className="w-full text-left p-space-sm rounded-xl bg-surface-deep hover:bg-surface-raised transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high group-hover:bg-brand-accent group-hover:text-canvas-base flex items-center justify-center transition-colors">
                      <CalendarPlus className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-text-primary group-hover:text-brand-accent transition-colors">
                        Add Direct Calendar Link
                      </span>
                      <span className="font-mono-sm text-mono-sm text-text-muted">
                        Inserts 15-min RM booking slot
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-accent transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Compliance Critic Stamp */}
            <div className="rounded-xl bg-surface-container-low p-space-lg flex flex-col gap-space-md shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <ClipboardCheck className="w-5 h-5 text-status-success" />
                  <h2 className="font-headline-sm text-headline-sm text-text-primary">
                    Critic QA Audit Stamp
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-status-success/20 text-status-success font-mono-data text-mono-data">
                  {selectedCase.critic_score || 100}/100
                </span>
              </div>

              <div className="flex items-center gap-space-md p-space-sm rounded-lg bg-surface-deep">
                <div className="w-12 h-12 flex-shrink-0 relative flex items-center justify-center">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      className="stroke-surface-container-high"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.915"
                      strokeWidth="3"
                    />
                    <circle
                      className="stroke-status-success"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="15.915"
                      strokeDasharray={`${selectedCase.critic_score || 100}, 100`}
                      strokeDashoffset="0"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute font-mono-data text-mono-sm font-bold text-text-primary">
                    {selectedCase.critic_score || 100}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-text-primary">
                    Critic QA Approved
                  </span>
                  <span className="font-mono-sm text-mono-sm text-text-muted">
                    Cleared by Autonomous Rule-Engine
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 font-mono-sm text-mono-sm text-text-secondary">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success" /> Tone &amp;
                    Courtesy
                  </span>
                  <span className="text-text-primary">100% Pass</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success" /> Regulatory
                    Precision
                  </span>
                  <span className="text-text-primary">100% Pass</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success" /> Anti-Phishing
                    Guard
                  </span>
                  <span className="text-text-primary">100% Clean</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Dispatch Action Bar */}
        <div className="sticky bottom-4 z-40 w-full mt-space-md">
          <div className="rounded-2xl bg-surface-raised/95 backdrop-blur-2xl p-space-lg shadow-[0_20px_50px_rgba(11,9,20,0.8)]">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-space-lg">
              <div className="flex items-center gap-space-md w-full lg:w-auto justify-start flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSavedNotice(true);
                    window.setTimeout(() => setSavedNotice(false), 2000);
                  }}
                  className="px-space-md py-space-sm rounded-full bg-surface-deep hover:bg-surface-highlight text-text-secondary hover:text-text-primary font-label-md text-label-md transition-colors flex items-center gap-1.5"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span>{savedNotice ? 'Template Saved!' : 'Save as RM Template'}</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await resetCaseDemo(selectedCase.id);
                    setActiveView('orchestrator-inbox');
                  }}
                  className="px-space-md py-space-sm rounded-full bg-surface-deep hover:bg-status-danger/20 text-status-danger font-label-md text-label-md transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Discard Draft</span>
                </button>
              </div>

              <div className="flex items-center gap-space-md bg-surface-deep px-space-md py-space-sm rounded-full">
                <label className="flex items-center gap-space-sm cursor-pointer select-none">
                  <input
                    id="notify-analyst"
                    type="checkbox"
                    checked={notifyAnalyst}
                    onChange={(e) => setNotifyAnalyst(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface-container text-primary-container accent-[#9A84F8] cursor-pointer"
                  />
                  <span className="font-label-md text-label-md text-text-primary">
                    Notify Case Analyst Marcus Vance on send
                  </span>
                </label>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-status-success" />
                <span className="hidden sm:inline-block font-mono-sm text-mono-sm text-text-muted">
                  Instant internal push
                </span>
              </div>

              <div className="flex flex-col items-center lg:items-end gap-1.5 w-full lg:w-auto">
                <button
                  type="button"
                  id="dispatch-cta-btn"
                  onClick={() => void handleDispatch()}
                  disabled={dispatching}
                  className="w-full sm:w-auto px-space-xl py-space-md rounded-full bg-primary-container hover:bg-brand-accent text-canvas-base font-headline-sm text-headline-sm font-bold shadow-[0_0_30px_rgba(154,132,248,0.4)] hover:shadow-[0_0_40px_rgba(154,132,248,0.6)] transform active:scale-98 transition-all flex items-center justify-center gap-space-md group disabled:opacity-70"
                >
                  <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  <span>
                    {dispatching ? 'Transmitting via Outlook Gateway...' : 'Approve & Send Chase Email'}
                  </span>
                  <span className="w-px h-5 bg-canvas-base/30" />
                  <ShieldCheck className="w-5 h-5" />
                </button>
                <span className="font-mono-sm text-mono-sm text-text-muted text-center lg:text-right max-w-md">
                  Clicking updates SQLite telemetry (RM_Approved), sets case status to Completed,
                  and logs the immutable audit hash.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Confirmation Modal */}
      {dispatchModal && (
        <div
          id="dispatch-success-modal"
          className="fixed inset-0 z-50 bg-canvas-base/80 backdrop-blur-md flex items-center justify-center p-space-md"
        >
          <div className="w-full max-w-lg rounded-2xl bg-surface-raised p-space-xl shadow-2xl flex flex-col items-center text-center gap-space-md border border-white/10">
            <div className="w-16 h-16 rounded-full bg-status-success/20 text-status-success flex items-center justify-center">
              <MailCheck className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-headline-lg text-headline-lg text-text-primary">
                Communication Dispatched
              </span>
              <span className="font-label-md text-label-md text-brand-accent font-mono-data">
                Tracking ID: {dispatchModal.tracking_id}
              </span>
            </div>
            <p className="font-body-md text-body-md text-text-secondary">
              {dispatchModal.message} Database telemetry updated (<code className="text-primary">RM_Approved</code>{' '}
              logged to <code className="text-primary">agent_actions</code>).
            </p>
            <div className="w-full p-space-md rounded-xl bg-surface-deep flex flex-col gap-1 text-left font-mono-sm text-mono-sm">
              <div className="flex justify-between text-text-muted">
                <span>Recipient:</span>
                <span className="text-text-primary">{selectedCase.contact_email}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Audit Hash:</span>
                <span className="text-text-primary">{dispatchModal.audit_hash}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Case Status:</span>
                <span className="text-status-success">{dispatchModal.case.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-space-md w-full pt-space-xs">
              <button
                type="button"
                onClick={() => {
                  setDispatchModal(null);
                  setActiveView('executive-success-dashboard');
                }}
                className="w-full py-space-sm rounded-full bg-primary text-canvas-base font-label-md text-label-md font-bold"
              >
                View COO Success Dashboard -&gt;
              </button>
              <button
                type="button"
                onClick={() => {
                  setDispatchModal(null);
                  setActiveView('case-tracker');
                }}
                className="w-full py-space-sm rounded-full bg-surface-deep text-text-primary font-label-md text-label-md"
              >
                Return to Case Tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
