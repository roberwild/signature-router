package com.bank.signature.domain.model;

/**
 * Provider Type Enum
 * Story 13.2: Provider Domain Model
 * Epic 13: Providers CRUD Management
 * 
 * Represents the type of signature provider/channel.
 * 
 * Types:
 * - SMS: Text message via Twilio or similar
 * - PUSH: Push notification via FCM or similar
 * - VOICE: Voice call via Twilio Voice or similar
 * - BIOMETRIC: Biometric authentication (TouchID, FaceID, etc.)
 */
public enum ProviderType {
    /**
     * SMS provider (e.g., Twilio SMS)
     * - Typical latency: 1-3 seconds
     * - Reach: Very high (all phones)
     * - Cost: Low ($0.01-0.05 per message)
     */
    SMS,
    
    /**
     * Push notification provider (e.g., Firebase Cloud Messaging)
     * - Typical latency: 0.5-2 seconds
     * - Reach: Medium (requires app installed)
     * - Cost: Free
     */
    PUSH,
    
    /**
     * Voice call provider (e.g., Twilio Voice)
     * - Typical latency: 3-6 seconds
     * - Reach: Very high (all phones)
     * - Cost: High ($0.01-0.05 per minute)
     */
    VOICE,
    
    /**
     * Biometric authentication provider
     * - Typical latency: 1-2 seconds
     * - Reach: Medium (requires biometric hardware)
     * - Cost: Free
     */
    BIOMETRIC
}

