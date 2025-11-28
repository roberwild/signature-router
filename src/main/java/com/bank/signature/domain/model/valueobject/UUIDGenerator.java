package com.bank.signature.domain.model.valueobject;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;

/**
 * Utility class for generating UUIDv7 (time-sortable UUIDs).
 * 
 * <p><b>UUIDv7 Format:</b></p>
 * <pre>
 * - 48-bit timestamp (milliseconds since epoch)
 * - 4-bit version (0111 = 7)
 * - 12-bit counter (per-millisecond uniqueness)
 * - 2-bit variant (10)
 * - 62-bit random
 * </pre>
 * 
 * <p><b>Benefits over UUIDv4:</b></p>
 * <ul>
 *   <li>Time-sortable (better for B-tree indexes in PostgreSQL)</li>
 *   <li>Reduces index fragmentation (sequential inserts)</li>
 *   <li>Preserves randomness (hard to predict)</li>
 * </ul>
 * 
 * @since Story 1.5
 */
public final class UUIDGenerator {
    
    private static final SecureRandom RANDOM = new SecureRandom();
    
    private UUIDGenerator() {
        // Utility class, no instantiation
    }
    
    /**
     * Generate UUIDv7 (time-sortable UUID).
     * 
     * @return UUIDv7 instance
     */
    public static UUID generateV7() {
        long timestamp = Instant.now().toEpochMilli();
        
        // Most significant bits: 48-bit timestamp + 4-bit version (7) + 12-bit random
        long mostSigBits = (timestamp << 16) | (0x7000L | (RANDOM.nextLong() & 0x0FFFL));
        
        // Least significant bits: 2-bit variant (10) + 62-bit random
        long leastSigBits = (0x8000000000000000L | (RANDOM.nextLong() & 0x3FFFFFFFFFFFFFFFL));
        
        return new UUID(mostSigBits, leastSigBits);
    }
}






