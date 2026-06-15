import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatNumber,
  isBlankObjectRow,
  normalizeText,
  parseDateValue,
  parseNumberValue,
  sumBy,
  toDateKey,
  uniq,
} from '../utils/dataUtils';
import {
  FINAL_DAY_REPORT_COLUMN_MAP,
  MERCHANT_ONBOARDING_TYPE_ALIASES,
  ONBOARDING_RECORD_COLUMNS,
  ONBOARDING_COLUMN_MAP,
} from '../config/sheetMappings';

const MIN_HEADER_MATCH_SCORE = 50;

function createEmptyStats() {
  return {
    rawRowCount: 0,
    nonBlankRowCount: 0,
    blankRowsRemoved: 0,
    parseErrorCount: 0,
  };
}

export function createEmptyMerchantOnboardingData() {
  return {
    records: [],
    merchantRecords: [],
    stats: {
      ...createEmptyStats(),
      merchantRows: 0,
      nonMerchantRows: 0,
      missingAgentName: 0,
      missingMerchantBusinessName: 0,
      duplicateHeaders: [],
      detectedHeaders: [],
      mappedHeaders: [],
      unmappedHeaders: [],
      resolvedHeaderMap: {},
      headerMatches: [],
      latestSubmissionAt: null,
    },
  };
}

export function createEmptyFinalDayReportData() {
  return {
    records: [],
    stats: {
      ...createEmptyStats(),
      missingAgentName: 0,
      invalidNumericValues: 0,
      invalidDateValues: 0,
      latestActivityAt: null,
      derivedEnrollmentRows: 0,
    },
  };
}

function latestDate(records, key) {
  return records.reduce((latest, record) => {
    if (!record[key]) {
      return latest;
    }

    if (!latest) {
      return record[key];
    }

    return record[key] > latest ? record[key] : latest;
  }, null);
}

function canonicalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function scoreHeaderMatch(candidate, header) {
  const candidateCanonical = canonicalizeHeader(candidate);
  const headerCanonical = canonicalizeHeader(header);

  if (!candidateCanonical || !headerCanonical) {
    return 0;
  }

  if (candidateCanonical === headerCanonical) {
    return 100;
  }

  if (headerCanonical.includes(candidateCanonical) || candidateCanonical.includes(headerCanonical)) {
    return 80;
  }

  const candidateTokens = candidateCanonical.split(' ').filter(Boolean);
  const headerTokens = new Set(headerCanonical.split(' ').filter(Boolean));
  const commonTokens = candidateTokens.filter((token) => headerTokens.has(token)).length;

  if (!commonTokens) {
    return 0;
  }

  return Math.round((commonTokens / candidateTokens.length) * 60);
}

function resolveColumnMap(headers, columnMap) {
  const resolvedMap = {};
  const matches = [];

  Object.entries(columnMap).forEach(([key, mapping]) => {
    const candidates = Array.isArray(mapping) ? mapping : [mapping];
    let bestMatch = null;

    candidates.forEach((candidate) => {
      headers.forEach((header) => {
        const score = scoreHeaderMatch(candidate, header);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { requested: candidate, resolved: header, score };
        }
      });
    });

    const resolvedHeader =
      bestMatch && bestMatch.score >= MIN_HEADER_MATCH_SCORE ? bestMatch.resolved : '';
    resolvedMap[key] = resolvedHeader;
    matches.push({
      key,
      requested: candidates,
      resolved: resolvedHeader,
      score: bestMatch?.score || 0,
    });
  });

  const mappedHeaders = uniq(matches.map((match) => match.resolved).filter(Boolean));
  const unmappedHeaders = headers.filter((header) => !mappedHeaders.includes(header));

  return {
    resolvedMap,
    mappedHeaders,
    unmappedHeaders,
    matches,
  };
}

function pickMappedValue(row, mapping) {
  const keys = Array.isArray(mapping) ? mapping : [mapping];

  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return '';
}

function isMerchantOnboardingType(value) {
  return MERCHANT_ONBOARDING_TYPE_ALIASES.includes(normalizeText(value));
}

