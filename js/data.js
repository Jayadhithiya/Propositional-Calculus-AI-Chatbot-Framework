// ============================================================
// data.js — Pre-loaded Customer Support Domain Data
// Propositional Calculus Framework for AI Chatbot Decision Making
// ============================================================

const INITIAL_PROPOSITIONS = [
  // --- Billing ---
  { id: "P1",  label: "User reports billing issue",          value: false, category: "billing" },
  { id: "P2",  label: "User account is active",              value: true,  category: "billing" },
  { id: "P3",  label: "Payment is overdue",                  value: false, category: "billing" },
  { id: "P4",  label: "User requests refund",                value: false, category: "billing" },
  { id: "P5",  label: "Issue within 30-day refund window",   value: false, category: "billing" },
  { id: "P6",  label: "Subscription plan is active",         value: true,  category: "billing" },

  // --- Technical ---
  { id: "P7",  label: "User reports technical issue",        value: false, category: "technical" },
  { id: "P8",  label: "Product is under warranty",           value: true,  category: "technical" },
  { id: "P9",  label: "Issue reproducible on multiple devices", value: false, category: "technical" },
  { id: "P10", label: "Software version is outdated",        value: false, category: "technical" },
  { id: "P11", label: "Hardware defect detected",            value: false, category: "technical" },

  // --- Account ---
  { id: "P12", label: "User forgot password",                value: false, category: "account" },
  { id: "P13", label: "Two-factor auth is enabled",          value: false, category: "account" },
  { id: "P14", label: "Account locked due to attempts",      value: false, category: "account" },
  { id: "P15", label: "User wants to delete account",        value: false, category: "account" },

  // --- Support Level ---
  { id: "P16", label: "User is premium customer",            value: false, category: "support" },
  { id: "P17", label: "Human agent is available",            value: true,  category: "support" },
  { id: "P18", label: "Escalation required",                 value: false, category: "support" },
  { id: "P19", label: "User sentiment is negative",          value: false, category: "support" },
  { id: "P20", label: "Issue unresolved after 2 attempts",   value: false, category: "support" },
];

