package com.bank.signature.infrastructure.adapter.inbound.rest;

import com.bank.signature.application.dto.CompleteSignatureDto;
import com.bank.signature.application.dto.CreateSignatureRequestDto;
import com.bank.signature.application.dto.SignatureCompletionResponseDto;
import com.bank.signature.application.dto.SignatureRequestDetailDto;
import com.bank.signature.application.dto.SignatureResponseDto;
import com.bank.signature.application.mapper.SignatureMapper;
import com.bank.signature.application.usecase.CompleteSignatureUseCase;
import com.bank.signature.application.usecase.QuerySignatureUseCase;
import com.bank.signature.application.usecase.StartSignatureUseCase;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.SignatureStatus;
import com.bank.signature.infrastructure.resilience.DegradedModeManager;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for SignatureController.
 * Tests REST endpoints for signature request operations.
 *
 * Coverage:
 * - POST /api/v1/signatures (create signature request)
 * - GET /api/v1/signatures/{id} (query signature request)
 * - PATCH /api/v1/signatures/{id}/complete (complete signature)
 * - Degraded mode handling
 * - Error scenarios
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SignatureController Tests")
class SignatureControllerTest {

    @Mock
    private StartSignatureUseCase startSignatureUseCase;

    @Mock
    private QuerySignatureUseCase querySignatureUseCase;

    @Mock
    private CompleteSignatureUseCase completeSignatureUseCase;

    @Mock
    private SignatureMapper mapper;

    @Mock
    private DegradedModeManager degradedModeManager;

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private Counter counter;

    @InjectMocks
    private SignatureController controller;

    private UUID testRequestId;
    private CreateSignatureRequestDto createRequest;
    private SignatureRequest signatureRequest;
    private SignatureResponseDto responseDto;

    @BeforeEach
    void setUp() {
        testRequestId = UUID.randomUUID();

        // Setup mock request DTO
        createRequest = new CreateSignatureRequestDto(
            "customer-123",
            new BigDecimal("1000.00"),
            "USD",
            "Payment for invoice #12345",
            "WEB",
            "+1234567890"
        );

        // Setup mock signature request (domain model)
        signatureRequest = mock(SignatureRequest.class);
        when(signatureRequest.getId()).thenReturn(testRequestId);
        when(signatureRequest.getStatus()).thenReturn(SignatureStatus.PENDING);

        // Setup mock response DTO
        responseDto = new SignatureResponseDto(
            testRequestId,
            SignatureStatus.PENDING,
            Instant.now().plusSeconds(180),
            "Challenge sent successfully"
        );

        // Mock counter for metrics
        when(meterRegistry.counter(anyString(), any(String.class), any(String.class)))
            .thenReturn(counter);
    }

