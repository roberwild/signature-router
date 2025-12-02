package com.bank.signature.infrastructure.adapter.outbound.security;

import com.bank.signature.domain.port.outbound.PseudonymizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

/**
 * Implementation of PseudonymizationService using HMAC-SHA256.
 * Story 2.1: Create Signature Request Use Case
 * 
 * Secret key is loaded from Vault (Story 1.4).
 * 
 * HMAC-SHA256 provides:
 * - Deterministic: Same input → same output
 * - One-way: Cannot reverse to original value
 * - Key-dependent: Different keys produce different outputs
 */
@Service
@Slf4j
@ConditionalOnProperty(prefix = "spring.cloud.vault", name = "enabled", havingValue = "false", matchIfMissing = true)
public class PseudonymizationServiceImpl implements PseudonymizationService {
    
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    
    private final String secretKey;
    
    public PseudonymizationServiceImpl(
        @Value("${security.pseudonymization.secret-key:default-dev-key-change-in-prod}") String secretKey
    ) {
        this.secretKey = secretKey;
        log.info("PseudonymizationService initialized with secret key from configuration");
    }
    
    @Override
    public String pseudonymize(String customerId) {
        if (customerId == null || customerId.isBlank()) {
            throw new IllegalArgumentException("customerId cannot be null or blank");
        }
        
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8), 
                HMAC_ALGORITHM
            );
            mac.init(keySpec);
            
            byte[] hmacBytes = mac.doFinal(customerId.getBytes(StandardCharsets.UTF_8));
            
            // Convert to hex string
            return bytesToHex(hmacBytes);
            
        } catch (NoSuchAlgorithmException e) {
            log.error("HMAC algorithm not available: {}", HMAC_ALGORITHM, e);
            throw new IllegalStateException("Pseudonymization algorithm not available", e);
        } catch (InvalidKeyException e) {
            log.error("Invalid secret key for HMAC", e);
            throw new IllegalStateException("Invalid pseudonymization key", e);
        }
    }
    
    @Override
    public boolean verify(String customerId, String pseudonymizedValue) {
        if (customerId == null || pseudonymizedValue == null) {
            return false;
        }
        
        String calculated = pseudonymize(customerId);
        return calculated.equals(pseudonymizedValue);
    }
    
    /**
     * Converts byte array to hexadecimal string.
     * 
     * @param bytes The byte array to convert
     * @return Hexadecimal string representation
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

