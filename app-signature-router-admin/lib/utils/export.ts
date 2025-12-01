/**
 * Export Utilities
 * Functions for exporting data to CSV and other formats
 */

import { SignatureRequest } from '../api/types';
import { format, parseISO } from 'date-fns';

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[], headers: string[]): string {
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma or quote
      if (value === null || value === undefined) return '';
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
        ? `"${escaped}"`
        : escaped;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Trigger browser download of a file
 */
function downloadFile(content: string, filename: string, type: string = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export signature requests to CSV
 */
export function exportSignatureRequestsToCSV(signatures: SignatureRequest[]): void {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `signature_requests_${timestamp}.csv`;

  // Flatten signature data for CSV export
  const flattenedData = signatures.map(sig => {
    const primaryChallenge = sig.challenges[0];
    const hasFallback = sig.challenges.length > 1;
    const fallbackChannel = hasFallback ? sig.challenges[1]?.channelType : 'N/A';

    // Calculate duration
    let duration = 'N/A';
    if (sig.signedAt) {
      const start = parseISO(sig.createdAt).getTime();
      const end = parseISO(sig.signedAt).getTime();
      const seconds = Math.floor((end - start) / 1000);
      duration = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    }

    // Count routing events
    const routingEventCount = sig.routingTimeline.length;
    const hasFailures = sig.routingTimeline.some(e => e.eventType.includes('FAILED'));

    return {
      id: sig.id,
      customerId: sig.customerId,
      status: sig.status,
      amount: sig.transactionContext.amount,
      currency: sig.transactionContext.currency,
      transactionType: sig.transactionContext.transactionType,
      primaryChannel: primaryChallenge?.channelType || 'N/A',
      primaryProvider: primaryChallenge?.provider || 'N/A',
      hasFallback: hasFallback ? 'Yes' : 'No',
      fallbackChannel,
      duration,
      createdAt: format(parseISO(sig.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      signedAt: sig.signedAt ? format(parseISO(sig.signedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      expiresAt: format(parseISO(sig.expiresAt), 'yyyy-MM-dd HH:mm:ss'),
      abortedAt: sig.abortedAt ? format(parseISO(sig.abortedAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
      abortReason: sig.abortReason || 'N/A',
      challengeCount: sig.challenges.length,
      routingEventCount,
      hasFailures: hasFailures ? 'Yes' : 'No',
    };
  });

  const headers = [
    'id',
    'customerId',
    'status',
    'amount',
    'currency',
    'transactionType',
    'primaryChannel',
    'primaryProvider',
    'hasFallback',
    'fallbackChannel',
    'duration',
    'createdAt',
    'signedAt',
    'expiresAt',
    'abortedAt',
    'abortReason',
    'challengeCount',
    'routingEventCount',
    'hasFailures',
  ];

  const csv = arrayToCSV(flattenedData, headers);
  downloadFile(csv, filename);
}

/**
 * Export signature requests with full routing timeline to CSV
 * Creates a separate file with routing events
 */
export function exportSignatureRequestsWithTimeline(signatures: SignatureRequest[]): void {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');

  // Export main signatures
  exportSignatureRequestsToCSV(signatures);

  // Export routing timeline separately
  const timelineData = signatures.flatMap(sig =>
    sig.routingTimeline.map(event => ({
      signatureId: sig.id,
      customerId: sig.customerId,
      timestamp: format(parseISO(event.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS'),
      eventType: event.eventType,
      fromChannel: event.fromChannel || 'N/A',
      toChannel: event.toChannel || 'N/A',
      reason: event.reason,
    }))
  );

  const timelineHeaders = [
    'signatureId',
    'customerId',
    'timestamp',
    'eventType',
    'fromChannel',
    'toChannel',
    'reason',
  ];

  const timelineCSV = arrayToCSV(timelineData, timelineHeaders);
  downloadFile(timelineCSV, `routing_timeline_${timestamp}.csv`);
}

/**
 * Export challenges to CSV
 */
export function exportChallenges(signatures: SignatureRequest[]): void {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `challenges_${timestamp}.csv`;

  const challengeData = signatures.flatMap(sig =>
    sig.challenges.map(challenge => {
      let responseTime = 'N/A';
      if (challenge.completedAt && challenge.sentAt) {
        const sent = parseISO(challenge.sentAt).getTime();
        const completed = parseISO(challenge.completedAt).getTime();
        const seconds = Math.floor((completed - sent) / 1000);
        responseTime = `${seconds}s`;
      }

      return {
        challengeId: challenge.id,
        signatureId: sig.id,
        customerId: sig.customerId,
        channelType: challenge.channelType,
        provider: challenge.provider,
        status: challenge.status,
        sentAt: challenge.sentAt ? format(parseISO(challenge.sentAt), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
        completedAt: challenge.completedAt
          ? format(parseISO(challenge.completedAt), 'yyyy-MM-dd HH:mm:ss')
          : 'N/A',
        responseTime,
        expiresAt: format(parseISO(challenge.expiresAt), 'yyyy-MM-dd HH:mm:ss'),
        errorCode: challenge.errorCode || 'N/A',
        externalReference: challenge.providerProof?.externalReference || 'N/A',
        providerResponse: challenge.providerProof?.responseMessage || 'N/A',
      };
    })
  );

  const headers = [
    'challengeId',
    'signatureId',
    'customerId',
    'channelType',
    'provider',
    'status',
    'sentAt',
    'completedAt',
    'responseTime',
    'expiresAt',
    'errorCode',
    'externalReference',
    'providerResponse',
  ];

  const csv = arrayToCSV(challengeData, headers);
  downloadFile(csv, filename);
}
