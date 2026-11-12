"""Initializes SQLite with realistic Northgate Bank KYC cases, documents, and telemetry."""

from datetime import datetime, timedelta, timezone
import json

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AgentAction, KycCase, MissingDocument


def _default_critic_checks(missing_names: list[str]) -> str:
    checks = [
        {
            "key": "tone",
            "title": "Tone & Register",
            "badge": "PASSED: Professional Executive",
            "passed": True,
            "summary": (
                "No aggressive debt-collection phrasing, coercive language, or abrupt directives. "
                "Maintains respectful, institutional corporate banking cadence."
            ),
            "meta_left": "Lexical register: Tier-1 Bank",
            "meta_right": "Sentiment: Neutral (+0.04)",
        },
        {
            "key": "accuracy",
            "title": "Document Accuracy",
            "badge": "PASSED: 100% Grounded",
            "passed": True,
            "summary": (
                "Only documents flagged as 'Missing' in the tracker are cited. Zero hallucinated "
                "items; no already 'Verified' documents re-requested."
            ),
            "meta_left": ", ".join(missing_names[:2]) if missing_names else "All docs matched",
            "meta_right": f"{len(missing_names)} missing items verified",
        },
        {
            "key": "promises",
            "title": "Promise & Liability Check",
            "badge": "PASSED: Zero Commitments",
            "passed": True,
            "summary": (
                "Draft makes zero promises of unconditional credit approval, guaranteed timeline "
                "exemptions, or waiver of regulatory obligations."
            ),
            "meta_left": "Liability Exposure: $0.00",
            "meta_right": "Warranty clauses: 0",
        },
        {
            "key": "pii",
            "title": "PII & Security Protocol",
            "badge": "PASSED: Compliant",
            "passed": True,
            "summary": (
                "Contains authorized secure portal upload instructions; no unencrypted sensitive "
                "account numbers, tax IDs, or passwords exposed in cleartext."
            ),
            "meta_left": "Encrypted Token: Valid",
            "meta_right": "GDPR/DPA 2018: Clear",
        },
        {
            "key": "disclosures",
            "title": "Regulatory Disclosures",
            "badge": "PASSED: Standard Northgate",
            "passed": True,
            "summary": (
                "Standard Northgate Disclaimer attached. PRA/FCA regulatory notice, non-binding "
                "declaration, and confidentiality clause fully present."
            ),
            "meta_left": "Footer Pattern: SEC-FCA-2024-R",
            "meta_right": "Signature Key: Valid",
        },
    ]
    return json.dumps(checks)


