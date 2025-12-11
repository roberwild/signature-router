package com.singularbank.signature.routing.application.usecase;

import com.singularbank.signature.routing.application.dto.CreateSignatureRequestDto;
import com.singularbank.signature.routing.application.dto.MoneyDto;
import com.singularbank.signature.routing.application.dto.TransactionContextDto;
import com.singularbank.signature.routing.application.mapper.SignatureMapper;
import com.singularbank.signature.routing.domain.model.aggregate.SignatureRequest;
import com.singularbank.signature.routing.domain.model.entity.SignatureChallenge;
import com.singularbank.signature.routing.domain.model.valueobject.*;
import com.singularbank.signature.routing.domain.port.outbound.SignatureRequestRepository;
import com.singularbank.signature.routing.domain.service.ChallengeService;
import com.singularbank.signature.routing.domain.port.outbound.PseudonymizationService;
import com.singularbank.signature.routing.domain.service.RoutingService;
import com.singularbank.signature.routing.domain.service.TransactionHashService;
import com.singularbank.signature.routing.infrastructure.ratelimit.CustomerRateLimitService;
import com.singularbank.signature.routing.infrastructure.resilience.DegradedModeManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for StartSignatureUseCaseImpl.
 * 
 * Story 10.3: Use Case Tests - Testing Coverage >85%
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>Happy path (crear signature → evaluar routing → guardar → crear challenge)</li>
 *   <li>Pseudonymization de customer ID</li>
 *   <li>Cálculo de hash de transaction context</li>
 *   <li>Evaluación de routing rules</li>
 *   <li>Creación de challenge</li>
 *   <li>Degraded mode handling</li>
 *   <li>Rate limiting</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("StartSignatureUseCaseImpl Tests")
class StartSignatureUseCaseImplTest {

    @Mock
    private SignatureRequestRepository repository;
    @Mock
    private SignatureMapper mapper;
    @Mock
    private PseudonymizationService pseudonymizationService;
    @Mock
    private TransactionHashService transactionHashService;
    @Mock
    private RoutingService routingService;
    @Mock
    private ChallengeService challengeService;
    @Mock
    private DegradedModeManager degradedModeManager;
    @Mock
    private CustomerRateLimitService customerRateLimitService;
    @Mock
    private com.singularbank.signature.routing.infrastructure.observability.metrics.SignatureRequestMetrics signatureRequestMetrics;
    
    private io.micrometer.observation.ObservationRegistry observationRegistry;
    private StartSignatureUseCaseImpl useCase;

    private CreateSignatureRequestDto requestDto;
    private TransactionContext transactionContext;
    private RoutingService.RoutingDecision routingDecision;
    private SignatureRequest signatureRequest;