function isAffirmativeValue(value) {
  const normalized = normalizeText(value);
  return ['yes', 'y', 'true', 'interested', 'active', 'enabled'].includes(normalized);
}

function isHighReadinessValue(value) {
  const normalized = normalizeText(value);
  return (
    normalized === 'high' ||
    normalized === 'high readiness' ||
    normalized === 'very high' ||
    normalized.startsWith('high ')
  );
}

function sortDateKey(left, right) {
  if (left === 'unknown' && right === 'unknown') {
    return 0;
  }

  if (left === 'unknown') {
    return 1;
  }

  if (right === 'unknown') {
    return -1;
  }

  return left.localeCompare(right);
}

function isStrictNumericValue(value) {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  const normalized = String(value).trim().replace(/,/g, '');
  return /^-?\d+(?:\.\d+)?$/.test(normalized);
}

function resolveEnrolledMerchantCount(rawValue, merchantsVisited, blockedEnrollments, counters) {
  if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
    if (isStrictNumericValue(rawValue)) {
      counters.numericEnrollmentRows += 1;
      return Math.max(Number(String(rawValue).trim().replace(/,/g, '')), 0);
    }

    counters.textEnrollmentRows += 1;
    return 1;
  }

  if (merchantsVisited !== null && blockedEnrollments !== null) {
    counters.derivedEnrollmentRows += 1;
    return Math.max(merchantsVisited - blockedEnrollments, 0);
  }

  return null;
}

export function transformMerchantOnboardingRows(rows, meta = {}) {
  const records = [];
  let missingAgentName = 0;
  let missingMerchantBusinessName = 0;
  const detectedHeaders = meta.headers || [];
  const resolvedColumns = resolveColumnMap(detectedHeaders, ONBOARDING_COLUMN_MAP);

  rows.forEach((row, index) => {
    if (isBlankObjectRow(row)) {
      return;
    }

    const submittedAt = parseDateValue(pickMappedValue(row, resolvedColumns.resolvedMap.submittedAt));
    const onboardingType = pickMappedValue(row, resolvedColumns.resolvedMap.onboardingType);
    const rawAgentName = pickMappedValue(row, resolvedColumns.resolvedMap.agentName);
    const rawZone = pickMappedValue(row, resolvedColumns.resolvedMap.zone);
    const rawReadiness = pickMappedValue(row, resolvedColumns.resolvedMap.readiness);
    const rawWantsQr = pickMappedValue(row, resolvedColumns.resolvedMap.wantsQr);
    const rawStorePhoto = pickMappedValue(row, resolvedColumns.resolvedMap.storePhoto);
    const agentName = rawAgentName || 'Unassigned';
    const isMerchant = isMerchantOnboardingType(onboardingType);

    const record = {
      id: `${pickMappedValue(row, resolvedColumns.resolvedMap.submittedAt) || 'row'}-${index}`,
      sourceRow: index + 2,
      submittedAt,
      submittedDateKey: toDateKey(submittedAt) || 'unknown',
      submittedDateLabel: submittedAt ? formatDisplayDate(submittedAt) : 'Unknown date',
      submittedAtLabel: submittedAt ? formatDisplayDateTime(submittedAt) : 'Unknown date',
      onboardingType,
      isMerchant,
      businessName: pickMappedValue(row, resolvedColumns.resolvedMap.businessName),
      merchantName: pickMappedValue(row, resolvedColumns.resolvedMap.merchantName),
      attendantName: pickMappedValue(row, resolvedColumns.resolvedMap.attendantName),
      phoneNumber: pickMappedValue(row, resolvedColumns.resolvedMap.phoneNumber),
      whatsappNumber: pickMappedValue(row, resolvedColumns.resolvedMap.whatsappNumber),
      storeAddress: pickMappedValue(row, resolvedColumns.resolvedMap.storeAddress),
      zone: rawZone || 'Unassigned zone',
      storeType: pickMappedValue(row, resolvedColumns.resolvedMap.storeType),
      trafficBand: pickMappedValue(row, resolvedColumns.resolvedMap.trafficBand),
      storePhoto: rawStorePhoto,
      readiness: rawReadiness,
      wantsQr: rawWantsQr,
      existingFinancing: pickMappedValue(row, resolvedColumns.resolvedMap.existingFinancing),
      agentName,
      rawAgentName,
      rawZone,
      hasQrInterest: isAffirmativeValue(rawWantsQr),
      isHighReadiness: isHighReadinessValue(rawReadiness),
      hasStorePhoto: Boolean(String(rawStorePhoto || '').trim()),
      hasValidTimestamp: Boolean(submittedAt),
      notes: pickMappedValue(row, resolvedColumns.resolvedMap.notes),
      raw: row,
    };

    if (!rawAgentName) {
      missingAgentName += 1;
    }

    if (isMerchant && !record.businessName) {
      missingMerchantBusinessName += 1;
    }

    records.push(record);
  });

  const merchantRecords = records.filter((record) => record.isMerchant);
  const unassignedAgentRows = merchantRecords.filter((record) => !record.rawAgentName).length;
  const missingTimestampRows = merchantRecords.filter((record) => !record.hasValidTimestamp).length;

  return {
    records,
    merchantRecords,
    stats: {
      rawRowCount: rows.length,
      nonBlankRowCount: records.length,
      blankRowsRemoved: meta.blankRowCount || Math.max(rows.length - records.length, 0),
      parseErrorCount: meta.parseErrors?.length || 0,
      merchantRows: merchantRecords.length,
      nonMerchantRows: records.length - merchantRecords.length,
      missingAgentName,
      missingMerchantBusinessName,
      unassignedAgentRows,
      missingTimestampRows,
      duplicateHeaders: (meta.headers || []).filter((header) => /_\d+$/.test(header)),
      latestSubmissionAt: latestDate(records, 'submittedAt'),
      detectedHeaders,
      mappedHeaders: resolvedColumns.mappedHeaders,
      unmappedHeaders: resolvedColumns.unmappedHeaders,
      resolvedHeaderMap: resolvedColumns.resolvedMap,
      headerMatches: resolvedColumns.matches,
    },
  };
}

