package com.singularbank.signature.routing.domain.model.valueobject;

/**
 * Channel statistics value object.
 * Moved from SignatureRequestRepository to comply with ArchUnit rule:
 * "All classes in domain.port must be interfaces"
 * 
 * @param totalCount Total challenges for the channel
 * @param successCount Successfully validated challenges
 */
public record ChannelStats(long totalCount, long successCount) {}

