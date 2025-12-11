package com.singularbank.signature.routing.infrastructure.adapter.outbound.security;

import com.singularbank.signature.routing.domain.model.valueobject.TransactionContext;
import com.singularbank.signature.routing.domain.service.TransactionHashService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Implementation of TransactionHashService using SHA-256.
 * Story 2.1: Create Signature Request Use Case
 * 
 * Uses Jackson ObjectMapper for canonical JSON serialization
 * to ensure consistent hashing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionHashServiceImpl implements TransactionHashService {
    
    private static final String HASH_ALGORITHM = "SHA-256";
    
    private final ObjectMapper objectMapper;
    
    @Override
    public String calculateHash(TransactionContext transactionContext) {
        if (transactionContext == null) {
            throw new IllegalArgumentException("transactionContext cannot be null");
        }
        
        try {
            // Serialize to canonical JSON (sorted keys)
            String json = objectMapper.writeValueAsString(transactionContext);
            
            // Calculate SHA-256 hash
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            byte[] hashBytes = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            
            // Convert to hex string
            return bytesToHex(hashBytes);
            
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize transaction context to JSON", e);
            throw new IllegalStateException("Failed to calculate transaction hash", e);
        } catch (NoSuchAlgorithmException e) {
            log.error("Hash algorithm not available: {}", HASH_ALGORITHM, e);
            throw new IllegalStateException("Hash algorithm not available", e);
        }
    }
    
    @Override
    public boolean verifyHash(TransactionContext transactionContext, String expectedHash) {
        if (transactionContext == null || expectedHash == null) {
            return false;
        }
        
        String calculated = calculateHash(transactionContext);
        return calculated.equals(expectedHash);
    }
    
    /**
     * Converts byte array to hexadecimal string.
     * 
     * @param bytes The byte array to convert
     * @return Hexadecimal string representation (64 characters for SHA-256)
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(2 * bytes.length);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}