const INITIAL_RULES = [
  // ---- Billing Rules ----
  {
    id: "R1",
    name: "Billing Escalation",
    category: "billing",
    formula: "P1 ∧ P3",
    conclusion: "ESCALATE_BILLING",
    response: "⚠️ I can see your account has an overdue payment. I'm escalating this to our billing team immediately. You'll receive an email within 2 hours with payment options.",
    priority: 9,
    enabled: true
  },
  {
    id: "R2",
    name: "Refund Approved",
    category: "billing",
    formula: "P4 ∧ P5",
    conclusion: "PROCESS_REFUND",
    response: "✅ Great news! Your request qualifies for a full refund under our 30-day guarantee. I'm processing it now — you'll see the amount credited in 3-5 business days.",
    priority: 10,
    enabled: true
  },
  {
    id: "R3",
    name: "Refund Window Expired",
    category: "billing",
    formula: "P4 ∧ ¬P5",
    conclusion: "OFFER_STORE_CREDIT",
    response: "😔 Unfortunately, your purchase is outside our 30-day refund window. However, I'd like to offer you store credit of equal value as a goodwill gesture. Would you like to accept?",
    priority: 8,
    enabled: true
  },
  {
    id: "R4",
    name: "Account Suspended",
    category: "billing",
    formula: "P1 ∧ ¬P2",
    conclusion: "GUIDE_REACTIVATION",
    response: "🔒 It looks like your account is currently suspended, likely due to a billing issue. Let me guide you through the reactivation process — I'll need to verify your identity first.",
    priority: 9,
    enabled: true
  },
  {
    id: "R5",
    name: "Billing General Inquiry",
    category: "billing",
    formula: "P1 ∧ P2 ∧ ¬P3",
    conclusion: "BILLING_INQUIRY",
    response: "📄 I can see your account is in good standing. Let me pull up your billing details. What specifically would you like to know — your last invoice, current plan, or upcoming charges?",
    priority: 5,
    enabled: true
  },

  // ---- Technical Rules ----
  {
    id: "R6",
    name: "Warranty Replacement",
    category: "technical",
    formula: "P7 ∧ P8 ∧ P11",
    conclusion: "WARRANTY_REPLACEMENT",
    response: "🔧 Your product qualifies for a warranty replacement! I'm creating a replacement order. You'll receive a prepaid shipping label via email to return the defective unit.",
    priority: 10,
    enabled: true
  },
  {
    id: "R7",
    name: "Software Update Fix",
    category: "technical",
    formula: "P7 ∧ P10",
    conclusion: "SUGGEST_UPDATE",
    response: "💻 It looks like you're running an outdated version. Many issues are resolved in the latest update. Here's the download link: [Update Now]. Would you like step-by-step update instructions?",
    priority: 7,
    enabled: true
  },
  {
    id: "R8",
    name: "Multi-device Technical Issue",
    category: "technical",
    formula: "P7 ∧ P9 ∧ ¬P10",
    conclusion: "ESCALATE_TECH",
    response: "🛠️ This issue affecting multiple devices suggests a deeper technical problem. I'm escalating this to our Level 2 technical team. Please keep your device nearby — a specialist will call you within 30 minutes.",
    priority: 9,
    enabled: true
  },
  {
    id: "R9",
    name: "Basic Troubleshooting",
    category: "technical",
    formula: "P7 ∧ ¬P9 ∧ ¬P10 ∧ ¬P11",
    conclusion: "BASIC_TROUBLESHOOT",
    response: "🔍 Let's troubleshoot this together. First, try these steps:\n1. Restart the application\n2. Clear the cache (Settings > Clear Cache)\n3. Reinstall if the issue persists\nDid any of these help?",
    priority: 5,
    enabled: true
  },

  // ---- Account Rules ----
  {
    id: "R10",
    name: "Password Reset with 2FA",
    category: "account",
    formula: "P12 ∧ P13",
    conclusion: "RESET_WITH_2FA",
    response: "🔐 I'll help you reset your password. Since 2FA is enabled on your account, I'll send a verification code to your registered phone/email. Check your inbox and enter the code here.",
    priority: 8,
    enabled: true
  },
  {
    id: "R11",
    name: "Password Reset Simple",
    category: "account",
    formula: "P12 ∧ ¬P13",
    conclusion: "RESET_PASSWORD",
    response: "📧 No problem! I've sent a password reset link to your registered email address. The link expires in 24 hours. Please check your spam folder if you don't see it in 2 minutes.",
    priority: 7,
    enabled: true
  },
  {
    id: "R12",
    name: "Account Locked",
    category: "account",
    formula: "P14",
    conclusion: "UNLOCK_ACCOUNT",
    response: "🔓 Your account was temporarily locked after multiple failed login attempts — this is a security measure. I'm sending an unlock link to your email now. It'll be active for 1 hour.",
    priority: 9,
    enabled: true
  },
  {
    id: "R13",
    name: "Account Deletion Request",
    category: "account",
    formula: "P15",
    conclusion: "CONFIRM_DELETION",
    response: "⚠️ I understand you want to delete your account. This is irreversible and will remove all your data. Before I proceed, I'd like to offer you a 30-day pause instead. Would you like to reconsider, or shall I proceed with deletion?",
    priority: 8,
    enabled: true
  },

  // ---- Escalation Rules ----
  {
    id: "R14",
    name: "Premium Escalation",
    category: "support",
    formula: "P16 ∧ P18",
    conclusion: "PREMIUM_AGENT",
    response: "⭐ As a Premium customer, you're being connected to a dedicated senior support specialist. Please hold — your wait time is under 2 minutes.",
    priority: 10,
    enabled: true
  },
  {
    id: "R15",
    name: "Negative Sentiment Escalation",
    category: "support",
    formula: "P19 ∧ P17",
    conclusion: "EMPATHY_ESCALATION",
    response: "💙 I'm truly sorry about your experience. I can hear your frustration and I want to make this right. I'm connecting you with a senior agent right now who will personally handle your case.",
    priority: 9,
    enabled: true
  },
  {
    id: "R16",
    name: "Persistent Issue Escalation",
    category: "support",
    formula: "P20 ∧ P18",
    conclusion: "FORCE_ESCALATE",
    response: "🚨 I see this issue hasn't been resolved in previous attempts. I'm marking this as high priority and escalating immediately. A supervisor will reach out within 1 hour.",
    priority: 10,
    enabled: true
  },
  {
    id: "R17",
    name: "No Agent Available",
    category: "support",
    formula: "P18 ∧ ¬P17",
    conclusion: "SCHEDULE_CALLBACK",
    response: "📅 All our agents are currently busy. I've added you to the priority queue and you'll receive a callback within 2 hours. Would you prefer email follow-up instead?",
    priority: 7,
    enabled: true
  },
];

