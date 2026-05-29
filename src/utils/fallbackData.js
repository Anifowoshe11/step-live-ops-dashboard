export const FALLBACK = {
  onboarding: [
    {
      Timestamp: '5/27/2026 14:05:15',
      'Who Are You Onboarding?': 'Merchant',
      'Merchant Business Name': 'KloudLine',
      'Merchant Name': 'Babatunde',
      'Store Attendant Name': 'Tomiwa',
      'Assigned Zone': 'Computer Village',
      'Type of Store': 'Gadget Store',
      'Estimated Daily Customer Traffic': '50+',
      'Existing Financing Providers In Store': 'Yes',
      'Is Merchant Interested In QR Activation?': 'Yes',
      'Merchant Readiness Level': 'Active',
      'Field Agent Name': 'Babatunde',
    },
  ],
  daily: [
    {
      Timestamp: '5/27/2026 12:35:03',
      'Agent Name': 'Babatunde',
      Date: '5/27/2026',
      'Assigned Zone': 'Computer Village',
      'Total Merchants Visited Today': '6',
      "Interested Merchants But Couldn't Enroll": '6',
      'Comments On Merchant Visits': "The merchant couldn't complete enrolment due to network issues",
      'Total People Approached': '10',
      "Interested GP Leads But Couldn't Enroll": '5',
      'Comments On Gp Enrollment issue': 'Network issues',
      'Overall Field Experience Feedbacks/Recommendations':
        'We need to work on the response time of our QR codes',
    },
    {
      Timestamp: '5/28/2026 9:20:50',
      'Agent Name': 'Chile',
      Date: '5/28/2026',
      'Assigned Zone': 'Opebi/Alausa/toyin',
      'Total Merchants Visited Today': '50',
      "Interested Merchants But Couldn't Enroll": '10',
      'Comments On Merchant Visits': 'We need to work more on the QR code response time. They want more clarity on how payment works',
      'Total People Approached': '70',
      "Interested GP Leads But Couldn't Enroll": '10',
      'Comments On Gp Enrollment issue': "They don't understand how the enrollment works",
      'Overall Field Experience Feedbacks/Recommendations':
        'Need to work more on brand positioning. Also need to review our interest rates',
    },
  ],
};

export const SHEET_URLS = {
  onboarding:
    'https://docs.google.com/spreadsheets/d/1D4Ms9jutyhM2kuVmSN5S1_820sAu2PQU9YT1lJwZPD8/export?format=csv&gid=2096627106',
  daily:
    'https://docs.google.com/spreadsheets/d/1ryixaP5g9VRHjYTtKJW1SzuE04KkbBir-wSYILyzhHY/export?format=csv&gid=1136748544',
};
