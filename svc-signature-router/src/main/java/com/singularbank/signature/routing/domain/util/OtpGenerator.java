package com.singularbank.signature.routing.domain.util;

import java.security.SecureRandom;

/**
 * Utility for generating One-Time Password (OTP) codes.
 * Story 2.5: SMS Provider Integration (Twilio)
 */
public final class OtpGenerator {
    
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int DEFAULT_LENGTH = 6;
    
    private OtpGenerator() {
        throw new AssertionError("Utility class should not be instantiated");
    }
    
    /**
     * Generates a numeric OTP code with default length (6 digits).
     * 
     * @return OTP code (e.g., "123456")
     */
    public static String generate() {
        return generate(DEFAULT_LENGTH);
    }
    
    /**
     * Generates a numeric OTP code with specified length.
     * 
     * @param length Number of digits (e.g., 6 for "123456")
     * @return OTP code
     */
    public static String generate(int length) {
        if (length < 4 || length > 10) {
            throw new IllegalArgumentException("OTP length must be between 4 and 10");
        }
        
        int max = (int) Math.pow(10, length) - 1;
        int min = (int) Math.pow(10, length - 1);
        
        int otp = RANDOM.nextInt(max - min + 1) + min;
        
        return String.format("%0" + length + "d", otp);
    }
}