    @Test
    @DisplayName("Should create signature request successfully in normal mode")
    void shouldCreateSignatureRequest_NormalMode() {
        // Given
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(startSignatureUseCase.execute(createRequest)).thenReturn(signatureRequest);
        when(mapper.toDto(signatureRequest)).thenReturn(responseDto);

        // When
        ResponseEntity<SignatureResponseDto> response = controller.createSignatureRequest(
            createRequest,
            "idempotency-key-123"
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(testRequestId);
        assertThat(response.getBody().status()).isEqualTo(SignatureStatus.PENDING);
        assertThat(response.getHeaders().getLocation()).isNotNull();
        assertThat(response.getHeaders().getLocation().toString())
            .isEqualTo("/api/v1/signatures/" + testRequestId);

        verify(degradedModeManager).isInDegradedMode();
        verify(startSignatureUseCase).execute(createRequest);
        verify(mapper).toDto(signatureRequest);
        verify(counter).increment();
    }

    @Test
    @DisplayName("Should create signature request in degraded mode with HTTP 202")
    void shouldCreateSignatureRequest_DegradedMode() {
        // Given
        when(degradedModeManager.isInDegradedMode()).thenReturn(true);
        when(degradedModeManager.getDegradedReason()).thenReturn("Database connection pool exhausted");
        when(startSignatureUseCase.execute(createRequest)).thenReturn(signatureRequest);
        when(mapper.toDto(signatureRequest)).thenReturn(responseDto);

        // When
        ResponseEntity<SignatureResponseDto> response = controller.createSignatureRequest(
            createRequest,
            null  // no idempotency key
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getHeaders().get("X-System-Mode")).containsExactly("DEGRADED");
        assertThat(response.getHeaders().get("Warning")).isNotNull();
        assertThat(response.getHeaders().get("Warning").get(0))
            .contains("degraded mode");
        assertThat(response.getHeaders().getLocation()).isNotNull();

        verify(degradedModeManager).isInDegradedMode();
        verify(degradedModeManager).getDegradedReason();
        verify(startSignatureUseCase).execute(createRequest);
        verify(mapper).toDto(signatureRequest);
        verify(counter).increment();
    }

    @Test
    @DisplayName("Should query signature request by ID")
    void shouldQuerySignatureRequest() {
        // Given
        SignatureRequestDetailDto detailDto = new SignatureRequestDetailDto(
            testRequestId,
            SignatureStatus.PENDING,
            "customer...",  // tokenized
            BigDecimal.valueOf(1000),
            "USD",
            "Payment for invoice #12345",
            ChannelType.SMS,
            Instant.now(),
            Instant.now().plusSeconds(180),
            null,
            null
        );
        when(querySignatureUseCase.getSignatureRequest(testRequestId)).thenReturn(detailDto);

        // When
        ResponseEntity<SignatureRequestDetailDto> response = controller.getSignatureRequest(testRequestId);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(testRequestId);
        assertThat(response.getBody().status()).isEqualTo(SignatureStatus.PENDING);

        verify(querySignatureUseCase).getSignatureRequest(testRequestId);
    }

    @Test
    @DisplayName("Should complete signature request successfully")
    void shouldCompleteSignatureRequest() {
        // Given
        UUID challengeId = UUID.randomUUID();
        CompleteSignatureDto completeDto = new CompleteSignatureDto(
            challengeId,
            "123456"  // OTP code
        );

        SignatureCompletionResponseDto completionResponse = new SignatureCompletionResponseDto(
            testRequestId,
            SignatureStatus.SIGNED,
            Instant.now(),
            "Signature completed successfully"
        );

        when(completeSignatureUseCase.execute(testRequestId, completeDto))
            .thenReturn(completionResponse);

        // When
        ResponseEntity<SignatureCompletionResponseDto> response =
            controller.completeSignature(testRequestId, completeDto);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(testRequestId);
        assertThat(response.getBody().status()).isEqualTo(SignatureStatus.SIGNED);

        verify(completeSignatureUseCase).execute(testRequestId, completeDto);
    }

    @Test
    @DisplayName("Should handle create request without idempotency key")
    void shouldCreateSignatureRequest_WithoutIdempotencyKey() {
        // Given
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(startSignatureUseCase.execute(createRequest)).thenReturn(signatureRequest);
        when(mapper.toDto(signatureRequest)).thenReturn(responseDto);

        // When
        ResponseEntity<SignatureResponseDto> response = controller.createSignatureRequest(
            createRequest,
            null  // no idempotency key
        );

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();

        verify(startSignatureUseCase).execute(createRequest);
    }

    @Test
    @DisplayName("Should increment normal mode metric counter")
    void shouldIncrementNormalModeMetric() {
        // Given
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(startSignatureUseCase.execute(any())).thenReturn(signatureRequest);
        when(mapper.toDto(any())).thenReturn(responseDto);

        // When
        controller.createSignatureRequest(createRequest, null);

        // Then
        verify(meterRegistry).counter("system.degraded.requests.total", "mode", "normal");
        verify(counter).increment();
    }

    @Test
    @DisplayName("Should increment degraded mode metric counter")
    void shouldIncrementDegradedModeMetric() {
        // Given
        when(degradedModeManager.isInDegradedMode()).thenReturn(true);
        when(degradedModeManager.getDegradedReason()).thenReturn("Test reason");
        when(startSignatureUseCase.execute(any())).thenReturn(signatureRequest);
        when(mapper.toDto(any())).thenReturn(responseDto);

        // When
        controller.createSignatureRequest(createRequest, null);

        // Then
        verify(meterRegistry).counter("system.degraded.requests.total", "mode", "degraded");
        verify(counter).increment();
    }

    @Test
    @DisplayName("Should include location header in response")
    void shouldIncludeLocationHeader() {
        // Given
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(startSignatureUseCase.execute(any())).thenReturn(signatureRequest);
        when(mapper.toDto(any())).thenReturn(responseDto);

        // When
        ResponseEntity<SignatureResponseDto> response =
            controller.createSignatureRequest(createRequest, null);

        // Then
        assertThat(response.getHeaders().getLocation()).isNotNull();
        String expectedLocation = "/api/v1/signatures/" + testRequestId;
        assertThat(response.getHeaders().getLocation().toString()).isEqualTo(expectedLocation);
    }
}