const CHATBOT_INTENTS = [
  {
    keywords: ["bill", "billing", "invoice", "charge", "payment", "pay", "charged"],
    propositions: { P1: true },
    name: "billing_issue"
  },
  {
    keywords: ["refund", "money back", "return", "reimburse"],
    propositions: { P4: true },
    name: "refund_request"
  },
  {
    keywords: ["overdue", "late", "missed payment", "failed payment", "declined"],
    propositions: { P3: true },
    name: "overdue_payment"
  },
  {
    keywords: ["not working", "broken", "error", "bug", "crash", "issue", "problem", "technical", "doesn't work", "cant", "can't"],
    propositions: { P7: true },
    name: "technical_issue"
  },
  {
    keywords: ["warranty", "defect", "damaged", "faulty", "hardware"],
    propositions: { P8: true, P11: true },
    name: "warranty_claim"
  },
  {
    keywords: ["update", "version", "outdated", "upgrade"],
    propositions: { P10: true },
    name: "update_issue"
  },
  {
    keywords: ["password", "forgot", "reset", "login", "sign in", "access"],
    propositions: { P12: true },
    name: "password_reset"
  },
  {
    keywords: ["locked", "blocked", "suspended", "can't login"],
    propositions: { P14: true },
    name: "account_locked"
  },
  {
    keywords: ["delete account", "cancel account", "close account", "remove account"],
    propositions: { P15: true },
    name: "account_deletion"
  },
  {
    keywords: ["angry", "frustrated", "terrible", "worst", "horrible", "unacceptable", "ridiculous", "disgusted"],
    propositions: { P19: true },
    name: "negative_sentiment"
  },
  {
    keywords: ["premium", "pro plan", "enterprise"],
    propositions: { P16: true },
    name: "premium_customer"
  },
  {
    keywords: ["still", "again", "still not", "not fixed", "happening again", "tried everything"],
    propositions: { P20: true, P18: true },
    name: "persistent_issue"
  },
];

const SAMPLE_CONVERSATIONS = [
  {
    title: "Billing & Refund Request",
    messages: [
      "Hi, I need to request a refund for my recent purchase",
      "I bought it last week so it should be within the return period",
      "Yes, please process the refund"
    ]
  },
  {
    title: "Technical Issue with Warranty",
    messages: [
      "My device is completely broken and not working at all",
      "It seems like a hardware defect",
      "Is it covered under warranty?"
    ]
  },
  {
    title: "Account Access Problem",
    messages: [
      "I forgot my password and can't login",
      "I've also set up two-factor authentication",
      "Please help me reset it"
    ]
  },
  {
    title: "Angry Premium Customer",
    messages: [
      "This is absolutely ridiculous! I'm a premium customer!",
      "My issue has been completely ignored and still not fixed",
      "I want to speak to a supervisor immediately"
    ]
  }
];

const DEFAULT_RESPONSE = "👋 Hello! I'm your AI-powered support assistant running on propositional logic. I can help you with billing issues, technical problems, account access, refunds, and more.\n\nTry describing your issue and I'll analyze it using logical rules to find the best solution!";

const FALLBACK_RESPONSES = [
  "I understand you're reaching out. Could you please provide more details about your issue? For example:\n- Is this related to **billing** or **payments**?\n- Are you facing a **technical problem**?\n- Do you need help with your **account**?",
  "I want to make sure I help you correctly. Could you clarify what kind of support you need today?",
  "I'm having trouble understanding the specific issue. Let me ask: Is this about your subscription, a product defect, account access, or something else?"
];
