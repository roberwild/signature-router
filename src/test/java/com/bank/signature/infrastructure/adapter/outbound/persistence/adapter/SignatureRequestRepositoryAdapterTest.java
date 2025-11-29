package com.bank.signature.infrastructure.adapter.outbound.persistence.adapter;

import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.*;
import com.bank.signature.domain.port.outbound.SignatureRequestRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.DisabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for SignatureRequestRepositoryAdapter using Testcontainers PostgreSQL.
 * 
 * Story 10.4: Integration Tests con Testcontainers - Testing Coverage >70%
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>Save → findById (round-trip completo)</li>
 *   <li>JSONB serialization (TransactionContext almacenado y recuperado correctamente)</li>
 *   <li>Queries personalizados (findByCustomerId, findExpired, findByStatus)</li>
 *   <li>UUIDv7 generación y ordenamiento temporal</li>
 *   <li>Relaciones con challenges (one-to-many)</li>
 * </ul>
 */
/**
 * Integration tests for SignatureRequestRepositoryAdapter using Testcontainers PostgreSQL.
 * 
 * <p><b>Note:</b> These tests require Docker to be running. If Docker is not available,
 * the tests will be skipped automatically by Testcontainers.</p>
 */
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@DisplayName("SignatureRequestRepositoryAdapter Integration Tests")
class SignatureRequestRepositoryAdapterTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("signature_test")
        .withUsername("test")
        .withPassword("test")
        .withReuse(true); // Reuse container across tests for faster execution

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private SignatureRequestRepository repository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private TransactionContext transactionContext;
    private String customerId;

    @BeforeEach
    void setUp() {
        // Create test transaction context
        Money amount = new Money(new BigDecimal("100.00"), "EUR");
        String hash = "a".repeat(64); // Valid SHA256 hash
        transactionContext = new TransactionContext(
            amount,
            "merchant-123",
            "order-456",
            "Test transaction",
            hash
        );
        customerId = "pseudonymized-customer-123";
    }

    @AfterEach
    void cleanup() {
        // Truncate tables for test isolation
        jdbcTemplate.execute("TRUNCATE TABLE signature_challenge CASCADE");
        jdbcTemplate.execute("TRUNCATE TABLE signature_request CASCADE");
    }

    @Test
    @DisplayName("Should save and retrieve signature request (round-trip)")
    void shouldSaveAndRetrieveSignatureRequest() {
        // Given
        UUID requestId = UUIDGenerator.generateV7();
        Instant now = Instant.now();
        SignatureRequest request = SignatureRequest.builder()
            .id(requestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(now.plusSeconds(180))
            .build();

        // When
        SignatureRequest saved = repository.save(request);
        Optional<SignatureRequest> found = repository.findById(requestId);

        // Then
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isEqualTo(requestId);
        assertThat(found).isPresent();
        
        SignatureRequest retrieved = found.get();
        assertThat(retrieved.getId()).isEqualTo(requestId);
        assertThat(retrieved.getCustomerId()).isEqualTo(customerId);
        assertThat(retrieved.getStatus()).isEqualTo(SignatureStatus.PENDING);
        assertThat(retrieved.getTransactionContext()).isNotNull();
        assertThat(retrieved.getTransactionContext().amount().amount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(retrieved.getTransactionContext().merchantId()).isEqualTo("merchant-123");
    }

    @Test
    @DisplayName("Should serialize and deserialize TransactionContext correctly (JSONB)")
    void shouldSerializeAndDeserializeTransactionContext() {
        // Given
        UUID requestId = UUIDGenerator.generateV7();
        TransactionContext complexContext = new TransactionContext(
            new Money(new BigDecimal("999.99"), "USD"),
            "merchant-complex",
            "order-complex-123",
            "Complex transaction with special chars: áéíóú & < > \" '",
            "b".repeat(64)
        );
        
        SignatureRequest request = SignatureRequest.builder()
            .id(requestId)
            .customerId(customerId)
            .transactionContext(complexContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(180))
            .build();

        // When
        repository.save(request);
        Optional<SignatureRequest> found = repository.findById(requestId);

        // Then
        assertThat(found).isPresent();
        TransactionContext retrieved = found.get().getTransactionContext();
        assertThat(retrieved.amount().amount()).isEqualByComparingTo(new BigDecimal("999.99"));
        assertThat(retrieved.amount().currency()).isEqualTo("USD");
        assertThat(retrieved.merchantId()).isEqualTo("merchant-complex");
        assertThat(retrieved.orderId()).isEqualTo("order-complex-123");
        assertThat(retrieved.description()).isEqualTo("Complex transaction with special chars: áéíóú & < > \" '");
        assertThat(retrieved.hash()).isEqualTo("b".repeat(64));
    }

    @Test
    @DisplayName("Should find signature requests by customer ID")
    void shouldFindSignatureRequestsByCustomerId() {
        // Given
        String customer1 = "customer-1";
        String customer2 = "customer-2";
        
        UUID request1Id = UUIDGenerator.generateV7();
        UUID request2Id = UUIDGenerator.generateV7();
        UUID request3Id = UUIDGenerator.generateV7();
        
        Instant now = Instant.now();
        
        SignatureRequest request1 = SignatureRequest.builder()
            .id(request1Id)
            .customerId(customer1)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(now.plusSeconds(180))
            .build();
        
        SignatureRequest request2 = SignatureRequest.builder()
            .id(request2Id)
            .customerId(customer1) // Same customer
            .transactionContext(transactionContext)
            .status(SignatureStatus.SIGNED)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now.plusSeconds(10))
            .expiresAt(now.plusSeconds(190))
            .build();
        
        SignatureRequest request3 = SignatureRequest.builder()
            .id(request3Id)
            .customerId(customer2) // Different customer
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now.plusSeconds(20))
            .expiresAt(now.plusSeconds(200))
            .build();
        
        repository.save(request1);
        repository.save(request2);
        repository.save(request3);

        // When
        List<SignatureRequest> customer1Requests = repository.findByCustomerId(customer1);
        List<SignatureRequest> customer2Requests = repository.findByCustomerId(customer2);

        // Then
        assertThat(customer1Requests).hasSize(2);
        assertThat(customer1Requests).extracting(SignatureRequest::getId)
            .containsExactlyInAnyOrder(request1Id, request2Id);
        
        assertThat(customer2Requests).hasSize(1);
        assertThat(customer2Requests.get(0).getId()).isEqualTo(request3Id);
    }

    @Test
    @DisplayName("Should find expired signature requests")
    void shouldFindExpiredSignatureRequests() {
        // Given
        Instant now = Instant.now();
        UUID expiredId = UUIDGenerator.generateV7();
        UUID notExpiredId = UUIDGenerator.generateV7();
        
        SignatureRequest expired = SignatureRequest.builder()
            .id(expiredId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now.minusSeconds(300))
            .expiresAt(now.minusSeconds(60)) // Expired
            .build();
        
        SignatureRequest notExpired = SignatureRequest.builder()
            .id(notExpiredId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now.minusSeconds(60))
            .expiresAt(now.plusSeconds(120)) // Not expired
            .build();
        
        repository.save(expired);
        repository.save(notExpired);

        // When
        List<SignatureRequest> expiredRequests = repository.findExpired(now);

        // Then
        assertThat(expiredRequests).hasSize(1);
        assertThat(expiredRequests.get(0).getId()).isEqualTo(expiredId);
    }

    @Test
    @DisplayName("Should persist and retrieve challenges (one-to-many relationship)")
    void shouldPersistAndRetrieveChallenges() {
        // Given
        UUID requestId = UUIDGenerator.generateV7();
        UUID challenge1Id = UUIDGenerator.generateV7();
        UUID challenge2Id = UUIDGenerator.generateV7();
        
        Instant now = Instant.now();
        
        SignatureChallenge challenge1 = SignatureChallenge.builder()
            .id(challenge1Id)
            .channelType(ChannelType.SMS)
            .provider(ProviderType.SMS)
            .status(ChallengeStatus.SENT)
            .challengeCode("123456")
            .createdAt(now)
            .expiresAt(now.plusSeconds(180))
            .build();
        
        SignatureChallenge challenge2 = SignatureChallenge.builder()
            .id(challenge2Id)
            .channelType(ChannelType.PUSH)
            .provider(ProviderType.PUSH)
            .status(ChallengeStatus.COMPLETED)
            .challengeCode("654321")
            .createdAt(now.plusSeconds(10))
            .expiresAt(now.plusSeconds(190))
            .build();
        
        SignatureRequest request = SignatureRequest.builder()
            .id(requestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>(List.of(challenge1, challenge2)))
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(now.plusSeconds(180))
            .build();

        // When
        repository.save(request);
        Optional<SignatureRequest> found = repository.findById(requestId);

        // Then
        assertThat(found).isPresent();
        SignatureRequest retrieved = found.get();
        assertThat(retrieved.getChallenges()).hasSize(2);
        assertThat(retrieved.getChallenges()).extracting(SignatureChallenge::getId)
            .containsExactlyInAnyOrder(challenge1Id, challenge2Id);
        
        SignatureChallenge retrievedChallenge1 = retrieved.getChallenges().stream()
            .filter(c -> c.getId().equals(challenge1Id))
            .findFirst()
            .orElseThrow();
        
        assertThat(retrievedChallenge1.getChannelType()).isEqualTo(ChannelType.SMS);
        assertThat(retrievedChallenge1.getStatus()).isEqualTo(ChallengeStatus.SENT);
        assertThat(retrievedChallenge1.getChallengeCode()).isEqualTo("123456");
    }

    @Test
    @DisplayName("Should find signature requests by status with pagination")
    void shouldFindSignatureRequestsByStatusWithPagination() {
        // Given
        Instant now = Instant.now();
        
        // Create multiple PENDING_DEGRADED requests
        List<UUID> degradedIds = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            UUID id = UUIDGenerator.generateV7();
            degradedIds.add(id);
            SignatureRequest request = SignatureRequest.builder()
                .id(id)
                .customerId(customerId)
                .transactionContext(transactionContext)
                .status(SignatureStatus.PENDING_DEGRADED)
                .challenges(new ArrayList<>())
                .routingTimeline(new ArrayList<>())
                .createdAt(now.plusSeconds(i))
                .expiresAt(now.plusSeconds(180 + i))
                .build();
            repository.save(request);
        }
        
        // Create one PENDING request
        UUID pendingId = UUIDGenerator.generateV7();
        SignatureRequest pending = SignatureRequest.builder()
            .id(pendingId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(now.plusSeconds(180))
            .build();
        repository.save(pending);

        // When
        PageRequest pageRequest = PageRequest.of(0, 3, Sort.by("createdAt").ascending());
        List<SignatureRequest> degradedRequests = repository.findByStatus(SignatureStatus.PENDING_DEGRADED, pageRequest);

        // Then
        assertThat(degradedRequests).hasSize(3); // Page size = 3
        assertThat(degradedRequests).extracting(SignatureRequest::getStatus)
            .containsOnly(SignatureStatus.PENDING_DEGRADED);
        
        // Verify ordering (createdAt ASC)
        List<Instant> createdAts = degradedRequests.stream()
            .map(SignatureRequest::getCreatedAt)
            .toList();
        assertThat(createdAts).isSorted();
    }

    @Test
    @DisplayName("Should handle UUIDv7 generation and temporal ordering")
    void shouldHandleUuidV7GenerationAndTemporalOrdering() {
        // Given
        List<UUID> ids = new ArrayList<>();
        Instant baseTime = Instant.now();
        
        // Create multiple requests with small time gaps
        for (int i = 0; i < 5; i++) {
            UUID id = UUIDGenerator.generateV7();
            ids.add(id);
            
            SignatureRequest request = SignatureRequest.builder()
                .id(id)
                .customerId(customerId)
                .transactionContext(transactionContext)
                .status(SignatureStatus.PENDING)
                .challenges(new ArrayList<>())
                .routingTimeline(new ArrayList<>())
                .createdAt(baseTime.plusSeconds(i))
                .expiresAt(baseTime.plusSeconds(180 + i))
                .build();
            repository.save(request);
            
            // Small delay to ensure UUIDv7 timestamps differ
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // When - Retrieve all and verify UUIDv7 properties
        List<SignatureRequest> allRequests = repository.findByCustomerId(customerId);

        // Then
        assertThat(allRequests).hasSize(5);
        
        // Verify all IDs are UUIDv7 (version = 7)
        allRequests.forEach(request -> {
            assertThat(request.getId().version()).isEqualTo(7);
        });
        
        // Verify temporal ordering (UUIDv7 should be sortable by time)
        List<UUID> sortedIds = allRequests.stream()
            .map(SignatureRequest::getId)
            .sorted()
            .toList();
        
        // UUIDv7 should maintain temporal order when sorted
        assertThat(sortedIds).isEqualTo(allRequests.stream()
            .map(SignatureRequest::getId)
            .toList());
    }

    @Test
    @DisplayName("Should serialize and deserialize routing timeline correctly")
    void shouldSerializeAndDeserializeRoutingTimeline() {
        // Given
        UUID requestId = UUIDGenerator.generateV7();
        Instant now = Instant.now();
        
        List<RoutingEvent> timeline = new ArrayList<>();
        timeline.add(new RoutingEvent(
            now,
            "RULE_EVALUATED",
            null,
            ChannelType.SMS,
            "Rule matched: amount > 50"
        ));
        timeline.add(new RoutingEvent(
            now.plusSeconds(1),
            "CHANNEL_SELECTED",
            null,
            ChannelType.SMS,
            "SMS channel selected"
        ));
        
        SignatureRequest request = SignatureRequest.builder()
            .id(requestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(timeline)
            .createdAt(now)
            .expiresAt(now.plusSeconds(180))
            .build();

        // When
        repository.save(request);
        Optional<SignatureRequest> found = repository.findById(requestId);

        // Then
        assertThat(found).isPresent();
        List<RoutingEvent> retrievedTimeline = found.get().getRoutingTimeline();
        assertThat(retrievedTimeline).hasSize(2);
        assertThat(retrievedTimeline.get(0).eventType()).isEqualTo("RULE_EVALUATED");
        assertThat(retrievedTimeline.get(0).toChannel()).isEqualTo(ChannelType.SMS);
        assertThat(retrievedTimeline.get(1).eventType()).isEqualTo("CHANNEL_SELECTED");
    }

    @Test
    @DisplayName("Should delete signature request")
    void shouldDeleteSignatureRequest() {
        // Given
        UUID requestId = UUIDGenerator.generateV7();
        Instant now = Instant.now();
        
        SignatureRequest request = SignatureRequest.builder()
            .id(requestId)
            .customerId(customerId)
            .transactionContext(transactionContext)
            .status(SignatureStatus.PENDING)
            .challenges(new ArrayList<>())
            .routingTimeline(new ArrayList<>())
            .createdAt(now)
            .expiresAt(now.plusSeconds(180))
            .build();
        
        repository.save(request);
        assertThat(repository.findById(requestId)).isPresent();

        // When
        repository.delete(requestId);

        // Then
        Optional<SignatureRequest> found = repository.findById(requestId);
        assertThat(found).isEmpty();
    }
}

