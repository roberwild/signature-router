package com.singularbank.signature.routing.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Service for calculating SHA-256 hashes of request bodies.
 * 
 * <p>Used by idempotency mechanism to detect if the same idempotency key
 * is reused with a different request body (conflict detection).</p>
 * 
 * @since Story 10.5
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HashService {
    
    private static final String ALGORITHM = "SHA-256";
    
    private final ObjectMapper objectMapper;
    
    /**
     * Calculate SHA-256 hash of an object after JSON serialization.
     * 
     * <p>The object is serialized to JSON (with consistent ordering) and then hashed.
     * This ensures that the same object always produces the same hash.</p>
     * 
     * @param object Object to hash (typically request body)
     * @return SHA-256 hash as hexadecimal string (64 characters)
     * @throws IllegalArgumentException if object is null or serialization fails
     */
    public String sha256(Object object) {
        if (object == null) {
            throw new IllegalArgumentException("Object cannot be null");
        }
        
        try {
            // Serialize to JSON with consistent ordering
            String json = objectMapper.writeValueAsString(object);
            
            // Calculate SHA-256 hash
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            byte[] hashBytes = digest.digest(json.getBytes(StandardCharsets.UTF_8));
            
            // Convert to hexadecimal string
            return bytesToHex(hashBytes);
            
        } catch (Exception e) {
            log.error("Failed to calculate hash for object: {}", object.getClass().getName(), e);
            throw new IllegalArgumentException("Failed to calculate hash: " + e.getMessage(), e);
        }
    }
    
    /**
     * Convert byte array to hexadecimal string.
     * 
     * @param bytes Byte array
     * @return Hexadecimal string
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