function readNumericField(row, fieldName, counters) {
  const rawValue = row[fieldName];
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return null;
  }

  const parsed = parseNumberValue(rawValue);
  if (parsed === null) {
    counters.invalidNumericValues += 1;
  }

  return parsed;
}

// Column mapping for the final day sheet lives here. Update these keys if the form headers change.
export function transformFinalDayReportRows(rows, meta = {}) {
  const records = [];
  const counters = {
    missingAgentName: 0,
    invalidNumericValues: 0,
    invalidDateValues: 0,
    numericEnrollmentRows: 0,
    textEnrollmentRows: 0,
    derivedEnrollmentRows: 0,
  };

  rows.forEach((row, index) => {
    if (isBlankObjectRow(row)) {
      return;
    }

    const activityDate =
      parseDateValue(pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.activityDate)) ||
      parseDateValue(pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.submittedAt));

    if (!activityDate) {
      counters.invalidDateValues += 1;
    }

    const merchantsVisited = readNumericField(
      row,
      FINAL_DAY_REPORT_COLUMN_MAP.merchantsVisited,
      counters
    );
    const blockedEnrollments = readNumericField(
      row,
      FINAL_DAY_REPORT_COLUMN_MAP.blockedEnrollments,
      counters
    );
    const enrolledMerchantRaw = pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.enrolledMerchant);
    const peopleApproached = readNumericField(
      row,
      FINAL_DAY_REPORT_COLUMN_MAP.peopleApproached,
      counters
    );
    const blockedGpLeads = readNumericField(
      row,
      FINAL_DAY_REPORT_COLUMN_MAP.blockedGpLeads,
      counters
    );

    const enrolledMerchants = resolveEnrolledMerchantCount(
      enrolledMerchantRaw,
      merchantsVisited,
      blockedEnrollments,
      counters
    );

    const agentName = pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.agentName);
    if (!agentName) {
      counters.missingAgentName += 1;
    }

    records.push({
      id: `${
        pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.submittedAt) ||
        pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.activityDate) ||
        'row'
      }-${index}`,
      sourceRow: index + 2,
      activityDate,
      activityDateKey: toDateKey(activityDate),
      activityDateLabel: formatDisplayDate(activityDate),
      submittedAt: parseDateValue(pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.submittedAt)),
      agentName,
      zone: pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.zone),
      merchantsVisited,
      blockedEnrollments,
      enrolledMerchants,
      peopleApproached,
      blockedGpLeads,
      merchantVisitComment: pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.merchantVisitComment),
      gpEnrollmentComment: pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.gpEnrollmentComment),
      feedback: pickMappedValue(row, FINAL_DAY_REPORT_COLUMN_MAP.feedback),
      raw: row,
    });
  });

  return {
    records,
    stats: {
      rawRowCount: rows.length,
      nonBlankRowCount: records.length,
      blankRowsRemoved: meta.blankRowCount || Math.max(rows.length - records.length, 0),
      parseErrorCount: meta.parseErrors?.length || 0,
      missingAgentName: counters.missingAgentName,
      invalidNumericValues: counters.invalidNumericValues,
      invalidDateValues: counters.invalidDateValues,
      latestActivityAt: latestDate(records, 'activityDate'),
      numericEnrollmentRows: counters.numericEnrollmentRows,
      textEnrollmentRows: counters.textEnrollmentRows,
      derivedEnrollmentRows: counters.derivedEnrollmentRows,
    },
  };
}

