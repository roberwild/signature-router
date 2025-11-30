package com.bank.signature.infrastructure;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Signature Router & Management System.
 * 
 * <p>Banking-grade digital signature routing with DDD + Hexagonal Architecture.</p>
 * 
 * <p>Architecture layers:</p>
 * <ul>
 *   <li><b>Domain</b>: Pure business logic (aggregates, value objects, domain services)</li>
 *   <li><b>Application</b>: Use case orchestration</li>
 *   <li><b>Infrastructure</b>: Adapters (REST, JPA, Kafka, Providers)</li>
 * </ul>
 * 
 * <p><b>Scheduling:</b> Enabled for background jobs (Story 2.9: Challenge Expiration)</p>
 * 
 * @since 0.1.0
 */
@SpringBootApplication
@ComponentScan(basePackages = "com.bank.signature")
@EnableScheduling
public class SignatureRouterApplication {

    public static void main(String[] args) {
        SpringApplication.run(SignatureRouterApplication.class, args);
    }

}