async def seed_database(session: AsyncSession) -> None:
    """Seed database idempotently if kyc_cases is empty."""
    existing_count = await session.scalar(select(func.count(KycCase.id)))
    if existing_count and existing_count > 0:
        return

    now = datetime.now(timezone.utc)

    # Case 1: Apex Global Commodities Ltd (Primary Focus Case, SLA Breached 4.2d ago)
    case1 = KycCase(
        case_code="NCZ-2024-8841",
        client_name="Apex Global Commodities Ltd",
        status="Missing_Docs",
        days_open=24,
        last_contact_date=now - timedelta(days=4, hours=5),
        chase_round_count=2,
        lei="5493001KJTIIGC8Y1R12",
        entity_type="Multi-Jurisdictional Trading Firm",
        jurisdiction="UK Incorporated • Trading Entity",
        desk="Energy & Commodities",
        region="EMEA / UK",
        address="10 Fenchurch Avenue, London EC3M 5BN",
        contact_name="Alistair Finch",
        contact_role="General Counsel & Head of Onboarding",
        contact_email="a.finch@apexcommodities.co.uk",
        assigned_rm="Sarah Jenkins",
        facility_value="£45,000,000",
        relationship_notes=(
            "Alistair prefers communication before 11:00 AM London time. Mentioned upcoming "
            "board ratification this Friday; ensure he knows this protects their execution schedule."
        ),
        target_deadline_label="November 1st",
    )

    # Case 2: Meridian Capital Partners Fund IV (SLA Breached 3.8d ago)
    case2 = KycCase(
        case_code="NCZ-2024-8854",
        client_name="Meridian Capital Partners Fund IV",
        status="Missing_Docs",
        days_open=19,
        last_contact_date=now - timedelta(days=3, hours=19),
        chase_round_count=1,
        lei="213800K98H45LMT2691",
        entity_type="Private Equity LP",
        jurisdiction="Cayman / UK Regulated Feeder",
        desk="FX & Rates Desk",
        region="EMEA / UK",
        address="25 Berkeley Square, Mayfair, London W1J 6HN",
        contact_name="Helena Vance",
        contact_role="Chief Compliance Officer",
        contact_email="h.vance@meridiancap.co.uk",
        assigned_rm="Sarah Jenkins",
        facility_value="£62,500,000",
        relationship_notes=(
            "Fund IV LP close scheduled next Wednesday. Board resolution requires dual director sign-off."
        ),
        target_deadline_label="November 4th",
    )

    # Case 3: Vanguard Logistics Nordics AS (SLA Breached 3.1d ago)
    case3 = KycCase(
        case_code="NCZ-2024-8862",
        client_name="Vanguard Logistics Nordics AS",
        status="Missing_Docs",
        days_open=12,
        last_contact_date=now - timedelta(days=3, hours=3),
        chase_round_count=1,
        lei="5967007LIEEXZX890122",
        entity_type="Commercial Freight & Maritime",
        jurisdiction="Norway Incorporated • EEA Entity",
        desk="Structured Debt",
        region="EMEA / Nordics",
        address="Aker Brygge 14, 0250 Oslo, Norway",
        contact_name="Henrik Solberg",
        contact_role="VP Treasury & Risk",
        contact_email="h.solberg@vanguardnordics.no",
        assigned_rm="Sarah Jenkins",
        facility_value="£31,000,000",
        relationship_notes=(
            "Oslo registry apostille was delayed due to municipal holiday; follow up politely on W-8BEN-E."
        ),
        target_deadline_label="November 6th",
    )

    # Case 4: Aethelgard Global Holdings Ltd (Draft Ready after Critic QA)
    aethelgard_draft = (
        "Dear Mr. Vance,\n\n"
        "We hope this message finds you well. As part of Northgate Capital's standard regulatory "
        "governance and in accordance with UK Financial Conduct Authority guidelines, we are currently "
        "concluding our scheduled annual KYC review for Aethelgard Global Holdings Ltd.\n\n"
        "To complete the audit file without delay, our compliance records require two outstanding entity documents:\n"
        "1. Updated 2024 Register of Persons with Significant Control (PSC Register)\n"
        "2. Certified Proof of Operational Address for the Luxembourg Holding SPV\n\n"
        "To ensure uninterrupted access to institutional credit facilities, we kindly request submission "
        "via our encrypted secure portal prior to November 1st.\n\n"
        "Please transmit these files strictly through the Northgate Secure Client Workspace link: "
        "https://portal.northgate.bank/upload/case-8841-auth-vance — Do not reply with unencrypted "
        "passport scans or identity records via email.\n\n"
        "Warm regards,\n"
        "Sarah Jenkins\n"
        "VP Corporate Banking, Northgate Capital Markets\n\n"
        "CONFIDENTIALITY & COMPLIANCE NOTICE: This communication is issued pursuant to Northgate Risk & "
        "Settlement Protocols. It does not constitute a legally binding loan commitment or final credit "
        "renewal authorization. Northgate Bank plc is authorized and regulated by the PRA and FCA."
    )
    case4 = KycCase(
        case_code="NCZ-2024-8849",
        client_name="Aethelgard Global Holdings Ltd",
        status="Draft_Ready",
        days_open=21,
        last_contact_date=now - timedelta(days=3, hours=14),
        chase_round_count=2,
        lei="549300V9N87YTR2P0431",
        entity_type="Institutional Holding Group",
        jurisdiction="UK / Luxembourg SPV Structure",
        desk="FX & Rates Desk",
        region="EMEA / UK",
        address="40 Bank Street, Canary Wharf, London E14 5NR",
        contact_name="Marcus Vance",
        contact_role="Group Treasurer",
        contact_email="m.vance@aethelgard-holdings.co.uk",
        assigned_rm="Sarah Jenkins",
        facility_value="£78,000,000",
        relationship_notes="Quarterly FX hedging renewal pending Luxembourg operational address verification.",
        target_deadline_label="November 1st",
        current_draft_subject="Northgate Commercial Banking: Annual Periodic KYC Review — Action Required [Ref: #NCZ-2024-8849]",
        current_draft_body=aethelgard_draft,
        critic_passed=True,
        critic_score=100,
        critic_feedback="All 5 compliance and accuracy guardrails cleared.",
        critic_checks_json=_default_critic_checks([
            "Updated 2024 Register of Persons with Significant Control (PSC Register)",
            "Certified Proof of Operational Address for the Luxembourg Holding SPV",
        ]),
        workflow_iterations=1,
        audit_hash="#QA-9921-SEC-V3",
    )

    # Case 5: Aura Renewable Tech Holdings (On Schedule, < 3 days)
    case5 = KycCase(
        case_code="NCZ-2024-8870",
        client_name="Aura Renewable Tech Holdings",
        status="Missing_Docs",
        days_open=8,
        last_contact_date=now - timedelta(days=1, hours=12),
        chase_round_count=1,
        lei="9845007D3F11A89E4C52",
        entity_type="Clean Energy Infrastructure",
        jurisdiction="UK / Germany Dual Listed",
        desk="Energy & Commodities",
        region="EMEA / EU",
        address="18 Finsbury Square, London EC2A 1AH",
        contact_name="Dr. Elena Rostova",
        contact_role="Chief Financial Officer",
        contact_email="e.rostova@aurarenewables.eu",
        assigned_rm="Sarah Jenkins",
        facility_value="£54,000,000",
        relationship_notes="Responsive team; last upload received 36h ago.",
        target_deadline_label="November 12th",
    )

    # Case 6: Helios Shipping Syndicate Ltd (On Schedule, < 3 days)
    case6 = KycCase(
        case_code="NCZ-2024-8875",
        client_name="Helios Shipping Syndicate Ltd",
        status="Missing_Docs",
        days_open=31,
        last_contact_date=now - timedelta(days=2, hours=3),
        chase_round_count=2,
        lei="21380099KLMN11234098",
        entity_type="Maritime Syndicate",
        jurisdiction="Greece / UK Maritime Desk",
        desk="Structured Debt",
        region="EMEA / Mediterranean",
        address="88 Leadenhall Street, London EC3A 3BP",
        contact_name="Nikos Papadopoulos",
        contact_role="Syndicate Finance Director",
        contact_email="n.papadopoulos@heliosshipping.gr",
        assigned_rm="Sarah Jenkins",
        facility_value="£39,000,000",
        relationship_notes="21h remaining before 3-day SLA threshold.",
        target_deadline_label="November 14th",
    )

    # Case 7: Sovereign Ridge Capital (Breached 4.6d ago)
    case7 = KycCase(
        case_code="NCZ-2024-8833",
        client_name="Sovereign Ridge Capital LLC",
        status="Missing_Docs",
        days_open=27,
        last_contact_date=now - timedelta(days=4, hours=14),
        chase_round_count=2,
        lei="549300ABC987XYZ12345",
        entity_type="Multi-Strategy Credit Fund",
        jurisdiction="Delaware LLC / US SEC Registered",
        desk="FX & Rates Desk",
        region="Americas / US",
        address="350 Madison Avenue, New York, NY 10017",
        contact_name="Claire Sterling",
        contact_role="Managing Director, Operations",
        contact_email="c.sterling@sovereignridge.com",
        assigned_rm="Sarah Jenkins",
        facility_value="£85,000,000",
        relationship_notes="US FATCA W-9 certificate expired last month; needs refreshed execution.",
        target_deadline_label="November 2nd",
    )

    # Case 8: Albion Trade Finance PLC (Completed)
    case8 = KycCase(
        case_code="NCZ-2024-8802",
        client_name="Albion Trade Finance PLC",
        status="Completed",
        days_open=16,
        last_contact_date=now - timedelta(hours=8),
        chase_round_count=2,
        lei="213800ALBION77654321",
        entity_type="Corporate Treasury Platform",
        jurisdiction="UK FCA Authorized",
        desk="FX & Rates Desk",
        region="EMEA / UK",
        address="1 Poultry, London EC2R 8EJ",
        contact_name="David Thorne",
        contact_role="Head of Compliance",
        contact_email="d.thorne@albiontrade.co.uk",
        assigned_rm="Sarah Jenkins",
        facility_value="£29,500,000",
        relationship_notes="All KYC docs received and verified after Round 2 ChaseZero dispatch.",
        target_deadline_label="October 29th",
        critic_passed=True,
        critic_score=100,
        audit_hash="#CHASE-8802-DONE",
    )

    session.add_all([case1, case2, case3, case4, case5, case6, case7, case8])
    await session.flush()

    docs = [
        # Case 1 (Apex Global Commodities Ltd) - exact 5 items from the design screen
        MissingDocument(
            case_id=case1.id,
            document_name="Ultimate Beneficial Ownership (UBO) Registry Tier-2",
            status="Missing",
            description=(
                "Missing certified structure for holding entity in Luxembourg "
                "(Apex Lux S.à r.l. > 25% voting shares)."
            ),
            requirement_meta="Requirement: Cert. Copy < 90 days",
            assigned_to_or_verifier="Assigned: A. Finch (Apex GC)",
            doc_code="#UBO-LUX-8841",
        ),
        MissingDocument(
            case_id=case1.id,
            document_name="Certified Trust Deed (Addendum 2023)",
            status="Missing",
            description=(
                "Pending authorized corporate trustee counter-signature and legal opinion rider."
            ),
            requirement_meta="Jurisdiction: Jersey / UK",
            assigned_to_or_verifier="No response to T+20 notice",
            doc_code="#TRD-JRS-2023",
        ),
        MissingDocument(
            case_id=case1.id,
            document_name="Certificate of Incorporation & Articles of Association",
            status="Verified",
            description="Companies House Stamp Valid",
            requirement_meta="Companies House Stamp Valid",
            assigned_to_or_verifier="Verified by Analyst Marcus Vance at 14:20 12-Oct",
            doc_code="#CH-UK-8841-A",
        ),
        MissingDocument(
            case_id=case1.id,
            document_name="Authorized Signatory List (W-8BEN-E Tax Form)",
            status="Received",
            description=(
                "Uploaded via client portal 2 days ago. Passed OCR triage, currently locked in human review."
            ),
            requirement_meta="Analyst Review SLA: 18h remaining",
            assigned_to_or_verifier="Human-in-the-loop Active",
            doc_code="#TAX-W8-8841",
        ),
        MissingDocument(
            case_id=case1.id,
            document_name="AML Corporate Policy & Source of Funds Statement",
            status="Verified",
            description="Source: Barclays Institutional Acct",
            requirement_meta="Source: Barclays Institutional Acct",
            assigned_to_or_verifier="Verified by Analyst Sarah Lin at 09:15 10-Oct",
            doc_code="#SOF-GBP-7731",
        ),
        # Case 2 (Meridian Capital)
        MissingDocument(
            case_id=case2.id,
            document_name="Authorized Signatory List (Resolution 4B)",
            status="Missing",
            description="Board resolution 4B requires dual general partner wet-ink or qualified e-signature.",
            requirement_meta="Requirement: Dual GP Execution",
            assigned_to_or_verifier="Assigned: H. Vance (Meridian CCO)",
            doc_code="#SIG-4B-8854",
        ),
        MissingDocument(
            case_id=case2.id,
            document_name="Certificate of Good Standing (Cayman CIMA)",
            status="Verified",
            description="Verified via CIMA Electronic Registry",
            requirement_meta="CIMA Registry Check Valid",
            assigned_to_or_verifier="Verified by Analyst Marcus Vance at 11:05 14-Oct",
            doc_code="#CIMA-8854-B",
        ),
        # Case 3 (Vanguard Logistics)
        MissingDocument(
            case_id=case3.id,
            document_name="W-8BEN-E Form",
            status="Missing",
            description="Updated 2024 US withholding certification for USD freight clearing account.",
            requirement_meta="IRS Rev. Oct-2021 Format",
            assigned_to_or_verifier="Assigned: H. Solberg (VP Treasury)",
            doc_code="#W8B-NO-8862",
        ),
        MissingDocument(
            case_id=case3.id,
            document_name="Certificate of Incumbency",
            status="Missing",
            description="Apostilled Brønnøysund Register Centre officer incumbency extract.",
            requirement_meta="Jurisdiction: Norway EEA",
            assigned_to_or_verifier="Awaiting apostille upload",
            doc_code="#INC-NO-8862",
        ),
        MissingDocument(
            case_id=case3.id,
            document_name="Audited FY23 Consolidated Financial Statements",
            status="Verified",
            description="KPMG Oslo Audit Sign-off Confirmed",
            requirement_meta="Statutory Annual Filing",
            assigned_to_or_verifier="Verified by Analyst Sarah Lin at 16:40 13-Oct",
            doc_code="#FIN-NO-8862",
        ),
        # Case 4 (Aethelgard Global Holdings)
        MissingDocument(
            case_id=case4.id,
            document_name="Updated 2024 Register of Persons with Significant Control (PSC Register)",
            status="Missing",
            description="Updated shareholder register reflecting Q3 institutional equity rebalance.",
            requirement_meta="Companies House PSC01/02",
            assigned_to_or_verifier="Assigned: M. Vance (Group Treasurer)",
            doc_code="#PSC-UK-8849",
        ),
        MissingDocument(
            case_id=case4.id,
            document_name="Certified Proof of Operational Address for the Luxembourg Holding SPV",
            status="Missing",
            description="Recent utility or municipal domiciliation certificate (< 90 days).",
            requirement_meta="Jurisdiction: Luxembourg",
            assigned_to_or_verifier="Assigned: M. Vance (Group Treasurer)",
            doc_code="#ADDR-LUX-8849",
        ),
        MissingDocument(
            case_id=case4.id,
            document_name="Certificate of Incorporation & Memorandum",
            status="Verified",
            description="UK Companies House Certified Copy",
            requirement_meta="Verified < 30 days",
            assigned_to_or_verifier="Verified by Analyst Marcus Vance",
            doc_code="#COI-UK-8849",
        ),
        # Case 5 (Aura Renewable)
        MissingDocument(
            case_id=case5.id,
            document_name="German Commercial Register Extract (Handelsregister B)",
            status="Missing",
            description="Current certified extract for Aura GmbH subsidiary.",
            requirement_meta="Jurisdiction: Germany",
            assigned_to_or_verifier="Due in 1.5 days",
            doc_code="#HRB-DE-8870",
        ),
        # Case 6 (Helios Shipping)
        MissingDocument(
            case_id=case6.id,
            document_name="Vessel Beneficial Ownership Attestation",
            status="Missing",
            description="Signed attestation covering fleet SPVs under Marshall Islands flag.",
            requirement_meta="Maritime AML Standard",
            assigned_to_or_verifier="21h remaining in SLA",
            doc_code="#VBO-GR-8875",
        ),
        # Case 7 (Sovereign Ridge)
        MissingDocument(
            case_id=case7.id,
            document_name="Refreshed IRS Form W-9 & FATCA GIIN Confirmation",
            status="Missing",
            description="Prior W-9 expired at Q3 close; updated signatory date required.",
            requirement_meta="Jurisdiction: US Delaware",
            assigned_to_or_verifier="Assigned: C. Sterling",
            doc_code="#W9-US-8833",
        ),
        MissingDocument(
            case_id=case7.id,
            document_name="SEC Form ADV Part 1A & 2A Filing",
            status="Verified",
            description="Matched against SEC IAPD registry",
            requirement_meta="SEC Registered Adviser",
            assigned_to_or_verifier="Verified by Analyst Sarah Lin",
            doc_code="#ADV-US-8833",
        ),
        # Case 8 (Albion Trade Finance)
        MissingDocument(
            case_id=case8.id,
            document_name="FCA Firm Reference Number Authorization Letter",
            status="Verified",
            description="All onboarding clearances complete",
            requirement_meta="FCA Register Verified",
            assigned_to_or_verifier="Verified by Analyst Marcus Vance",
            doc_code="#FCA-UK-8802",
        ),
    ]
    session.add_all(docs)

    # Seed realistic agent_actions telemetry for COO Dashboard calculations
    # (18 RM_Approved, 19 Draft_Generated, 2 Critic_Rejected -> 94.7% RM adoption rate, 0 post-approval violations)
    seeded_actions: list[AgentAction] = []
    case_ids = [case1.id, case2.id, case3.id, case4.id, case5.id, case6.id, case7.id, case8.id]

    for idx in range(19):
        cid = case_ids[idx % len(case_ids)]
        ts = now - timedelta(days=(13 - (idx % 12)), hours=idx % 9)
        seeded_actions.append(
            AgentAction(
                case_id=cid,
                action_type="Draft_Generated",
                timestamp=ts,
                actor="ChaseZero Drafter Agent",
                details=f"Synthesized grounded KYC chase draft (Round {(idx % 3) + 1}) | 0 hallucinations",
            )
        )

    for idx in range(2):
        cid = case_ids[idx]
        seeded_actions.append(
            AgentAction(
                case_id=cid,
                action_type="Critic_Rejected",
                timestamp=now - timedelta(days=5 - idx, hours=3),
                actor="ChaseZero Critic QA",
                details=(
                    "Intercepted speculative timeline guarantee on Draft v1; auto-routed back to "
                    "Drafter Node for compliance correction."
                ),
            )
        )

    for idx in range(18):
        cid = case_ids[idx % len(case_ids)]
        ts = now - timedelta(days=(12 - (idx % 11)), hours=(idx % 7) + 1)
        seeded_actions.append(
            AgentAction(
                case_id=cid,
                action_type="RM_Approved",
                timestamp=ts,
                actor="Sarah Jenkins (RM)",
                details="RM signed off & dispatched via authenticated gateway (48s review time)",
            )
        )

    session.add_all(seeded_actions)
    await session.commit()
