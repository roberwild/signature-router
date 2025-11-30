package com.bank.signature.application.mapper;

import com.bank.signature.application.dto.*;
import com.bank.signature.domain.model.aggregate.SignatureRequest;
import com.bank.signature.domain.model.entity.SignatureChallenge;
import com.bank.signature.domain.model.valueobject.*;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between Signature DTOs and Domain models.
 * Story 2.1: Create Signature Request Use Case
 * Story 2.8: Query Signature Request (GET Endpoint)
 */
@Component
public class SignatureMapper {
    
    /**
     * Maps CreateSignatureRequestDto to TransactionContext domain value object.
     * Note: customerId is NOT included in TransactionContext (handled separately).
     * 
     * @param dto The DTO to map
     * @return TransactionContext domain value object
     */
    public TransactionContext toDomain(CreateSignatureRequestDto dto) {
        return new TransactionContext(
            toDomain(dto.transactionContext().amount()),
            dto.transactionContext().merchantId(),
            dto.transactionContext().orderId(),
            dto.transactionContext().description(),
            calculateTransactionHash(dto.transactionContext())
        );
    }
    
    /**
     * Calculates SHA-256 hash of transaction context for integrity verification.
     * 
     * @param transactionContext The transaction context DTO
     * @return 64-character hexadecimal SHA-256 hash
     */
    private String calculateTransactionHash(TransactionContextDto transactionContext) {
        try {
            String data = String.format("%s|%s|%s|%s",
                transactionContext.amount().value(),
                transactionContext.amount().currency(),
                transactionContext.merchantId(),
                transactionContext.orderId()
            );
            
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            
            // Convert bytes to hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
    
    /**
     * Maps MoneyDto to Money domain value object.
     * 
     * @param dto The DTO to map
     * @return Money domain value object
     */
    public Money toDomain(MoneyDto dto) {
        return new Money(dto.value(), dto.currency());
    }
    
    /**
     * Maps SignatureRequest aggregate to SignatureResponseDto.
     * 
     * @param signatureRequest The domain aggregate to map
     * @return SignatureResponseDto
     */
    public SignatureResponseDto toDto(SignatureRequest signatureRequest) {
        return new SignatureResponseDto(
            signatureRequest.getId(),
            signatureRequest.getStatus(),
            signatureRequest.getCreatedAt(),
            signatureRequest.getExpiresAt()
        );
    }
    
    /**
     * Maps SignatureRequest aggregate to detailed SignatureRequestDetailDto.
     * Story 2.8: Query Signature Request (GET Endpoint)
     * 
     * Includes:
     * - Tokenized customer ID (first 8 chars + "...")
     * - Active challenge (PENDING or SENT)
     * - Routing timeline (chronologically ordered)
     * 
     * @param signatureRequest The domain aggregate to map
     * @return SignatureRequestDetailDto with complete information
     */
    public SignatureRequestDetailDto toDetailDto(SignatureRequest signatureRequest) {
        return new SignatureRequestDetailDto(
            signatureRequest.getId(),
            tokenizeCustomerId(signatureRequest.getCustomerId()),
            signatureRequest.getStatus(),
            findActiveChallenge(signatureRequest),
            mapRoutingTimeline(signatureRequest.getRoutingTimeline()),
            signatureRequest.getCreatedAt(),
            signatureRequest.getCreatedAt(), // using createdAt as updatedAt is not tracked
            signatureRequest.getExpiresAt()
        );
    }
    
    /**
     * Tokenizes customer ID for privacy.
     * Shows only first 8 characters followed by "..."
     * 
     * Example: "a1b2c3d4e5f6g7h8i9j0" → "a1b2c3d4..."
     * 
     * @param pseudonymizedCustomerId The pseudonymized customer ID (already hashed)
     * @return Tokenized customer ID
     */
    private String tokenizeCustomerId(String pseudonymizedCustomerId) {
        if (pseudonymizedCustomerId == null) {
            return null;
        }
        
        if (pseudonymizedCustomerId.length() <= 8) {
            return pseudonymizedCustomerId + "...";
        }
        
        return pseudonymizedCustomerId.substring(0, 8) + "...";
    }
    
    /**
     * Finds the active challenge (PENDING or SENT status).
     * Only one challenge can be active at a time.
     * 
     * @param signatureRequest The signature request
     * @return ActiveChallengeDto if found, null otherwise
     */
    private ActiveChallengeDto findActiveChallenge(SignatureRequest signatureRequest) {
        return signatureRequest.getChallenges().stream()
            .filter(c -> c.getStatus() == ChallengeStatus.PENDING || 
                        c.getStatus() == ChallengeStatus.SENT)
            .findFirst()
            .map(this::toActiveChallengeDto)
            .orElse(null);
    }
    
    /**
     * Maps SignatureChallenge to ActiveChallengeDto.
     * 
     * @param challenge The challenge to map
     * @return ActiveChallengeDto
     */
    private ActiveChallengeDto toActiveChallengeDto(SignatureChallenge challenge) {
        return new ActiveChallengeDto(
            challenge.getId(),
            challenge.getChannelType(),
            challenge.getStatus(),
            challenge.getSentAt(),
            challenge.getExpiresAt()
        );
    }
    
    /**
     * Maps routing timeline events to DTOs.
     * Events are sorted chronologically (oldest first).
     * 
     * @param routingTimeline List of routing events from domain
     * @return List of RoutingEventDto ordered by timestamp
     */
    private List<RoutingEventDto> mapRoutingTimeline(List<RoutingEvent> routingTimeline) {
        if (routingTimeline == null) {
            return List.of();
        }
        
        return routingTimeline.stream()
            .sorted(Comparator.comparing(RoutingEvent::timestamp))
            .map(event -> new RoutingEventDto(
                event.timestamp(),
                event.eventType(),
                event.reason()
            ))
            .collect(Collectors.toList());
    }
}

