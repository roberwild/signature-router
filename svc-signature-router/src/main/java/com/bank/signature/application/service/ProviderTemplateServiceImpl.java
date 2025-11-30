package com.bank.signature.application.service;

import com.bank.signature.application.dto.response.ProviderTemplateResponse;
import com.bank.signature.domain.model.ProviderType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;

/**
 * Provider Template Service Implementation
 * Story 13.7: Provider Templates & Presets
 * Epic 13: Providers CRUD Management
 */
@Service
@Slf4j
public class ProviderTemplateServiceImpl implements ProviderTemplateService {
    
    private final Map<String, ProviderTemplateResponse> templates = new HashMap<>();
    
    @PostConstruct
    public void init() {
        log.info("Initializing Provider Templates");
        loadTemplates();
        log.info("Loaded {} provider templates", templates.size());
    }
    
    @Override
    public List<ProviderTemplateResponse> getAllTemplates() {
        return new ArrayList<>(templates.values());
    }
    
    @Override
    public List<ProviderTemplateResponse> getTemplatesByType(ProviderType type) {
        return templates.values().stream()
            .filter(template -> template.getProviderType() == type)
            .toList();
    }
    
    @Override
    public Optional<ProviderTemplateResponse> getTemplate(String templateName) {
        return Optional.ofNullable(templates.get(templateName));
    }
    
    private void loadTemplates() {
        // Twilio SMS
        templates.put("twilio-sms", ProviderTemplateResponse.builder()
            .providerType(ProviderType.SMS)
            .templateName("twilio-sms")
            .description("Twilio SMS API (Production-ready)")
            .defaultConfig(Map.of(
                "api_url", "https://api.twilio.com/2010-04-01",
                "message_service_sid", ""
            ))
            .requiredCredentials(List.of("account_sid", "auth_token", "from_number"))
            .recommendedTimeoutSeconds(5)
            .recommendedRetryMaxAttempts(3)
            .recommendedPriority(10)
            .build());
        
        // Firebase Cloud Messaging
        templates.put("fcm-push", ProviderTemplateResponse.builder()
            .providerType(ProviderType.PUSH)
            .templateName("fcm-push")
            .description("Firebase Cloud Messaging (Android/iOS Push)")
            .defaultConfig(Map.of(
                "api_url", "https://fcm.googleapis.com/fcm/send",
                "priority", "high"
            ))
            .requiredCredentials(List.of("server_key", "sender_id"))
            .recommendedTimeoutSeconds(3)
            .recommendedRetryMaxAttempts(2)
            .recommendedPriority(20)
            .build());
        
        // Twilio Voice
        templates.put("twilio-voice", ProviderTemplateResponse.builder()
            .providerType(ProviderType.VOICE)
            .templateName("twilio-voice")
            .description("Twilio Programmable Voice (TTS)")
            .defaultConfig(Map.of(
                "api_url", "https://api.twilio.com/2010-04-01",
                "tts_language", "es-ES",
                "tts_voice", "Polly.Mia",
                "max_call_duration", 60
            ))
            .requiredCredentials(List.of("account_sid", "auth_token", "from_number"))
            .recommendedTimeoutSeconds(10)
            .recommendedRetryMaxAttempts(2)
            .recommendedPriority(30)
            .build());
        
        // AWS SNS SMS
        templates.put("aws-sns-sms", ProviderTemplateResponse.builder()
            .providerType(ProviderType.SMS)
            .templateName("aws-sns-sms")
            .description("AWS SNS SMS (Alternative to Twilio)")
            .defaultConfig(Map.of(
                "region", "us-east-1",
                "message_type", "Transactional"
            ))
            .requiredCredentials(List.of("access_key_id", "secret_access_key"))
            .recommendedTimeoutSeconds(5)
            .recommendedRetryMaxAttempts(3)
            .recommendedPriority(15)
            .build());
        
        // OneSignal Push
        templates.put("onesignal-push", ProviderTemplateResponse.builder()
            .providerType(ProviderType.PUSH)
            .templateName("onesignal-push")
            .description("OneSignal Push Notifications")
            .defaultConfig(Map.of(
                "api_url", "https://onesignal.com/api/v1",
                "ios_badgeType", "Increase",
                "ios_badgeCount", 1
            ))
            .requiredCredentials(List.of("app_id", "rest_api_key"))
            .recommendedTimeoutSeconds(3)
            .recommendedRetryMaxAttempts(2)
            .recommendedPriority(25)
            .build());
        
        // Biometric Stub
        templates.put("biometric-stub", ProviderTemplateResponse.builder()
            .providerType(ProviderType.BIOMETRIC)
            .templateName("biometric-stub")
            .description("Biometric Authentication (TouchID/FaceID/Windows Hello)")
            .defaultConfig(Map.of(
                "timeout_seconds", 30,
                "allow_fallback", true
            ))
            .requiredCredentials(List.of("api_key"))
            .recommendedTimeoutSeconds(3)
            .recommendedRetryMaxAttempts(0)
            .recommendedPriority(5)
            .build());
    }
}

