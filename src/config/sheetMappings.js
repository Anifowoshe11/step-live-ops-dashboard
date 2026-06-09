// Update these field names if the Google Form / Sheet headers change.
// The transform layer reads only from this config so you can remap columns here
// without editing the parsing logic.

export const ONBOARDING_COLUMN_MAP = {
  submittedAt: ['Timestamp', 'Submission Timestamp', 'Date Submitted'],
  onboardingType: ['Who Are You Onboarding?', 'Who Are You Onboarding', 'Onboarding Type'],
  businessName: ['Merchant Business Name', 'Business Name', 'Store Name'],
  merchantName: ['Merchant Name', 'Owner Name', 'Business Owner Name'],
  attendantName: ['Store Attendant Name', 'Attendant Name'],
  phoneNumber: ['Phone Number', 'Merchant Phone Number', 'Phone', 'Primary Phone Number'],
  whatsappNumber: [
    'WhatsApp Number',
    'Whatsapp Number',
    'WhatsApp Contact',
    'WhatsApp Phone Number',
  ],
  storeAddress: ['Store Address', 'Merchant Address', 'Business Address', 'Store Location'],
  zone: ['Assigned Zone', 'Cluster/ Zone', 'Cluster Zone', 'Zone'],
  storeType: ['Type of Store', 'Store Type'],
  trafficBand: ['Estimated Daily Customer Traffic', 'Daily Customer Traffic'],
  storePhoto: ['Upload Store Photo', 'Store Photo', 'Upload Shop Photo', 'Storefront Photo'],
  readiness: ['Merchant Readiness Level', 'Readiness Level', 'Merchant Readiness'],
  wantsQr: [
    'Is Merchant Interested In QR Activation?',
    'QR Activation Interest',
    'Interested In QR Activation',
  ],
  existingFinancing: [
    'Existing Financing Providers In Store',
    'Existing Financing Providers',
    'Financing Providers',
  ],
  agentName: ['Field Agent Name', 'Acquired By', 'Agent Name'],
  notes: ['Additional Notes', 'Notes', 'Comments'],
};

export const FINAL_DAY_REPORT_COLUMN_MAP = {
  submittedAt: 'Timestamp',
  activityDate: 'Date',
  agentName: 'Agent Name',
  zone: 'Assigned Zone',
  merchantsVisited: 'Total Merchants Visited Today',
  blockedEnrollments: "Interested Merchants But Couldn't Enroll",
  enrolledMerchant: 'Enrolled Merchant',
  peopleApproached: 'Total People Approached',
  blockedGpLeads: "Interested GP Leads But Couldn't Enroll",
  merchantVisitComment: 'Comments On Merchant Visits',
  gpEnrollmentComment: 'Comments On Gp Enrollment issue',
  feedback: 'Overall Field Experience Feedbacks/Recommendations',
};

export const MERCHANT_ONBOARDING_TYPE_ALIASES = [
  'merchant',
  'merchants',
  'store',
  'stores',
  'business',
  'business owner',
];

export const ONBOARDING_RECORD_COLUMNS = [
  { key: 'submittedAt', label: 'Timestamp', recordField: 'submittedAtLabel' },
  { key: 'onboardingType', label: 'Who Are You Onboarding?', recordField: 'onboardingType' },
  { key: 'agentName', label: 'Field Agent Name / Acquired By', recordField: 'agentName' },
  { key: 'businessName', label: 'Merchant Business Name', recordField: 'businessName' },
  { key: 'merchantName', label: 'Merchant Name', recordField: 'merchantName' },
  { key: 'attendantName', label: 'Store Attendant Name', recordField: 'attendantName' },
  { key: 'phoneNumber', label: 'Phone Number', recordField: 'phoneNumber' },
  { key: 'whatsappNumber', label: 'WhatsApp Number', recordField: 'whatsappNumber' },
  { key: 'storeAddress', label: 'Store Address', recordField: 'storeAddress' },
  { key: 'zone', label: 'Assigned Zone / Cluster Zone', recordField: 'zone' },
  { key: 'storeType', label: 'Type of Store', recordField: 'storeType' },
  { key: 'trafficBand', label: 'Estimated Daily Customer Traffic', recordField: 'trafficBand' },
  {
    key: 'existingFinancing',
    label: 'Existing Financing Providers',
    recordField: 'existingFinancing',
  },
  { key: 'wantsQr', label: 'QR Activation Interest', recordField: 'wantsQr' },
  { key: 'readiness', label: 'Merchant Readiness Level', recordField: 'readiness' },
  { key: 'notes', label: 'Notes', recordField: 'notes' },
  { key: 'storePhoto', label: 'Store Photo', recordField: 'storePhoto' },
];
