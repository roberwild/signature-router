package com.singularbank.signature.routing.infrastructure.adapter.outbound.provider.push;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for Push Notification Provider.
 * Story 2.6: Push Notification Provider (Stub Implementation)
 * 
 * In this stub implementation, only the enabled flag is used.
 * Future properties (Story 3.3 - FCM Integration):
 * - fcm.server-key: Firebase Cloud Messaging server key
 * - fcm.sender-id: Firebase sender ID
 * - fcm.project-id: Firebase project ID
 */
@Configuration
@ConfigurationProperties(prefix = "providers.push")
public class PushProviderConfig {
    
    private boolean enabled = true;  // Feature flag
    private String apiUrl = "https://fcm.googleapis.com/fcm/send";  // Future use
    private int timeoutSeconds = 3;
    
    // Getters and setters
    
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public String getApiUrl() {
        return apiUrl;
    }
    
    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }
    
    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }
    
    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }
}

