package com.bank.signature.domain.model.valueobject;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for UUIDGenerator utility.
 * 
 * <p>Tests validate:</p>
 * <ul>
 *   <li>UUIDv7 generation</li>
 *   <li>Time-sortability (chronological ordering)</li>
 *   <li>Uniqueness across multiple generations</li>
 * </ul>
 * 
 * <p><b>Critical for PostgreSQL B-tree performance:</b> UUIDv7 time-sortability
 * reduces index fragmentation compared to UUIDv4 random.</p>
 * 
 * @since Story 1.5
 */
class UUIDGeneratorTest {

    @Test
    void testGenerateV7_NotNull() {
        // When: Generate UUIDv7
        UUID uuid = UUIDGenerator.generateV7();

        // Then: UUID is not null
        assertNotNull(uuid);
    }

    @Test
    void testGenerateV7_Version7() {
        // When: Generate UUIDv7
        UUID uuid = UUIDGenerator.generateV7();

        // Then: UUID version is 7
        assertEquals(7, uuid.version());
    }

    @Test
    void testGenerateV7_Variant2() {
        // When: Generate UUIDv7
        UUID uuid = UUIDGenerator.generateV7();

        // Then: UUID variant is 2 (RFC 4122)
        assertEquals(2, uuid.variant());
    }

    @Test
    void testGenerateV7_IsSortable() {
        // Given: Generate 100 UUIDv7 in sequence
        List<UUID> uuids = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            uuids.add(UUIDGenerator.generateV7());
            
            // Small delay to ensure timestamp changes (millisecond precision)
            try {
                Thread.sleep(1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Then: UUIDs are in chronological order (time-sortable)
        for (int i = 0; i < uuids.size() - 1; i++) {
            UUID current = uuids.get(i);
            UUID next = uuids.get(i + 1);
            
            // Compare lexicographically (string comparison)
            String currentStr = current.toString();
            String nextStr = next.toString();
            
            // Next UUID should be lexicographically greater (time-ordered)
            assertTrue(
                currentStr.compareTo(nextStr) <= 0,
                String.format("UUIDs not in chronological order: %s should be <= %s", currentStr, nextStr)
            );
        }
    }

    @Test
    void testGenerateV7_Uniqueness() {
        // Given: Generate 1000 UUIDv7
        List<UUID> uuids = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            uuids.add(UUIDGenerator.generateV7());
        }

        // Then: All UUIDs are unique
        long uniqueCount = uuids.stream().distinct().count();
        assertEquals(1000, uniqueCount, "UUIDs should all be unique");
    }

    @Test
    void testGenerateV7_TimestampEmbedded() {
        // Given: Generate UUIDv7 before and after delay
        UUID uuid1 = UUIDGenerator.generateV7();
        
        // Wait 100ms
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        UUID uuid2 = UUIDGenerator.generateV7();

        // Then: Second UUID is lexicographically greater (timestamp embedded)
        assertTrue(
            uuid1.toString().compareTo(uuid2.toString()) < 0,
            String.format("UUID2 should be greater than UUID1 (time-ordered): %s vs %s", uuid1, uuid2)
        );
    }

    @Test
    void testGenerateV7_Performance() {
        // When: Generate 10,000 UUIDv7
        long startTime = System.nanoTime();
        for (int i = 0; i < 10_000; i++) {
            UUIDGenerator.generateV7();
        }
        long endTime = System.nanoTime();
        long durationMs = (endTime - startTime) / 1_000_000;

        // Then: Generation is fast (< 1 second for 10K UUIDs)
        assertTrue(durationMs < 1000, String.format("UUIDv7 generation too slow: %d ms for 10K UUIDs", durationMs));
    }

    @Test
    void testGenerateV7_ConsistentFormat() {
        // When: Generate UUIDv7
        UUID uuid = UUIDGenerator.generateV7();
        String uuidStr = uuid.toString();

        // Then: UUID string format is valid (8-4-4-4-12 hex digits)
        assertTrue(
            uuidStr.matches("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"),
            String.format("Invalid UUID format: %s", uuidStr)
        );
    }

    @Test
    void testGenerateV7_ConcurrentGeneration() throws InterruptedException {
        // Given: Generate UUIDs concurrently from 10 threads
        final int threadCount = 10;
        final int uuidsPerThread = 100;
        List<UUID> allUuids = new ArrayList<>();
        List<Thread> threads = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            Thread thread = new Thread(() -> {
                for (int j = 0; j < uuidsPerThread; j++) {
                    synchronized (allUuids) {
                        allUuids.add(UUIDGenerator.generateV7());
                    }
                }
            });
            threads.add(thread);
            thread.start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join();
        }

        // Then: All UUIDs are unique (no collisions)
        long uniqueCount = allUuids.stream().distinct().count();
        assertEquals(threadCount * uuidsPerThread, uniqueCount, "Concurrent generation should produce unique UUIDs");
    }
}

