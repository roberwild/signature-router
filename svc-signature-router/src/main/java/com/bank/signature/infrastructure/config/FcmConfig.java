package com.bank.signature.infrastructure.config;

import com.bank.signature.infrastructure.config.provider.ProviderConfigProperties;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.validation.annotation.Validated;

import java.io.IOException;
import java.io.InputStream;

/**
 * Firebase Cloud Messaging (FCM) Configuration.
 * Story 3.3: Push Notification Provider (FCM Integration)
 * Story 3.6: Provider Configuration Management (extends ProviderConfigProperties)
 * 
 * Configures Firebase Admin SDK for push notification delivery via FCM.
 * 
 * Configuration Properties (application.yml):
 * <pre>
 * fcm:
 *   enabled: true
 *   service-account-path: classpath:firebase-service-account.json
 *   project-id: my-firebase-project
 * </pre>
 * 
 * Service Account Setup:
 * 1. Go to Firebase Console → Project Settings → Service Accounts
 * 2. Click "Generate new private key"
 * 3. Save JSON file as firebase-service-account.json
 * 4. Place in src/main/resources/ or external path
 * 5. IMPORTANT: Add to .gitignore (DO NOT commit credentials)
 * 
 * Lazy Initialization:
 * - FirebaseApp only initialized if fcm.enabled=true
 * - Allows disabling FCM in test/dev environments
 * 
 * @since Story 3.3, refactored in Story 3.6
 */
@Configuration
@ConfigurationProperties(prefix = "fcm")
@ConditionalOnProperty(prefix = "fcm", name = "enabled", havingValue = "true")
@Validated
@Getter
@Setter
@Slf4j
public class FcmConfig extends ProviderConfigProperties {
    
    /**
     * Path to Firebase service account JSON file.
     * Supports:
     * - classpath: resources (e.g., classpath:firebase-service-account.json)
     * - file: absolute paths (e.g., file:/etc/secrets/firebase-service-account.json)
     * - URL: remote URLs (not recommended for security reasons)
     */
    @NotBlank(message = "FCM service account path is required")
    private String serviceAccountPath;
    
    /**
     * Firebase project ID.
     * Optional - can be read from service account JSON.
     */
    private String projectId;
    
    /**
     * Initializes FirebaseApp with service account credentials.
     * 
     * This bean is created only if fcm.enabled=true.
     * 
     * Initialization steps:
     * 1. Load service account JSON from configured path
     * 2. Build GoogleCredentials from JSON
     * 3. Configure FirebaseOptions with credentials and project ID
     * 4. Initialize FirebaseApp (singleton)
     * 
     * @param resourceLoader Spring ResourceLoader to load service account file
     * @return Initialized FirebaseApp instance
     * @throws IOException if service account file cannot be read
     * @throws IllegalStateException if FirebaseApp is already initialized
     */
    @Bean
    public FirebaseApp firebaseApp(ResourceLoader resourceLoader) throws IOException {
        log.info("Initializing Firebase Admin SDK...");
        log.info("FCM enabled: {}", super.isEnabled());
        log.info("Service account path: {}", serviceAccountPath);
        log.info("Project ID: {}", projectId != null ? projectId : "(auto-detect from service account)");
        
        if (serviceAccountPath == null || serviceAccountPath.isBlank()) {
            throw new IllegalStateException(
                "FCM service account path is not configured. " +
                "Set fcm.service-account-path in application.yml"
            );
        }
        
        try {
            // Load service account JSON
            Resource resource = resourceLoader.getResource(serviceAccountPath);
            
            if (!resource.exists()) {
                throw new IllegalStateException(
                    "FCM service account file not found: " + serviceAccountPath +
                    "\nEnsure the file exists and the path is correct."
                );
            }
            
            // Build credentials from service account JSON
            GoogleCredentials credentials;
            try (InputStream serviceAccount = resource.getInputStream()) {
                credentials = GoogleCredentials.fromStream(serviceAccount);
            }
            
            // Build Firebase options
            FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                .setCredentials(credentials);
            
            // Set project ID if provided (otherwise auto-detected from service account)
            if (projectId != null && !projectId.isBlank()) {
                optionsBuilder.setProjectId(projectId);
            }
            
            FirebaseOptions options = optionsBuilder.build();
            
            // Initialize FirebaseApp (singleton)
            FirebaseApp app;
            if (FirebaseApp.getApps().isEmpty()) {
                app = FirebaseApp.initializeApp(options);
                log.info("✅ Firebase Admin SDK initialized successfully");
                log.info("   Project ID: {}", app.getOptions().getProjectId());
            } else {
                app = FirebaseApp.getInstance();
                log.info("✅ Firebase Admin SDK already initialized (reusing existing instance)");
            }
            
            return app;
            
        } catch (IOException e) {
            log.error("❌ Failed to initialize Firebase Admin SDK: {}", e.getMessage());
            throw new IOException("Failed to load FCM service account: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error initializing Firebase Admin SDK", e);
            throw new IllegalStateException("Failed to initialize Firebase Admin SDK", e);
        }
    }
    
    /**
     * Creates FirebaseMessaging bean for sending messages.
     * 
     * This bean depends on FirebaseApp being initialized first.
     * 
     * @param firebaseApp Initialized FirebaseApp instance
     * @return FirebaseMessaging instance for sending push notifications
     */
    @Bean
    public FirebaseMessaging firebaseMessaging(FirebaseApp firebaseApp) {
        FirebaseMessaging messaging = FirebaseMessaging.getInstance(firebaseApp);
        log.info("✅ FirebaseMessaging bean created successfully");
        return messaging;
    }
}

