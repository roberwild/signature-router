package com.singularbank.signature.routing.infrastructure.adapter.outbound.provider.biometric;

import com.singularbank.signature.routing.infrastructure.config.provider.ProviderConfigProperties;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

/**
 * Configuration for Biometric Provider.
 * Story 3.5: Biometric Provider (Stub/Future-Ready)
 * Story 3.6: Provider Configuration Management (extends ProviderConfigProperties)
 * 
 * Configuration properties for biometric authentication provider.
 * Currently used for stub implementation, designed for future SDK integration.
 * 
 * Properties (application.yml):
 * <pre>
 * providers:
 *   biometric:
 *     enabled: false  # Disabled by default (stub implementation)
 *     timeout-seconds: 3  # Biometric prompt timeout
 * </pre>
 * 
 * Future Integration Properties:
 * When integrating real biometric SDK (Story future):
 * - sdk-type: TouchID | FaceID | WindowsHello | AndroidBiometric
 * - api-key: SDK API key (if cloud-based like Veriff, Onfido)
 * - api-url: SDK endpoint URL
 * - liveness-detection: Enable liveness detection (anti-spoofing)
 * - fallback-enabled: Allow fallback to PIN/password
 * 
 * Biometric SDK Options:
 * - **iOS**: LocalAuthentication framework (Touch ID / Face ID)
 * - **Android**: BiometricPrompt API
 * - **Windows**: Windows Hello
 * - **Web**: WebAuthn API
 * - **Backend**: Veriff, Onfido, Jumio (identity verification services)
 * 
 * Security Considerations:
 * - Biometric data = sensitive personal data (GDPR Article 9)
 * - Never store raw biometric data (only hashes/templates)
 * - Implement liveness detection (prevent photo/video spoofing)
 * - Use secure enclave/TEE for biometric processing
 * - Provide fallback authentication method
 * 
 * @since Story 3.5, refactored in Story 3.6
 */
@Configuration
@ConfigurationProperties(prefix = "providers.biometric")
@Validated
@Getter
@Setter
public class BiometricProviderConfig extends ProviderConfigProperties {
    // All common properties inherited from ProviderConfigProperties:
    // - enabled (default: false)
    // - timeoutSeconds (default: 3)
    // - retryMaxAttempts (default: 0 for biometric - no retries)
    
    // Future biometric-specific properties will be added here when integrating real SDK
}