function createSourceStatus(sourceResult, transformedData, fallbackLabel) {
  if (!sourceResult?.ok) {
    return {
      label: sourceResult?.sheet?.label || fallbackLabel,
      tone: 'err',
      detail: sourceResult?.error || 'Could not load source.',
    };
  }

  if (!transformedData.stats.nonBlankRowCount) {
    return {
      label: sourceResult.sheet.label,
      tone: 'wn',
      detail: 'Connected, but the sheet currently has no data rows.',
    };
  }

  return {
    label: sourceResult.sheet.label,
    tone: 'ok',
    detail: `${formatNumber(transformedData.stats.nonBlankRowCount)} live row(s) loaded.`,
  };
}

function buildOnboardingRecordColumns(detectedHeaders, resolvedHeaderMap) {
  const configuredColumns = ONBOARDING_RECORD_COLUMNS.map((column) => ({
    ...column,
    sourceHeader: resolvedHeaderMap?.[column.key] || '',
    valueType: 'mapped',
  }));
  const consumedHeaders = new Set(
    configuredColumns.map((column) => column.sourceHeader).filter(Boolean)
  );
  const extraColumns = (detectedHeaders || [])
    .filter((header) => !consumedHeaders.has(header))
    .map((header) => ({
      key: `raw:${header}`,
      label: header,
      recordField: '',
      sourceHeader: header,
      valueType: 'raw',
    }));

  return [...configuredColumns, ...extraColumns];
}

