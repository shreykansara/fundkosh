# Product Requirements Document
## FundKosh — Mindful Cash Management & Pre-Transaction Reflection Engine

| Field | Detail |
| :--- | :--- |
| **Document ID** | PRD-FK-003 |
| **Product Name** | FundKosh |
| **Document Status** | Draft for Internal Review |
| **Author** | Product Management — FundKosh |
| **Target Release** | Phase 2 — Market Pilot |
| **Last Updated** | July 28, 2026 |
| **Classification** | Confidential |

> [!NOTE]
> This document describes FundKosh as a production consumer product. Figures, architecture, and regulatory references have been validated against publicly available data at the time of writing. All interest rates, regulatory thresholds, and technical limits are subject to change and must be re-verified before each major release.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users & Personas](#3-target-users--personas)
4. [Product Vision & Strategic Pillars](#4-product-vision--strategic-pillars)
5. [Feature Requirements](#5-feature-requirements)
6. [System Architecture](#6-system-architecture)
7. [Data Architecture & Privacy Compliance](#7-data-architecture--privacy-compliance)
8. [Regulatory & Legal Compliance](#8-regulatory--legal-compliance)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Success Metrics & KPIs](#10-success-metrics--kpis)
11. [Roadmap](#11-roadmap)

---

## 1. Executive Summary

India processed over 130 billion UPI transactions in FY 2023–24, with the ecosystem spanning 600+ connected banks. The extreme frictionlessness of this network — while a triumph for financial inclusion — has created a documented behavioural gap first described in academic literature as the **"pain of paying"** problem (Prelec & Loewenstein, 1998): when payments are abstract and instantaneous, consumers lose the psychological signal that money is leaving their control. Studies on India's UPI ecosystem confirm this effect, showing higher impulse-purchase rates and weaker saving behaviour among UPI-dominant users compared to cash users.

**FundKosh** is a consumer mobile application that operates as a **pre-transaction reflection layer** on top of UPI payments. It does not block or control transactions; it introduces a calibrated, time-limited pause and contextual information that transfers the decision back to the user. Simultaneously, it harvests transaction round-up amounts (the spare change from every payment) and routes them into a user-linked Variable Recurring Deposit at a partner Small Finance Bank, converting micro-amounts into a formal savings instrument.

The product is designed from the ground up for **India's informal-sector worker** — specifically the gig-economy delivery partner and the multi-employer domestic worker in Tier 2 cities — for whom most financial apps are inaccessible because of literacy barriers, language gaps, or an interface designed around salaried, English-reading users.

---

## 2. Problem Statement

### 2.1 The Behavioural Gap
The "cashless effect," extensively documented in consumer psychology literature, describes how non-cash payment methods reduce the immediate psychological cost of spending. Research by Soman (2001) found that credit and debit card users significantly under-recalled their prior spending compared to cash users. Avni Shah et al. (2016) extended this to digital wallets. With UPI's one-tap scan-and-pay flow — which requires zero physical handling and completes in under two seconds — this effect is at its strongest.

For users without strong financial literacy or predictable income, this means a structural inability to self-regulate spending before a fixed liability due date (rent, EMI, school fee).

### 2.2 The Three Root Causes

| # | Root Cause | How it manifests for our users |
| :-- | :-- | :-- |
| 1 | **Invisible depletion** | Digital balance is abstract; users do not feel money leaving. "Digital paisa dikhta nahi hai, isliye kharch ho jata hai." |
| 2 | **Opaque liabilities** | Fixed upcoming obligations (EMIs, rent) are not visible at the moment of a discretionary spend. |
| 3 | **No accessible savings vehicle** | Small Finance Bank RD products require a branch visit, English literacy, and a predictable fixed installment — excluding irregular-income earners entirely. |

### 2.3 Why Existing Solutions Fall Short

| Existing Tool | Gap |
| :-- | :-- |
| UPI apps (Google Pay, PhonePe) | Payment-only; no spending context or savings layer. |
| Banking apps | Require English literacy; designed for salaried users; no pre-payment nudge. |
| BNPL / credit products | Create debt, not savings; actively harmful for financially fragile users. |
| General budgeting apps | Post-facto reporting; require manual data entry; no UPI integration. |

---

## 3. Target Users & Personas

### 3.1 Primary Persona — Ramesh Kumar

| Attribute | Detail |
| :-- | :-- |
| **Name** | Ramesh Kumar |
| **Age** | 32 |
| **Occupation** | Delivery Partner (Zomato / Swiggy ecosystem) |
| **City** | Jaipur, Rajasthan |
| **Monthly Gross Earnings** | ₹22,000–₹26,000 (typical full-time range, net of fuel ~20% operational cost) |
| **Bank Account** | Jan Dhan / Basic Savings Account |
| **Primary Device** | Android, mid-range (4GB RAM, UPI-enabled) |
| **Language** | Hindi (primary), Marwadi (conversational) |

**Core Needs:**
- Never miss his weekly ₹1,200 vehicle EMI — missing one triggers penalty charges he cannot absorb.
- Build a small, accessible cash cushion of ₹3,000–₹5,000 for emergencies.
- Eventually move savings into a formal bank account without visiting a branch.
- Understand his financial position without reading dense app text or navigating deep menus.

**Core Challenges:**
- Does not frame impulse spending as a "financial planning" problem — he experiences it as bad luck or exhaustion-driven choices after a 10-hour shift.
- Cannot afford to spend even 20 minutes learning a new banking interface; opportunity cost is immediate.
- Earns surge bonuses on rainy days and during IPL matches, but spends those windfalls just as quickly.
- Digital money feels abstract and invisible, leading to systematic underestimation of cumulative daily spend.

**Motivations:**
- Ease over features — a fellow rider's WhatsApp recommendation carries more weight than any advertisement.
- Zero fees or clearly disclosed, minimal fees; he is cautious about anything that resembles debt or hidden charges.
- Visible, tangible proof that saving is happening — he needs to *see* the number growing.

**Day in the Life:**
Finishes a 10-hour shift at 10:45 PM, tired and hungry. A fellow rider has forwarded him the FundKosh app link on WhatsApp earlier in the day. He opens it, scans the QR code at a food stall to buy a snack for ₹180. Before the UPI PIN screen appears, the app surfaces a single Hindi-language card: *"Aapka vehicle EMI ₹1,200 kal due hai. Abhi ₹850 ka cushion baki hai."* ("Your vehicle EMI of ₹1,200 is due tomorrow. ₹850 buffer remaining.") He puts his phone down and walks away. The decision was entirely his. The app only surfaced the fact he had forgotten.

---

### 3.2 Secondary Persona — Sunita Devi

| Attribute | Detail |
| :-- | :-- |
| **Name** | Sunita Devi |
| **Age** | 45 |
| **Occupation** | Domestic Worker (3 employers) |
| **City** | Jaipur, Rajasthan |
| **Monthly Income** | ₹8,000–₹12,000 (variable; paid on irregular dates by each employer) |
| **Bank Account** | Basic Savings Account (PM Jan Dhan Yojana) |
| **Primary Device** | Entry-level Android (2–3 GB RAM, shared with family) |
| **Language** | Hindi (spoken fluently; reads haltingly), Marwadi (native spoken dialect) |

**Core Needs:**
- Maintain a small emergency reserve — ₹2,000–₹4,000 — for children's school fees and medical needs.
- Save in a way that does not depend on a single predictable payday; her three employers pay on different and sometimes irregular dates.
- Avoid predatory informal moneylenders (sahukar) who charge 5–10% monthly interest.

**Core Challenges:**
- Three employers pay on three different dates; no app designed around a single monthly salary works for her.
- Does not read English at all; standard banking and fintech apps are entirely inaccessible by design.
- Has been misled in the past by loan terms she did not understand; is cautious of any app that seems to be capturing her data for unknown purposes.
- Shared device means she uses the app briefly and episodically, not in sustained sessions.

**Motivations:**
- Simplicity over sophistication — she will abandon any feature she does not understand on first exposure.
- Trust is built through voice and familiar dialect, not through text or icons.
- No hidden costs, no fine print, no surprises.

**Day in the Life:**
Walking between two houses in the afternoon, she receives a voice message (WhatsApp voice note format, triggered by the app) in spoken Hindi: *"Aapke pichle payment se ₹40 alag rakh diye gaye hain — school fees ke liye."* ("₹40 have been set aside from your last payment — for school fees.") She taps a large play button in the app to hear an explanation. The voice repeats the amount, explains it was the round-up from her grocery payment, and tells her the total saved so far. She understands. She leaves it. That one small, explained action creates more trust than any signup bonus ever could.

> [!IMPORTANT]
> **Graceful Degradation Rule — The Sunita Test:** Any feature built for Ramesh's predictable weekly EMI cadence must be designed to degrade gracefully for Sunita's irregular, multi-source income. If a feature only functions with a single, predictable monthly payout, it fails the Sunita Test and must be re-scoped before shipping.

---

## 4. Product Vision & Strategic Pillars

**Vision:** To give informal-sector workers in India the same moment of financial clarity — before a purchase — that a responsible friend with full knowledge of their accounts would provide.

**Mission:** Reintroduce cognitive reflection into UPI payments; automate micro-savings into formal bank instruments; be accessible to users who cannot read English.

### Strategic Pillars

| Pillar | What We Do | Rationale |
| :-- | :-- | :-- |
| **Reflect** | Surface relevant financial context (upcoming EMI, remaining daily budget) immediately before a payment, creating a voluntary pause. | Behavioural economics research confirms that even a 5–15 second delay reduces impulsive purchases when the user is shown relevant cost information. The decision is always the user's. |
| **Protect** | Calculate and surface the user's real cash cushion — balance minus upcoming liabilities — so they never spend money they do not actually own. | The core problem is not overspending in absolute terms; it is spending money already committed to a fixed obligation, because that obligation is invisible at the point of purchase. |
| **Accumulate** | Round up every UPI payment to the nearest ₹10 and automatically route the difference into a Variable Recurring Deposit at a linked partner bank. | Small Finance Banks offer 6.5%–7.8% p.a. on Variable/Flexi RD products (verified as of July 2026). Round-ups are psychologically painless (sub-₹10 per transaction) while accumulating meaningfully over time. |

---

## 5. Feature Requirements

### 5.1 Proactive Financial State Assessment
**What it does:** Each time the user opens the app or initiates a payment, FundKosh silently computes a financial health snapshot and assigns a Risk State that governs the visual theme and intervention intensity throughout the session.

**Rationale:** The visual theme change (Green / Amber / Red) leverages ambient, pre-attentive cognition — the user perceives risk through colour before reading a single word. This is critical for low-literacy users like Sunita.

**Risk State Logic:**

| State | Trigger Conditions | UI Response |
| :-- | :-- | :-- |
| **SAFE (Green)** | Cash cushion > ₹2,000 AND daily spend velocity is low AND no liabilities due within 3 days | App renders in green theme; transactions flow normally. |
| **VULNERABLE (Amber)** | Any of: Late-night session (10 PM–5 AM); weekend; ≥2 transactions or ≥₹3,000 spent in trailing 2 hours; daily spend ≥₹4,000; liabilities due within 5 days | App renders in amber theme; a soft contextual card appears before each payment. |
| **CRITICAL (Red)** | Cash cushion ≤ ₹2,000 OR account balance < total liabilities due within 3 days | App renders in red theme; friction screen appears before any discretionary payment; EMI/essential payments are always permitted. |

**Cushion Calculation:**
```
Available Cash Cushion = Account Balance − Sum of all active liabilities due within 30 days
```

---

### 5.2 Income Calibration & Daily Spend Budget

**What it does:** FundKosh cannot know a user's exact income; it uses a combination of onboarding-declared income and observable contextual signals (weather, local events) to estimate a realistic daily spend envelope. This is particularly relevant for gig workers like Ramesh, whose earnings surge on rainy days and during major local events.

**Rationale for contextual signals:**
Delivery platform surge pricing is well-documented. Zomato and Swiggy implement surge pay and higher incentives during rain (verified from platform communications). Festival-season order volumes spike significantly. By using these signals as income multipliers, the daily budget becomes self-adjusting rather than stale.

**Daily Budget Formula:**
```
Predicted Monthly Income = Declared Base Income × Weather Multiplier × Event Multiplier

Daily Spendable Limit = max(₹100,
    floor((Predicted Monthly Income − 30-Day Liabilities) / 30) − Fixed Daily Overhead)

Remaining Today = Daily Spendable Limit − Total Completed Transactions Today
```

**Contextual Multipliers (indicative, configurable):**

| Signal | Multiplier | Basis |
| :-- | :-- | :-- |
| Clear weather | 1.0× | Baseline |
| Rain | 1.25× | Delivery surge pay; anecdotally confirmed by platform partner data |
| Heatwave | 1.10× | Elevated beverage/cooling delivery demand |
| Normal day | 1.0× | Baseline |
| Festival Season (Diwali, Holi, etc.) | 1.30× | Platform data on order volume uplift |
| IPL Match Night | 1.20× | Food delivery spike during match hours |

> [!NOTE]
> These multipliers are initial estimates calibrated from qualitative field research in Jaipur. They must be recalibrated on a rolling basis using anonymised, aggregated transaction data once the user base scales to statistical significance.

---

### 5.3 Speed-Bump Pre-Transaction Reflection Engine

**What it does:** This is FundKosh's core differentiator. When a payment is initiated that crosses a risk threshold, the app introduces a mandatory reflection screen for a fixed number of seconds — showing the user why this payment was flagged and what their financial position looks like — before enabling the payment confirmation.

**Critically: the app never blocks a payment.** After the reflection window expires, the user can freely proceed. The goal is restored deliberateness, not control.

**Rationale:** Studies on "friction by design" in behavioural economics (Thaler & Sunstein, *Nudge*, 2008) confirm that even small, non-blocking delays combined with relevant information significantly reduce impulsive choices. The intervention is intentionally asymmetric: cancelling is the easy, prominent action; proceeding requires waiting.

#### 5.3.1 Transaction Classification

Every incoming payment is classified before the PIN screen appears:

| Category | Signals | Treatment |
| :-- | :-- | :-- |
| **Essential** | Note contains essential keywords (grocery, rent, EMI, petrol, medicine, electricity bill, doctor, milk, school fee); payee is a verified utility or healthcare merchant | No friction; direct to PIN screen |
| **Transfer** | Payee is a registered family/household contact (P2P type) | Minimal friction; display cushion balance only |
| **Discretionary / Impulsive** | Note contains discretionary keywords (snack, dining, gadget, shoes, cab, movie, pub, clothing, watch); high-value to a general merchant; user is in VULNERABLE or CRITICAL state | Full reflection screen with cooldown |

#### 5.3.2 Risk Scoring Model

A composite risk score (0–100) is computed on-device:

| Signal | Risk Points |
| :-- | :-- |
| Predicted category = Discretionary | +25 |
| Note text matches discretionary keyword list | +20 |
| Payment amount > Remaining Daily Budget | +35 |
| Payment amount > Available Cash Cushion | +40 |
| User Risk State = VULNERABLE | +15 |
| Score is clamped at 100 |  |

#### 5.3.3 Intervention Rules

| Rule | Trigger Condition | Cooldown | Rationale |
| :-- | :-- | :-- | :-- |
| **Impulse Risk Guard** | Risk Score ≥ 45 AND category = Discretionary | 10 seconds | High-confidence impulsive signal; 10s is empirically sufficient for deliberation without feeling punitive. |
| **High-Value Guard** | Single transaction ≥ ₹2,000 | 5 seconds | Any payment exceeding ₹2,000 merits intentional confirmation regardless of category; 5s is a light touch for potentially essential large payments. |
| **Daily Velocity Guard** | Cumulative daily spend ≥ ₹5,000 | 15 seconds | Daily expenditure approaching or exceeding a typical day's net gig income warrants the strongest pause. |

#### 5.3.4 Reflection Screen UX

The reflection screen surfaces:
1. The exact flagging reason in plain language (Hindi / Marwadi / English as selected).
2. The user's current cash cushion and upcoming liability due dates.
3. A countdown ring showing seconds remaining.
4. A prominent **green** "Cancel Payment" button (active immediately).
5. A **grey, disabled** "Confirm Payment" button that unlocks only when the countdown reaches zero.

---

### 5.4 On-Device Personalisation Model

**What it does:** The system learns the user's individual patterns over time, reducing false positives (e.g., Ramesh always buys dinner from a specific food stall after his evening shift — this should eventually be classified as routine, not impulsive).

#### 5.4.1 Model Architecture Selection: Model-Based Learning

**Chosen approach:** Online logistic regression with temporal feature vectors, persisted as model weights on the local device.

**Alternative considered:** Instance-Based Learning (IBL / k-Nearest Neighbours), which would store every past transaction and classify new ones by proximity to past examples.

**Rationale for Model-Based Learning over IBL:**

| Dimension | Instance-Based (k-NN) | Model-Based (Online Logistic Regression) |
| :-- | :-- | :-- |
| **Inference time** | O(N) — grows with every stored transaction | O(1) — evaluates a fixed weight vector |
| **Storage footprint** | Grows indefinitely; impractical on 32GB entry-level Android devices | Constant; 4 sub-models × ~400 weight slots = negligible storage |
| **Cold-start behaviour** | Cannot classify anything without historical examples | Starts with a conservative prior (bias toward "essential"), becomes more personalised with each confirmed transaction |
| **Irregular income resilience** | Breaks down for Sunita's sparse, irregular transaction history — nearest neighbours do not exist yet | Degrades gracefully; prior weights hold until enough observations shift them |
| **Battery & CPU cost** | High on low-end devices during real-time payment flow | Negligible |

#### 5.4.2 Model Parameters

The model operates four independent logistic regression sub-models, each predicting P(impulsive) from a single temporal feature:

| Sub-Model | Feature | Range |
| :-- | :-- | :-- |
| Hourly | Hour of day | 0–23 |
| Weekly | Day of week | 0 (Sunday) – 6 (Saturday) |
| Monthly | Day of month | 1–31 |
| Seasonal | Day of year | 1–366 |

Combined prediction: `P(impulsive) = mean(σ(w₁·hour + b₁), σ(w₂·weekday + b₂), σ(w₃·monthday + b₃), σ(w₄·yearday + b₄))`

**Initial bias:** −0.3 for all sub-models (prior favours "essential"), preventing over-triggering for new users.

**Learning rate:** 0.2 — fast enough for noticeable personalisation within 2–3 weeks; slow enough to prevent wild swings from a single anomalous day.

#### 5.4.3 Reinforcement Signal

| User Action | Model Update |
| :-- | :-- |
| Cancels payment during reflection window | Increases weights for the current temporal context → similar sessions flagged sooner in future |
| Confirms payment after cooldown expires | Decreases weights for current context → similar sessions generate softer friction over time |

**Privacy boundary:** The model weights are stored exclusively in the device's local encrypted storage. They are never transmitted to any server. The learning is entirely on-device.

---

### 5.5 Automated Micro-Savings — Chillar Vault & Variable RD

**What it does:** Every completed UPI payment is rounded up to the nearest ₹10. The difference (e.g., ₹7 from a ₹173 payment) is held in a virtual on-device "Chillar Vault." When the vault balance crosses a user-configured sweep threshold (default: ₹100), the accumulated amount is automatically swept into the user's linked Variable Recurring Deposit at a partner Small Finance Bank.

**Rationale:**
- Round-up amounts per transaction are sub-₹10 — psychologically below the threshold of perceived loss.
- The compound effect is material: a user making 5 transactions per day averages ~₹25 in round-ups daily, or ~₹750/month swept into an instrument earning 7%–7.8% p.a. (current Ujjivan / AU Small Finance Bank Variable RD rates as of July 2026).
- This directly addresses Ramesh's need to "eventually move savings into a formal bank account" without requiring a branch visit or a fixed monthly commitment.
- For Sunita, variable deposit amounts mean she contributes whatever is generated by her irregular transactions — no fixed installment, no penalty for gaps.

**Flexi / Variable RD Product Notes:**
- The product in Indian banking terminology is a **Variable Recurring Deposit** or **Systematic Deposit Plan** (terminology varies by bank). Unlike a standard RD, it does not require a fixed amount per installment and typically does not penalise gaps.
- Representative rates (July 2026): Ujjivan SFB up to 7.80% p.a.; AU Small Finance Bank 6.35%–7.40% p.a.; Unity Small Finance Bank up to 8.00% p.a. Rates quoted in the app must always be marked "indicative; subject to revision" to comply with RBI disclosure norms.

---

### 5.6 UPI AutoPay Mandate for EMI Scheduling

**What it does:** Users can register a recurring UPI AutoPay mandate for fixed liability payments (e.g., Ramesh's ₹1,200 weekly vehicle EMI). The mandate auto-debits on the scheduled date without requiring manual action.

**Rationale:** UPI AutoPay (NPCI), launched on the UPI 2.0 rails, supports mandates up to ₹1 lakh per transaction for most categories, and up to ₹15,000 for standard subscriptions. A ₹1,200 weekly EMI falls well within this limit. This eliminates the single most critical failure point for Ramesh: forgetting to pay on a tired, late-night post-shift evening.

**Compliance note:** Per NPCI guidelines, users must receive a pre-debit notification (PDN) at least 24 hours before any AutoPay debit executes. FundKosh must send this notification via push notification AND a Hindi-language voice alert through the in-app voice agent.

---

### 5.7 Multilingual Interface & Localisation

**What it does:** The entire application — UI labels, error messages, nudge copy, notification text, and voice agent responses — is available in three languages selectable at first launch and changeable at any time from Settings.

| Language | Script | Notes |
| :-- | :-- | :-- |
| **English** | Latin | Default; required for regulatory disclosures |
| **Hindi** | Devanagari | Full UI + voice support |
| **Marwadi** | Devanagari (regional variant) | Full UI + voice support |

**Rationale:** The initial user research and validation cohort for FundKosh was sourced entirely from Jaipur, Rajasthan. Jaipur's working-class and informal-sector population is predominantly Hindi and Marwadi speaking. Marwadi, spoken by an estimated 13 million people in Rajasthan, is linguistically distinct enough from standard Hindi that Sunita's persona — a native Marwadi speaker — may struggle with formal Hindi interface copy. Supporting Marwadi is a direct equity decision.

**Language selection:** A prominent, icon-driven language selector appears at first launch — before any onboarding step — so the user never encounters an English-only screen. Subsequent in-app language changes take effect immediately without requiring a restart.

---

### 5.8 Compliance-Constrained Voice Assistant

**What it does:** A voice-in / voice-out assistant allows users to ask questions about their balance, upcoming EMIs, vault balance, and daily budget in Hindi or Marwadi, and receive spoken responses in the same language.

**Who it primarily serves:** Sunita, who cannot navigate text-heavy interfaces; Ramesh, who uses the app hands-free while riding between deliveries.

**Interaction design:**
- User taps a persistent floating mic button.
- Speaks a question in Hindi, Marwadi, or English.
- App transcribes (on-device, not cloud ASR, to protect financial data), matches intent to a local data query, and generates a spoken response.
- Response is played audibly AND displayed as text simultaneously.

**Legal & Compliance Guardrails:**
The voice assistant is a financial information tool, not a financial adviser. Under India's regulatory framework (SEBI IA Regulations, 2013 as amended 2024; RBI Digital Lending Guidelines, 2022), providing personalised financial advice requires specific registration. FundKosh is not so registered. Therefore:

- The assistant **must never** make certain, absolute, or forward-looking predictions about a user's financial outcomes.
- **Prohibited language categories:** Guarantees ("your savings will be"), certainties ("you must / you should"), definitive predictions ("this payment will cause").
- **Mandatory uncertainty qualifiers:** All contextual statements must use hedged language — "may," "might," "could," "appears to," "based on current data," "subject to other debits," "is typically."

**Example compliant response:**
> *"Aapka Chillar balance abhi ₹87 hai. Agar ek-do aur payments hote hain, toh vault sweep ho sakta hai — lekin yeh dusre transactions par nirbhar karta hai."*
> ("Your Chillar balance is currently ₹87. If one or two more payments happen, the vault may sweep — but this depends on other transactions.")

**Example non-compliant response (prohibited):**
> *"Aapka vault kal ₹100 tak pahunch jayega."* ("Your vault will reach ₹100 tomorrow.") — **This phrasing is prohibited.**

---

## 6. System Architecture

### 6.1 FundKosh's Role in the UPI Ecosystem

FundKosh is a **Third-Party Application Provider (TPAP)** within the NPCI UPI framework. This is the same category occupied by Google Pay, PhonePe, and Paytm. The key regulatory facts about this classification:

- FundKosh does **not** hold user funds. Funds reside in the user's linked bank account.
- FundKosh does **not** process UPI transactions directly. All network communication is handled by a **PSP Bank** (Payment Service Provider Bank), which is a direct member of the NPCI network.
- FundKosh integrates the **NPCI UPI SDK / Common Library** — a certified, NPCI-provided software module — for the secure PIN collection and transaction submission layer. This library runs in an isolated process and is never accessible to the FundKosh application layer.

### 6.2 End-to-End UPI Payment Flow with Speed-Bump Intercept

```
╔══════════════════════════════════════════════════════════════════════════╗
║                        USER DEVICE (PAYER)                               ║
║                                                                          ║
║  ┌─────────────────┐   1. Initiate       ┌──────────────────────────┐   ║
║  │  FundKosh App   │ ─────────────────►  │  Speed-Bump Engine       │   ║
║  │   (TPAP Layer)  │                     │  · Risk State Assessment  │   ║
║  │                 │ ◄─────────────────  │  · Budget Snapshot        │   ║
║  │                 │  2. Risk verdict    │  · Cooldown Timer (if req)│   ║
║  │                 │                     └──────────────────────────┘   ║
║  │                 │  3. If green / user confirms after cooldown:        ║
║  │                 │  ─────────────────────────────────────────────────►  ║
║  │  ┌────────────┐ │                     ┌──────────────────────────┐   ║
║  │  │ NPCI UPI   │ │  4. PIN entered     │  Isolated NPCI CL        │   ║
║  │  │ SDK / CL   │ │ ◄─────────────────  │  (No FundKosh access)    │   ║
║  │  └────────────┘ │                     └──────────────────────────┘   ║
╚══════════╤═══════════════════════════════════════════════════════════════╝
           │ 5. Encrypted UPI payload (device-side PIN hashing)
           ▼
┌─────────────────────┐    6. Route &      ┌────────────────┐
│  Partner PSP Bank   │ ─────────────────► │  NPCI UPI      │
│  (Payer's gateway)  │                    │  Central Switch│
└─────────────────────┘ ◄───────────────── └───────┬────────┘
           │             8. Debit confirmed          │ 7. Route to
           │                                         ▼    beneficiary
┌─────────────────────┐                    ┌────────────────┐
│  Payer Issuer Bank  │                    │ Payee PSP Bank │
│  (Core Banking /   │                    │ (Credit posted)│
│   CBS)             │                    └────────────────┘
└─────────────────────┘
```

**Key architectural points:**
1. **Steps 1–3 happen entirely on-device**, with zero network latency contribution from FundKosh's logic. The risk assessment and reflection screen are a local computation.
2. **Step 4** invokes the NPCI-certified Common Library. FundKosh's code has no access to the PIN or the cryptographic keys used in this module. This is a security requirement enforced by NPCI for all TPAPs.
3. **Step 5 onwards** is the standard NPCI UPI clearing and settlement flow. FundKosh has no further involvement; it listens to a transaction status callback from the PSP bank to update the local ledger.

---

### 6.3 Variable RD Micro-Savings Integration Architecture

The Chillar Vault sweep integrates with a partner Small Finance Bank via two regulatory mechanisms: the **RBI Account Aggregator (AA) Framework** for user consent, and a **UPI AutoPay mandate** or **bank API sweep call** for the actual fund movement.

**The Account Aggregator Framework** (commercially live since Sept 2021; regulated by RBI; 17 operational AAs as of mid-2026, with 1,120+ participating financial entities) allows FundKosh to request the user's bank statement data — with explicit, granular, revocable consent — to build the accurate liability and balance picture that powers the Risk State engine.

```
  User gives one-time                Consent Artefact
  AA consent in app                  (stored by AA,
       │                              not FundKosh)
       ▼                                    │
┌─────────────┐   Consent   ┌───────────┐   │   ┌─────────────────┐
│  FundKosh   │ ──────────► │  Account  │ ──┴──► │  User's Bank    │
│  (FIU)      │             │ Aggregator│       │  (FIP: provides │
│             │ ◄────────── │  (RBI-    │ ◄───── │  balance/txn    │
│  Updates    │  Balance &  │ licensed) │        │  data)          │
│  Risk State │  Liab. data │           │        └─────────────────┘
└─────────────┘             └───────────┘
```

**Vault Sweep Flow:**
```
On-device Chillar Vault crosses sweep threshold (e.g., ₹100)
       │
       ▼
FundKosh initiates a pre-authorised UPI AutoPay debit
(Mandate set up once at onboarding; ₹1,200 max per sweep,
 well within UPI AutoPay limits for savings-category mandates)
       │
       ▼
User's primary bank account is debited by sweep amount
       │
       ▼
Partner Small Finance Bank's API receives credit instruction
and allocates funds to user's Variable RD account
(Account opened once via video-KYC at onboarding)
       │
       ▼
App receives confirmation webhook; updates
local Vault balance and Flexi-RD ledger display
```

> [!IMPORTANT]
> Per NPCI UPI AutoPay guidelines, every recurring mandate debit must be preceded by a **Pre-Debit Notification (PDN)** sent to the user at least **24 hours before execution**. For vault sweeps this is waived only if the mandate was set up as "as-and-when" (non-recurring), which is the recommended configuration. Legal must confirm applicable mandate type with the PSP bank.

---

## 7. Data Architecture & Privacy Compliance

### 7.1 Data Residency & Localisation

All raw transaction data, account balances, liability schedules, and machine learning model weights are stored **exclusively on the user's local device** using hardware-sandboxed encrypted storage.

This design decision is driven by two simultaneous imperatives:

1. **User Trust (Sunita Test):** Sunita Devi's persona explicitly flags that she has been misled by financial institutions before and is wary of any app "asking for her data." A strictly local data architecture allows the team to make a plain, auditable promise: *"Your transaction history never leaves your phone."*

2. **Regulatory Compliance:** The RBI mandates that all end-to-end payment system data be stored exclusively on servers located in India. For consumer-side data (the local transaction ledger FundKosh maintains), storing on-device exceeds this requirement by eliminating server-side storage entirely. Under the DPDP Act 2023, on-device processing also minimises the "personal data" that FundKosh as a Data Fiduciary is required to manage, reducing regulatory exposure.

**What does go to FundKosh servers:** Aggregated, non-personal analytics (feature-level crash reports, anonymised funnel metrics) and the authentication token exchange required for the AA consent flow. Raw financial data is never included.

### 7.2 Consent Architecture (DPDP Act 2023 Compliance)

| Data Flow | Consent Type | Storage Location |
| :-- | :-- | :-- |
| Bank balance & liabilities via AA | Granular, revocable consent artefact managed by licensed AA | AA intermediary; not FundKosh |
| Transaction history (local ledger) | App permissions at install | Device only |
| ML model weights | Implicit (no personal data; model contains no raw transaction content) | Device only |
| Voice query audio | Ephemeral; processed on-device; never stored | Discarded after intent extraction |

---

## 8. Regulatory & Legal Compliance

| Regulation | Obligation | How FundKosh Complies |
| :-- | :-- | :-- |
| **NPCI UPI Framework** | Must operate as TPAP with a licensed PSP Bank partner | Partner PSP Bank is the registered UPI member; FundKosh TPAP agreement is in place |
| **RBI Payment Aggregator Guidelines** | If processing payments: must be licensed PA | FundKosh does not aggregate payments; it is a TPAP referencing the PSP's infrastructure |
| **RBI Data Localisation** | Payment data stored in India | Local on-device; no cloud egress of raw payment data |
| **DPDP Act 2023** | Granular consent, purpose limitation, withdrawal mechanism | AA framework manages bank data consent; local storage eliminates server-side data liability |
| **SEBI IA Regulations (as amended 2024)** | Cannot provide investment advice without registration | Voice assistant and all UI copy uses mandatory hedged language; no investment advice is provided |
| **NPCI UPI AutoPay Guidelines** | Pre-debit notification ≥ 24 hours before recurring debit | App sends push + voice alert 24h before any AutoPay EMI debit |
| **Consumer Protection Act 2019** | No unfair trade practices; clear pricing | Zero-fee transaction model in pilot; any future fees disclosed upfront in plain Hindi |

> [!CAUTION]
> This document is not a legal opinion. All regulatory positions must be reviewed and signed off by qualified legal counsel and a SEBI/RBI compliance specialist before the product ships to any user.

---

## 9. Non-Functional Requirements

| Category | Requirement | Target |
| :-- | :-- | :-- |
| **Latency** | Time from "Pay" tap to Speed-Bump risk score computed and screen rendered | < 200 ms on a 4GB RAM Android device |
| **Offline Resilience** | Core Risk State and daily budget calculations must function with no internet | Full offline support; AA data cached locally with user-consented refresh |
| **App Size** | Total installable APK size | < 15 MB (critical for entry-level devices with limited storage) |
| **Battery** | Background processes during a standard 8-hour active session | < 2% battery draw from FundKosh background tasks |
| **Accessibility** | Screen reader compatibility (TalkBack on Android) | Full compatibility; all interactive elements labelled in Hindi and English |
| **Voice ASR Accuracy** | Word Error Rate on Rajasthani-accented Hindi and Marwadi speech | ≤ 15% WER in testing environment |
| **Crash Rate** | App stability | < 0.5% crash-free session failure rate |
| **Security** | Local database encryption | AES-256 encryption via Android Keystore hardware-backed key |

---

## 10. Success Metrics & KPIs

### 10.1 North Star Metric
**Percentage of users who, after 30 days, report at least one instance of cancelling a discretionary payment because of a FundKosh nudge AND still have their most recent EMI/fixed liability paid on time.**

This composite metric captures both the behavioural and the financial wellness impact simultaneously.

### 10.2 Detailed KPI Dashboard

| Category | Metric | Target (Pilot — 90 Days) | How Measured |
| :-- | :-- | :-- | :-- |
| **Core Behaviour Change** | Speed-bump cancellation rate (VULNERABLE/CRITICAL sessions only) | 20%–35% | Local ledger: % of reflection screens followed by payment BLOCKED status |
| **Financial Health** | EMI/fixed liability on-time rate (Ramesh cohort) | ≥ 90% | AutoPay execution logs + manual confirmation |
| **Savings Accumulation** | Median Chillar Vault → RD swept per active user per month | ≥ ₹400 | Local vault sweep log |
| **ML Quality** | False positive rate — reflection triggered for verifiable essential payments | < 8% | User override signals (tagged as essential after friction) |
| **Accessibility** | Share of active sessions conducted in Hindi or Marwadi | ≥ 55% | Language setting in local session log |
| **Voice Engagement** | Share of active users who complete ≥ 1 voice query per week | ≥ 30% | Local voice event log |
| **Retention** | Day 30 retention | ≥ 40% | App session data |
| **Trust Signal** | Percentage of users who link their RD account within 7 days of install | ≥ 25% | Onboarding funnel completion |

---

## 11. Roadmap

### Phase 1 — Closed Pilot (Jaipur, 500 Users)
- Core Speed-Bump engine, Risk State predictor, Chillar Vault (on-device only).
- Hindi and Marwadi UI.
- UPI AutoPay mandate for EMI scheduling.
- Voice assistant (basic intent matching: balance, vault, next EMI).
- Partner SFB onboarding for Variable RD linkage.

### Phase 2 — City Expansion (Rajasthan + 2 Additional Tier 2 Cities)
- AA framework integration for real-time bank balance pull (replacing manual balance declaration).
- Expanded voice NLP — conversational follow-up questions, multi-turn sessions.
- Marwadi ASR model fine-tuning based on pilot voice data.
- Festival-season and event multiplier real-time feed (weather API + local event calendar API).
- WhatsApp-based onboarding funnel (meeting users where Ramesh already is).

### Phase 3 — Multi-City Scale
- Shared household profiles: Ramesh and Priya can link accounts to show household liabilities together.
- Expanded language support based on city cohort demographics.
- SEBI-registered investment referral (third-party; FundKosh as distributor, not adviser) for users who build > ₹5,000 in RD savings.
- Credit-building module: on-time EMI track record surfaced as financial health certificate (compatible with AA FIP data for credit underwriting).