    @BeforeEach
    void setUp() {
        // Create real ObservationRegistry instead of mock to avoid NullPointerException
        observationRegistry = io.micrometer.observation.ObservationRegistry.create();
        
        // Create use case instance manually with real ObservationRegistry
        useCase = new StartSignatureUseCaseImpl(
            repository,
            mapper,
            pseudonymizationService,
            transactionHashService,
            routingService,
            challengeService,
            degradedModeManager,
            customerRateLimitService,
            signatureRequestMetrics,
            observationRegistry
        );
        
        // Create test DTO
        MoneyDto amountDto = new MoneyDto(new BigDecimal("100.00"), "EUR");
        TransactionContextDto transactionContextDto = new TransactionContextDto(
            amountDto,
            "merchant-123",
            "order-456",
            "Test transaction"
        );
        requestDto = new CreateSignatureRequestDto(
            "customer-123",
            "+1234567890",
            transactionContextDto
        );

        // Create test domain objects
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "a".repeat(64); // Valid SHA256 hash
        transactionContext = new TransactionContext(
            amount,
            "merchant-123",
            "order-456",
            "Test transaction",
            hash
        );

        // Create routing decision
        List<RoutingEvent> routingTimeline = new ArrayList<>();
        routingTimeline.add(new RoutingEvent(
            Instant.now(),
            "RULE_EVALUATED",
            null,
            ChannelType.SMS,
            "Rule matched: amount > 50"
        ));
        routingDecision = new RoutingService.RoutingDecision(
            ChannelType.SMS,
            routingTimeline,
            false
        );

        // Create signature request
        UUID requestId = UUID.randomUUID();
        signatureRequest = SignatureRequest.builder()
            .id(requestId)
            .customerId("pseudonymized-customer-123")
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>(routingTimeline))
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(180))
            .build();
    }

    @Test
    @DisplayName("Should create signature request successfully")
    void shouldCreateSignatureRequestSuccessfully() {
        // Given
        when(pseudonymizationService.pseudonymize("customer-123")).thenReturn("pseudonymized-customer-123");
        when(mapper.toDomain(requestDto)).thenReturn(transactionContext);
        when(transactionHashService.calculateHash(transactionContext)).thenReturn("a".repeat(64));
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(routingService.evaluate(any(TransactionContext.class))).thenReturn(routingDecision);
        when(repository.save(any(SignatureRequest.class))).thenReturn(signatureRequest);
        when(challengeService.createChallenge(any(), eq(ChannelType.SMS), eq("+1234567890")))
            .thenReturn(signatureRequest.getChallenges().isEmpty() ? null : signatureRequest.getChallenges().get(0));

        // When
        SignatureRequest result = useCase.execute(requestDto);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(signatureRequest.getId());
        assertThat(result.getStatus()).isEqualTo(SignatureStatus.PENDING);
        assertThat(result.getCustomerId()).isEqualTo("pseudonymized-customer-123");
        
        // Verify interactions (using atLeastOnce() due to metrics/observation calls)
        verify(customerRateLimitService, atLeastOnce()).checkRateLimit("customer-123");
        verify(pseudonymizationService, atLeastOnce()).pseudonymize("customer-123");
        verify(mapper, atLeastOnce()).toDomain(requestDto);
        verify(transactionHashService, atLeastOnce()).calculateHash(transactionContext);
        verify(routingService, atLeastOnce()).evaluate(any(TransactionContext.class));
        verify(challengeService, atLeastOnce()).createChallenge(any(SignatureRequest.class), eq(ChannelType.SMS), eq("+1234567890"));
        verify(repository, atLeastOnce()).save(any(SignatureRequest.class));
    }

    @Test
    @DisplayName("Should pseudonymize customer ID")
    void shouldPseudonymizeCustomerId() {
        // Given
        String pseudonymizedId = "pseudonymized-customer-123";
        when(pseudonymizationService.pseudonymize("customer-123")).thenReturn(pseudonymizedId);
        when(mapper.toDomain(requestDto)).thenReturn(transactionContext);
        when(transactionHashService.calculateHash(transactionContext)).thenReturn("a".repeat(64));
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(routingService.evaluate(any(TransactionContext.class))).thenReturn(routingDecision);
        when(repository.save(any(SignatureRequest.class))).thenAnswer(invocation -> {
            SignatureRequest request = invocation.getArgument(0);
            assertThat(request.getCustomerId()).isEqualTo(pseudonymizedId);
            return signatureRequest;
        });
        when(challengeService.createChallenge(any(), any(), any())).thenReturn(null);

        // When
        useCase.execute(requestDto);

        // Then
        verify(pseudonymizationService, atLeastOnce()).pseudonymize("customer-123");
    }

    @Test
    @DisplayName("Should calculate transaction context hash")
    void shouldCalculateTransactionContextHash() {
        // Given
        String expectedHash = "b".repeat(64);
        when(pseudonymizationService.pseudonymize(anyString())).thenReturn("pseudonymized-id");
        when(mapper.toDomain(requestDto)).thenReturn(transactionContext);
        when(transactionHashService.calculateHash(transactionContext)).thenReturn(expectedHash);
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(routingService.evaluate(any(TransactionContext.class))).thenReturn(routingDecision);
        when(repository.save(any(SignatureRequest.class))).thenAnswer(invocation -> {
            SignatureRequest request = invocation.getArgument(0);
            assertThat(request.getTransactionContext().hash()).isEqualTo(expectedHash);
            return signatureRequest;
        });
        when(challengeService.createChallenge(any(), any(), any())).thenReturn(null);

        // When
        useCase.execute(requestDto);

        // Then
        verify(transactionHashService).calculateHash(transactionContext);
    }

    @Test
    @DisplayName("Should evaluate routing rules")
    void shouldEvaluateRoutingRules() {
        // Given
        when(pseudonymizationService.pseudonymize(anyString())).thenReturn("pseudonymized-id");
        when(mapper.toDomain(requestDto)).thenReturn(transactionContext);
        when(transactionHashService.calculateHash(transactionContext)).thenReturn("a".repeat(64));
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(routingService.evaluate(any(TransactionContext.class))).thenReturn(routingDecision);
        when(repository.save(any(SignatureRequest.class))).thenReturn(signatureRequest);
        when(challengeService.createChallenge(any(), any(), any())).thenReturn(null);

        // When
        useCase.execute(requestDto);

        // Then
        verify(routingService).evaluate(any(TransactionContext.class));
    }

    @Test
    @DisplayName("Should create challenge for selected channel")
    void shouldCreateChallengeForSelectedChannel() {
        // Given
        SignatureChallenge challenge = SignatureChallenge.builder()
            .id(UUID.randomUUID())
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.PENDING)
            .challengeCode("123456")
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(180))
            .build();
        
        when(pseudonymizationService.pseudonymize(anyString())).thenReturn("pseudonymized-id");
        when(mapper.toDomain(requestDto)).thenReturn(transactionContext);
        when(transactionHashService.calculateHash(transactionContext)).thenReturn("a".repeat(64));
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(routingService.evaluate(any(TransactionContext.class))).thenReturn(routingDecision);
        when(repository.save(any(SignatureRequest.class))).thenReturn(signatureRequest);
        when(challengeService.createChallenge(any(SignatureRequest.class), eq(ChannelType.SMS), eq("+1234567890")))
            .thenReturn(challenge);

        // When
        useCase.execute(requestDto);

        // Then
        verify(challengeService).createChallenge(any(SignatureRequest.class), eq(ChannelType.SMS), eq("+1234567890"));
    }

    @Test
    @DisplayName("Should persist signature request")
    void shouldPersistSignatureRequest() {
        // Given
        when(pseudonymizationService.pseudonymize(anyString())).thenReturn("pseudonymized-id");
        when(mapper.toDomain(requestDto)).thenReturn(transactionContext);
        when(transactionHashService.calculateHash(transactionContext)).thenReturn("a".repeat(64));
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(routingService.evaluate(any(TransactionContext.class))).thenReturn(routingDecision);
        when(repository.save(any(SignatureRequest.class))).thenReturn(signatureRequest);
        when(challengeService.createChallenge(any(), any(), any())).thenReturn(null);

        // When
        SignatureRequest result = useCase.execute(requestDto);

        // Then
        verify(repository).save(any(SignatureRequest.class));
        assertThat(result).isEqualTo(signatureRequest);
    }

    @Test
    @DisplayName("Should set PENDING_DEGRADED status when in degraded mode")
    void shouldSetPendingDegradedStatusWhenInDegradedMode() {
        // Given
        when(pseudonymizationService.pseudonymize(anyString())).thenReturn("pseudonymized-id");
        when(mapper.toDomain(requestDto)).thenReturn(transactionContext);
        when(transactionHashService.calculateHash(transactionContext)).thenReturn("a".repeat(64));
        when(degradedModeManager.isInDegradedMode()).thenReturn(true);
        when(routingService.evaluate(any(TransactionContext.class))).thenReturn(routingDecision);
        when(repository.save(any(SignatureRequest.class))).thenAnswer(invocation -> {
            SignatureRequest request = invocation.getArgument(0);
            assertThat(request.getStatus()).isEqualTo(SignatureStatus.PENDING_DEGRADED);
            return request;
        });
        when(challengeService.createChallenge(any(), any(), any())).thenReturn(null);

        // When
        SignatureRequest result = useCase.execute(requestDto);

        // Then
        assertThat(result.getStatus()).isEqualTo(SignatureStatus.PENDING_DEGRADED);
        verify(degradedModeManager, atLeastOnce()).isInDegradedMode();
    }

    @Test
    @DisplayName("Should check customer rate limit")
    void shouldCheckCustomerRateLimit() {
        // Given
        when(pseudonymizationService.pseudonymize(anyString())).thenReturn("pseudonymized-id");
        when(mapper.toDomain(requestDto)).thenReturn(transactionContext);
        when(transactionHashService.calculateHash(transactionContext)).thenReturn("a".repeat(64));
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(routingService.evaluate(any(TransactionContext.class))).thenReturn(routingDecision);
        when(repository.save(any(SignatureRequest.class))).thenReturn(signatureRequest);
        when(challengeService.createChallenge(any(), any(), any())).thenReturn(null);

        // When
        useCase.execute(requestDto);

        // Then
        verify(customerRateLimitService).checkRateLimit("customer-123");
    }

    @Test
    @DisplayName("Should use routing timeline from routing decision")
    void shouldUseRoutingTimelineFromRoutingDecision() {
        // Given
        List<RoutingEvent> customTimeline = new ArrayList<>();
        customTimeline.add(new RoutingEvent(
            Instant.now(),
            "CUSTOM_EVENT",
            null,
            ChannelType.VOICE,
            "Custom routing event"
        ));
        RoutingService.RoutingDecision customDecision = new RoutingService.RoutingDecision(
            ChannelType.VOICE,
            customTimeline,
            true
        );
        
        when(pseudonymizationService.pseudonymize(anyString())).thenReturn("pseudonymized-id");
        when(mapper.toDomain(requestDto)).thenReturn(transactionContext);
        when(transactionHashService.calculateHash(transactionContext)).thenReturn("a".repeat(64));
        when(degradedModeManager.isInDegradedMode()).thenReturn(false);
        when(routingService.evaluate(any(TransactionContext.class))).thenReturn(customDecision);
        when(repository.save(any(SignatureRequest.class))).thenAnswer(invocation -> {
            SignatureRequest request = invocation.getArgument(0);
            assertThat(request.getRoutingTimeline()).hasSize(1);
            assertThat(request.getRoutingTimeline().get(0).eventType()).isEqualTo("CUSTOM_EVENT");
            return request;
        });
        when(challengeService.createChallenge(any(), eq(ChannelType.VOICE), any())).thenReturn(null);

        // When
        useCase.execute(requestDto);

        // Then
        verify(routingService).evaluate(any(TransactionContext.class));
    }
}