export function buildDashboardModel({ merchantOnboarding, finalDayReport, sourceResults }) {
  const merchantRecords = merchantOnboarding.merchantRecords;
  const merchantRecordsSorted = [...merchantRecords].sort((left, right) => {
    const leftTime = left.submittedAt ? left.submittedAt.getTime() : 0;
    const rightTime = right.submittedAt ? right.submittedAt.getTime() : 0;
    return rightTime - leftTime || right.sourceRow - left.sourceRow;
  });
  const finalDayRecords = finalDayReport.records;
  const allAgents = uniq([
    ...merchantRecords.map((record) => record.agentName),
    ...finalDayRecords.map((record) => record.agentName),
  ]);
  const merchantOnlyAgents = uniq(merchantRecords.map((record) => record.agentName)).sort((a, b) =>
    a.localeCompare(b)
  );

  const onboardingByAgent = merchantOnlyAgents
    .map((agentName) => ({
      label: agentName,
      count: merchantRecords.filter((record) => record.agentName === agentName).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  const onboardingByDateMap = new Map();
  merchantRecords.forEach((record) => {
    const key = record.submittedDateKey || 'unknown';
    const existing = onboardingByDateMap.get(key) || {
      dateKey: key,
      label: record.submittedDateLabel || 'Unknown date',
      count: 0,
    };
    existing.count += 1;
    onboardingByDateMap.set(key, existing);
  });

  const onboardingByDate = [...onboardingByDateMap.values()].sort((left, right) =>
    sortDateKey(left.dateKey, right.dateKey)
  );

  const onboardingRecords = [...merchantOnboarding.records].sort((left, right) => {
    const leftTime = left.submittedAt ? left.submittedAt.getTime() : 0;
    const rightTime = right.submittedAt ? right.submittedAt.getTime() : 0;
    return rightTime - leftTime || right.sourceRow - left.sourceRow;
  });
  const onboardingRecordColumns = buildOnboardingRecordColumns(
    merchantOnboarding.stats.detectedHeaders,
    merchantOnboarding.stats.resolvedHeaderMap
  );

  const dailyActivityTrendMap = new Map();
  finalDayRecords.forEach((record) => {
    const key = record.activityDateKey || 'unknown';
    const existing = dailyActivityTrendMap.get(key) || {
      dateKey: key,
      label: record.activityDateLabel || 'Unknown date',
      merchantsVisited: 0,
      blockedEnrollments: 0,
      enrolledMerchants: 0,
      peopleApproached: 0,
    };
    existing.merchantsVisited += record.merchantsVisited || 0;
    existing.blockedEnrollments += record.blockedEnrollments || 0;
    existing.enrolledMerchants += record.enrolledMerchants || 0;
    existing.peopleApproached += record.peopleApproached || 0;
    dailyActivityTrendMap.set(key, existing);
  });

  const dailyActivityTrend = [...dailyActivityTrendMap.values()].sort((left, right) =>
    left.dateKey.localeCompare(right.dateKey)
  );

  const agentLeaderboard = allAgents
    .map((agentName) => {
      const onboardingRows = merchantRecords.filter((record) => record.agentName === agentName);
      const dayReportRows = finalDayRecords.filter((record) => record.agentName === agentName);

      return {
        agentName,
        merchantOnboardings: onboardingRows.length,
        finalDayReports: dayReportRows.length,
        merchantsVisited: sumBy(dayReportRows, 'merchantsVisited'),
        blockedEnrollments: sumBy(dayReportRows, 'blockedEnrollments'),
        enrolledMerchants: sumBy(dayReportRows, 'enrolledMerchants'),
        peopleApproached: sumBy(dayReportRows, 'peopleApproached'),
      };
    })
    .sort((left, right) =>
      right.merchantOnboardings - left.merchantOnboardings ||
      right.merchantsVisited - left.merchantsVisited ||
      left.agentName.localeCompare(right.agentName)
    );

  const agentSummaryMap = new Map();
  merchantRecordsSorted.forEach((record) => {
    const existing = agentSummaryMap.get(record.agentName) || {
      agentName: record.agentName,
      totalOnboardedMerchants: 0,
      latestSubmissionAt: null,
      latestSubmissionDate: 'Unknown date',
      zones: new Set(),
      qrActivationInterestCount: 0,
      highReadinessCount: 0,
      storePhotoCount: 0,
    };

    existing.totalOnboardedMerchants += 1;
    existing.zones.add(record.zone);
    if (record.hasQrInterest) {
      existing.qrActivationInterestCount += 1;
    }
    if (record.isHighReadiness) {
      existing.highReadinessCount += 1;
    }
    if (record.hasStorePhoto) {
      existing.storePhotoCount += 1;
    }
    if (record.submittedAt && (!existing.latestSubmissionAt || record.submittedAt > existing.latestSubmissionAt)) {
      existing.latestSubmissionAt = record.submittedAt;
      existing.latestSubmissionDate = record.submittedAtLabel;
    }

    agentSummaryMap.set(record.agentName, existing);
  });

  const agentPerformanceSummary = [...agentSummaryMap.values()]
    .map((entry) => ({
      ...entry,
      zones: [...entry.zones].sort((left, right) => left.localeCompare(right)),
      zonesLabel: [...entry.zones].sort((left, right) => left.localeCompare(right)).join(', '),
      percentageShare: merchantOnboarding.stats.merchantRows
        ? (entry.totalOnboardedMerchants / merchantOnboarding.stats.merchantRows) * 100
        : 0,
    }))
    .sort((left, right) =>
      right.totalOnboardedMerchants - left.totalOnboardedMerchants ||
      left.agentName.localeCompare(right.agentName)
    )
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const finalDaySummary = {
    reportsSubmitted: finalDayRecords.length,
    merchantsVisited: sumBy(finalDayRecords, 'merchantsVisited'),
    blockedEnrollments: sumBy(finalDayRecords, 'blockedEnrollments'),
    enrolledMerchants: sumBy(finalDayRecords, 'enrolledMerchants'),
    peopleApproached: sumBy(finalDayRecords, 'peopleApproached'),
    blockedGpLeads: sumBy(finalDayRecords, 'blockedGpLeads'),
  };

  const qualityChecks = [
    {
      title: 'Merchant onboarding rows loaded',
      value: formatNumber(merchantOnboarding.stats.nonBlankRowCount),
      tone: merchantOnboarding.stats.nonBlankRowCount ? 'ok' : 'wn',
      detail:
        merchantOnboarding.stats.nonBlankRowCount > 0
          ? `${formatNumber(merchantOnboarding.stats.blankRowsRemoved)} blank row(s) were ignored during parsing.`
          : 'No onboarding data rows are available yet.',
    },
    {
      title: 'Merchant-only rows used in KPIs',
      value: formatNumber(merchantOnboarding.stats.merchantRows),
      tone: merchantOnboarding.stats.merchantRows ? 'ok' : 'wn',
      detail:
        merchantOnboarding.stats.nonMerchantRows > 0
          ? `${formatNumber(merchantOnboarding.stats.nonMerchantRows)} non-merchant row(s) were excluded from merchant metrics.`
          : 'All onboarding rows are merchant rows.',
    },
    {
      title: 'Final day report rows loaded',
      value: formatNumber(finalDayReport.stats.nonBlankRowCount),
      tone: finalDayReport.stats.nonBlankRowCount ? 'ok' : 'wn',
      detail:
        finalDayReport.stats.nonBlankRowCount > 0
          ? `${formatNumber(finalDayReport.stats.derivedEnrollmentRows)} row(s) used derived enrolled counts from visits minus blocked enrollments.`
          : 'The final day report sheet currently contains headers only.',
    },
    {
      title: 'Duplicate onboarding headers',
      value: formatNumber(merchantOnboarding.stats.duplicateHeaders.length),
      tone: merchantOnboarding.stats.duplicateHeaders.length ? 'wn' : 'ok',
      detail:
        merchantOnboarding.stats.duplicateHeaders.length > 0
          ? `Papa Parse renamed duplicate headers as ${merchantOnboarding.stats.duplicateHeaders.join(', ')}.`
          : 'No duplicate headers were detected.',
    },
    {
      title: 'Missing agent names',
      value: formatNumber(
        merchantOnboarding.stats.missingAgentName + finalDayReport.stats.missingAgentName
      ),
      tone:
        merchantOnboarding.stats.missingAgentName + finalDayReport.stats.missingAgentName
          ? 'wn'
          : 'ok',
      detail: 'Agent names are used in onboarding breakdowns and the leaderboard.',
    },
    {
      title: 'Parser or numeric issues',
      value: formatNumber(
        merchantOnboarding.stats.parseErrorCount +
          finalDayReport.stats.parseErrorCount +
          finalDayReport.stats.invalidNumericValues +
          finalDayReport.stats.invalidDateValues
      ),
      tone:
        merchantOnboarding.stats.parseErrorCount +
          finalDayReport.stats.parseErrorCount +
          finalDayReport.stats.invalidNumericValues +
          finalDayReport.stats.invalidDateValues
          ? 'wn'
          : 'ok',
      detail: 'This covers CSV parser warnings plus invalid dates or numeric values.',
    },
  ];

  return {
    summary: {
      totalOnboardedMerchants: merchantOnboarding.stats.merchantRows,
      onboardingAgents: uniq(merchantRecords.map((record) => record.agentName)).length,
      onboardingSubmissions: merchantOnboarding.stats.nonBlankRowCount,
      finalDayReports: finalDaySummary.reportsSubmitted,
      merchantsVisited: finalDayRecords.length ? finalDaySummary.merchantsVisited : null,
      peopleApproached: finalDayRecords.length ? finalDaySummary.peopleApproached : null,
    },
    debug: {
      onboardingSourceRows: merchantOnboarding.stats.rawRowCount,
      onboardingBlankRows: merchantOnboarding.stats.blankRowsRemoved,
      onboardingValidRows: merchantOnboarding.stats.nonBlankRowCount,
      onboardingIgnoredRows:
        merchantOnboarding.stats.rawRowCount - merchantOnboarding.stats.nonBlankRowCount,
      validMerchantRows: merchantOnboarding.stats.merchantRows,
      uniqueMerchantAgentCount: merchantOnlyAgents.length,
      unassignedAgentRows: merchantOnboarding.stats.unassignedAgentRows,
      merchantRowsMissingTimestamp: merchantOnboarding.stats.missingTimestampRows,
      ignoredNonMerchantRows: merchantOnboarding.stats.nonMerchantRows,
      onboardingDetectedHeaders: merchantOnboarding.stats.detectedHeaders,
      onboardingMappedHeaders: merchantOnboarding.stats.mappedHeaders,
      onboardingUnmappedHeaders: merchantOnboarding.stats.unmappedHeaders,
      onboardingResolvedHeaderMap: merchantOnboarding.stats.resolvedHeaderMap,
      onboardingHeaderMatches: merchantOnboarding.stats.headerMatches,
      finalDaySourceRows: finalDayReport.stats.rawRowCount,
      finalDayBlankRows: finalDayReport.stats.blankRowsRemoved,
    },
    merchantOnboardingRecords: merchantRecordsSorted,
    agentPerformanceSummary,
    agentPerformanceFilterOptions: {
      agents: merchantOnlyAgents,
      zones: uniq(merchantRecords.map((record) => record.zone)).sort((a, b) => a.localeCompare(b)),
      qrInterest: uniq(merchantRecords.map((record) => record.wantsQr)).sort((a, b) =>
        a.localeCompare(b)
      ),
      readinessLevels: uniq(merchantRecords.map((record) => record.readiness)).sort((a, b) =>
        a.localeCompare(b)
      ),
      minDate:
        merchantRecords
          .filter((record) => record.submittedDateKey !== 'unknown')
          .map((record) => record.submittedDateKey)
          .sort(sortDateKey)[0] || '',
      maxDate:
        merchantRecords
          .filter((record) => record.submittedDateKey !== 'unknown')
          .map((record) => record.submittedDateKey)
          .sort(sortDateKey)
          .at(-1) || '',
    },
    onboardingRecords,
    onboardingRecordColumns,
    onboardingFilterOptions: {
      agents: uniq(onboardingRecords.map((record) => record.agentName)).sort((a, b) =>
        a.localeCompare(b)
      ),
      onboardingTypes: uniq(onboardingRecords.map((record) => record.onboardingType)).sort((a, b) =>
        a.localeCompare(b)
      ),
      zones: uniq(onboardingRecords.map((record) => record.zone)).sort((a, b) =>
        a.localeCompare(b)
      ),
    },
    onboardingByAgent,
    onboardingByDate,
    finalDaySummary,
    agentLeaderboard,
    dailyActivityTrend,
    qualityChecks,
    sourceStatus: [
      createSourceStatus(sourceResults.merchantOnboarding, merchantOnboarding, 'Merchant onboarding'),
      createSourceStatus(sourceResults.finalDayReport, finalDayReport, 'Final day report'),
    ],
    emptyStates: {
      merchant:
        merchantOnboarding.stats.merchantRows === 0
          ? 'No merchant onboarding rows found yet. The sheet may currently contain only Growth Partner rows or empty submissions.'
          : '',
      finalDay:
        finalDaySummary.reportsSubmitted === 0
          ? 'The final day report sheet currently has no submitted performance rows.'
          : '',
    },
  };
}
