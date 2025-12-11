package com.singularbank.signature.routing.infrastructure.adapter.outbound.provider.twilio;

import com.singularbank.signature.routing.infrastructure.config.provider.ProviderConfigProperties;
import jakarta.annotation.PostConstruct;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

/**
 * Configuration for Twilio SMS Provider.
 * Story 2.5: SMS Provider Integration (Twilio)
 * Story 3.6: Provider Configuration Management (extends ProviderConfigProperties)
 * 
 * Credentials are loaded from Vault via Spring Cloud Vault.
 * See application.yml for Vault path configuration.
 * 
 * Configuration Properties:
 * - enabled: Feature flag (inherited from ProviderConfigProperties)
 * - timeoutSeconds: API timeout (inherited, default: 5s for Twilio)
 * - retryMaxAttempts: Retry count (inherited, default: 3 for SMS)
 * - accountSid: Twilio Account SID (from Vault)
 * - authToken: Twilio Auth Token (from Vault)
 * - fromNumber: Twilio phone number in E.164 format
 * - apiUrl: Twilio API base URL
 * 
 * @since Story 2.5, refactored in Story 3.6
 */
@Configuration
@ConfigurationProperties(prefix = "providers.twilio")
@Validated
@Getter
@Setter
public class TwilioConfig extends ProviderConfigProperties {
    
    @NotBlank(message = "Twilio Account SID is required")
    private String accountSid;
    
    @NotBlank(message = "Twilio Auth Token is required")
    private String authToken;
    
    @NotBlank(message = "Twilio from-number is required")
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "from-number must be in E.164 format (e.g., +573001234567)")
    private String fromNumber;
    
    private String apiUrl = "https://api.twilio.com/2010-04-01";
    
    /**
     * Validates configuration on bean initialization.
     * 
     * Note: With @Validated + Bean Validation annotations,
     * this method is now redundant (validation happens automatically).
     * Kept for backward compatibility and additional custom validation if needed.
     */
    @PostConstruct
    public void validate() {
        // Bean Validation (@NotBlank, @Pattern) already validates fields
        // Custom validation logic can be added here if needed
    }
}

