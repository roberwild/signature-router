package com.bank.signature.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Configuration for asynchronous provider execution.
 * 
 * <p>This configuration provides a dedicated thread pool for executing provider
 * operations asynchronously with timeout protection via Resilience4j TimeLimiter.
 * 
 * <p><strong>Thread Pool Sizing:</strong>
 * <ul>
 * <li>Core Pool Size: 10 threads</li>
 * <li>Rationale: 4 providers × 2 concurrent requests = 8 threads + 2 buffer</li>
 * <li>Thread Name Pattern: {@code provider-timeout-{n}}</li>
 * <li>Daemon Threads: {@code true} (won't prevent JVM shutdown)</li>
 * </ul>
 * 
 * <p><strong>Usage:</strong>
 * Providers use this executor for {@code CompletableFuture.supplyAsync()} to enable
 * timeout decoration via Resilience4j TimeLimiter.
 * 
 * <p><strong>Example:</strong>
 * <pre>{@code
 * @Override
 * public CompletableFuture<ProviderResult> sendChallengeAsync(
 *     SignatureChallenge challenge, String recipient) {
 *     return CompletableFuture.supplyAsync(
 *         () -> sendChallenge(challenge, recipient),
 *         providerExecutorService  // This bean
 *     );
 * }
 * }</pre>
 * 
 * @since Story 3.8 - Provider Timeout Configuration
 */
@Configuration
public class AsyncProviderConfig {
    
    /**
     * Creates a ScheduledExecutorService for async provider operations.
     * 
     * <p>This executor is used by all providers (SMS, Push, Voice, Biometric) to
     * execute operations asynchronously, enabling Resilience4j TimeLimiter to
     * apply timeout protection with {@code cancelRunningFuture=true}.
     * 
     * <p><strong>Shutdown Behavior:</strong>
     * Spring Boot will automatically shutdown this executor on application stop
     * with a 30-second grace period for in-flight operations to complete.
     * 
     * @return a ScheduledExecutorService with 10 threads named {@code provider-timeout-{n}}
     */
    @Bean(destroyMethod = "shutdown")
    public ScheduledExecutorService providerExecutorService() {
        return new ScheduledThreadPoolExecutor(
            10,  // corePoolSize (4 providers × 2 concurrent + 2 buffer)
            new ProviderTimeoutThreadFactory()
        );
    }
    
    /**
     * Custom ThreadFactory for provider timeout executor.
     * Creates daemon threads with custom naming pattern.
     */
    private static class ProviderTimeoutThreadFactory implements ThreadFactory {
        private final AtomicInteger threadNumber = new AtomicInteger(1);
        
        @Override
        public Thread newThread(Runnable r) {
            Thread thread = new Thread(r);
            thread.setName("provider-timeout-" + threadNumber.getAndIncrement());
            thread.setDaemon(true);  // Daemon threads won't prevent JVM shutdown
            return thread;
        }
    }
}

