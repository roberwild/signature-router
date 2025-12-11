package com.singularbank.signature.routing.infrastructure.adapter.outbound.provider.push;

import com.singularbank.signature.routing.domain.model.entity.SignatureChallenge;
import com.singularbank.signature.routing.domain.model.valueobject.*;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for PushNotificationProvider (FCM Integration).
 * Story 3.3: Push Notification Provider (FCM Integration)
 */
@ExtendWith(MockitoExtension.class)
class PushNotificationProviderTest {
    
    @Mock
    private FirebaseMessaging firebaseMessaging;
    
    private MeterRegistry meterRegistry;
    private PushNotificationProvider provider;
    
    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        
        // Create ScheduledExecutorService for async (Story 3.8)
        java.util.concurrent.ScheduledExecutorService executorService = 
            java.util.concurrent.Executors.newScheduledThreadPool(2);
        
        provider = new PushNotificationProvider(firebaseMessaging, meterRegistry, executorService);
    }
    
    // ==================== sendChallenge() Tests ====================
    
    @Test
    @DisplayName("Should successfully send push notification via FCM")
    void shouldSuccessfullySendPushNotification() throws Exception {
        // Given
        SignatureChallenge challenge = createSampleChallenge();
        String deviceToken = "fGw0qy4TQfmX_valid_token_123_9Hj2KpLm";
        String mockMessageId = "projects/my-project/messages/msg123456789";
        
        when(firebaseMessaging.send(any(Message.class))).thenReturn(mockMessageId);
        
        // When
        ProviderResult result = provider.sendChallenge(challenge, deviceToken);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.success()).isTrue();
        assertThat(result.providerChallengeId()).isEqualTo(mockMessageId);
        assertThat(result.providerProof()).contains("messageId");
        assertThat(result.providerProof()).contains(mockMessageId);
        assertThat(result.providerProof()).contains("FCM");
        assertThat(result.errorCode()).isNull();
        assertThat(result.errorMessage()).isNull();
        
        verify(firebaseMessaging).send(any(Message.class));
    }
    
    @Test
    @DisplayName("Should handle FCM invalid argument error (invalid device token)")
    void shouldHandleFcmInvalidArgumentError() throws Exception {
        // Given
        SignatureChallenge challenge = createSampleChallenge();
        String deviceToken = "invalid_token";
        FirebaseMessagingException fcmException = mock(FirebaseMessagingException.class);
        when(fcmException.getMessagingErrorCode()).thenReturn(MessagingErrorCode.INVALID_ARGUMENT);
        when(fcmException.getMessage()).thenReturn("Invalid device token format");
        
        when(firebaseMessaging.send(any(Message.class))).thenThrow(fcmException);
        
        // When
        ProviderResult result = provider.sendChallenge(challenge, deviceToken);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("FCM_ERROR_INVALID_ARGUMENT");
        assertThat(result.errorMessage()).contains("Invalid device token format");
        assertThat(result.providerChallengeId()).isNull();
        assertThat(result.providerProof()).isNull();
        
        // Verify metrics
        double errorCount = meterRegistry.counter("provider.push.errors", 
            "error_code", "FCM_ERROR_INVALID_ARGUMENT").count();
        assertThat(errorCount).isEqualTo(1.0);
    }
    
    @Test
    @DisplayName("Should handle FCM not found error (device token not registered)")
    void shouldHandleFcmNotFoundError() throws Exception {
        // Given
        SignatureChallenge challenge = createSampleChallenge();
        String deviceToken = "unregistered_token_123";
        FirebaseMessagingException fcmException = mock(FirebaseMessagingException.class);
        when(fcmException.getMessagingErrorCode()).thenReturn(MessagingErrorCode.UNREGISTERED);
        when(fcmException.getMessage()).thenReturn("Device token not registered");
        
        when(firebaseMessaging.send(any(Message.class))).thenThrow(fcmException);
        
        // When
        ProviderResult result = provider.sendChallenge(challenge, deviceToken);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("FCM_ERROR_UNREGISTERED");
        assertThat(result.errorMessage()).contains("Device token not registered");
    }
    
    @Test
    @DisplayName("Should handle FCM unavailable error (service temporarily down)")
    void shouldHandleFcmUnavailableError() throws Exception {
        // Given
        SignatureChallenge challenge = createSampleChallenge();
        String deviceToken = "valid_token_123";
        FirebaseMessagingException fcmException = mock(FirebaseMessagingException.class);
        when(fcmException.getMessagingErrorCode()).thenReturn(MessagingErrorCode.UNAVAILABLE);
        when(fcmException.getMessage()).thenReturn("FCM service temporarily unavailable");
        
        when(firebaseMessaging.send(any(Message.class))).thenThrow(fcmException);
        
        // When
        ProviderResult result = provider.sendChallenge(challenge, deviceToken);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("FCM_ERROR_UNAVAILABLE");
        assertThat(result.errorMessage()).contains("FCM service temporarily unavailable");
    }
    
    @Test
    @DisplayName("Should handle unexpected exception")
    void shouldHandleUnexpectedException() throws Exception {
        // Given
        SignatureChallenge challenge = createSampleChallenge();
        String deviceToken = "valid_token_123";
        
        when(firebaseMessaging.send(any(Message.class)))
            .thenThrow(new RuntimeException("Unexpected error"));
        
        // When
        ProviderResult result = provider.sendChallenge(challenge, deviceToken);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.success()).isFalse();
        assertThat(result.errorCode()).isEqualTo("PROVIDER_ERROR");
        assertThat(result.errorMessage()).contains("Unexpected error");
        
        // Verify metrics
        double errorCount = meterRegistry.counter("provider.push.errors", 
            "error_code", "PROVIDER_ERROR").count();
        assertThat(errorCount).isEqualTo(1.0);
    }
    
    @Test
    @DisplayName("Should throw exception when challenge is null")
    void shouldThrowExceptionWhenChallengeIsNull() {
        // When / Then
        assertThatThrownBy(() -> provider.sendChallenge(null, "token"))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("challenge cannot be null");
    }
    
    @Test
    @DisplayName("Should throw exception when device token is null")
    void shouldThrowExceptionWhenDeviceTokenIsNull() {
        // Given
        SignatureChallenge challenge = createSampleChallenge();
        
        // When / Then
        assertThatThrownBy(() -> provider.sendChallenge(challenge, null))
            .isInstanceOf(NullPointerException.class)
            .hasMessageContaining("deviceToken cannot be null");
    }
    
    @Test
    @DisplayName("Should throw exception when device token is blank")
    void shouldThrowExceptionWhenDeviceTokenIsBlank() {
        // Given
        SignatureChallenge challenge = createSampleChallenge();
        
        // When / Then
        assertThatThrownBy(() -> provider.sendChallenge(challenge, "   "))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("deviceToken cannot be blank");
    }
    
    @Test
    @DisplayName("Should record success metrics")
    void shouldRecordSuccessMetrics() throws Exception {
        // Given
        SignatureChallenge challenge = createSampleChallenge();
        String deviceToken = "valid_token_123";
        when(firebaseMessaging.send(any(Message.class))).thenReturn("msg_id_123");
        
        // When
        provider.sendChallenge(challenge, deviceToken);
        
        // Then
        double callCount = meterRegistry.counter("provider.push.calls", 
            "status", "success").count();
        assertThat(callCount).isEqualTo(1.0);
        
        assertThat(meterRegistry.timer("provider.push.latency", 
            "status", "success").count()).isEqualTo(1);
    }
    
    // ==================== checkHealth() Tests ====================
    
    @Test
    @DisplayName("Should return healthy status when FCM is configured")
    void shouldReturnHealthyStatusWhenFcmIsConfigured() {
        // When
        HealthStatus health = provider.checkHealth(ProviderType.PUSH);
        
        // Then
        assertThat(health).isNotNull();
        assertThat(health.status()).isEqualTo(HealthStatus.Status.UP);
        assertThat(health.details()).contains("FCM Push provider operational");
        assertThat(health.isHealthy()).isTrue();
    }
    
    @Test
    @DisplayName("Should throw exception when provider type is not PUSH")
    void shouldThrowExceptionWhenProviderTypeIsNotPush() {
        // When / Then
        assertThatThrownBy(() -> provider.checkHealth(ProviderType.SMS))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Expected PUSH provider type");
    }
    
    @Test
    @DisplayName("Should cache health check results")
    void shouldCacheHealthCheckResults() {
        // When
        HealthStatus health1 = provider.checkHealth(ProviderType.PUSH);
        HealthStatus health2 = provider.checkHealth(ProviderType.PUSH);
        
        // Then
        assertThat(health1).isSameAs(health2); // Same object reference = cached
    }
    
    @Test
    @DisplayName("Should return unhealthy when FirebaseMessaging is null")
    void shouldReturnUnhealthyWhenFirebaseMessagingIsNull() {
        // Given
        java.util.concurrent.ScheduledExecutorService executor = 
            java.util.concurrent.Executors.newScheduledThreadPool(1);
        PushNotificationProvider providerWithNullFcm = 
            new PushNotificationProvider(null, meterRegistry, executor);
        
        // When
        HealthStatus health = providerWithNullFcm.checkHealth(ProviderType.PUSH);
        
        // Then
        assertThat(health).isNotNull();
        assertThat(health.status()).isEqualTo(HealthStatus.Status.DOWN);
        assertThat(health.details()).contains("FCM not initialized");
        assertThat(health.isHealthy()).isFalse();
    }
    
    // ==================== Helper Methods ====================
    
    private SignatureChallenge createSampleChallenge() {
        return SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(ChannelType.PUSH)
            .provider(ProviderType.PUSH)
            .status(ChallengeStatus.PENDING)
            .challengeCode("654321")
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(300))
            .build();
    }
}
