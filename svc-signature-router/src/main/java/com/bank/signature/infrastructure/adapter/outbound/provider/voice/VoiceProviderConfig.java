package com.bank.signature.infrastructure.adapter.outbound.provider.voice;

import com.bank.signature.infrastructure.config.provider.ProviderConfigProperties;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

/**
 * Configuration for Voice Call Provider.
 * Story 3.4: Voice Call Provider - Twilio Voice API Integration
 * Story 3.6: Provider Configuration Management (extends ProviderConfigProperties)
 * 
 * Configuration properties for Twilio Programmable Voice integration
 * with Text-to-Speech (TTS) support.
 * 
 * Properties (application.yml):
 * <pre>
 * providers:
 *   voice:
 *     enabled: false  # Disabled by default (expensive)
 *     api-url: https://api.twilio.com/2010-04-01
 *     timeout-seconds: 5
 *     tts-language: es-ES  # Spanish
 *     tts-voice: Polly.Mia  # Amazon Polly voice (español latinoamericano)
 *     max-call-duration: 60  # Max call duration in seconds
 * </pre>
 * 
 * Available TTS Voices:
 * - Polly.Mia: Español latinoamericano (mujer)
 * - Polly.Lupe: Español latinoamericano (mujer)
 * - Polly.Miguel: Español latinoamericano (hombre)
 * 
 * Cost Consideration:
 * Voice calls are ~10x more expensive than SMS (~$0.013/min in Latam).
 * Disabled by default, enable only for high-value transactions.
 * 
 * @since Story 3.4, refactored in Story 3.6
 */
@Configuration
@ConfigurationProperties(prefix = "providers.voice")
@Validated
@Getter
@Setter
public class VoiceProviderConfig extends ProviderConfigProperties {
    
    /**
     * Twilio API base URL.
     * Default: https://api.twilio.com/2010-04-01
     */
    private String apiUrl = "https://api.twilio.com/2010-04-01";
    
    /**
     * Text-to-Speech language.
     * Default: es-ES (Spanish)
     * Options: es-ES, es-MX, en-US, en-GB, etc.
     */
    private String ttsLanguage = "es-ES";
    
    /**
     * Text-to-Speech voice (Amazon Polly).
     * Default: Polly.Mia (español latinoamericano, mujer)
     * Options: Polly.Mia, Polly.Lupe (mujer), Polly.Miguel (hombre)
     */
    private String ttsVoice = "Polly.Mia";
    
    /**
     * Maximum call duration in seconds.
     * Default: 60 seconds
     * Prevents excessive costs from long calls.
     */
    private int maxCallDuration = 60;
}

