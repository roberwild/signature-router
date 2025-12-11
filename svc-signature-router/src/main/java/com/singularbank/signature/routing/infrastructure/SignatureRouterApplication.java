package com.singularbank.signature.routing.infrastructure;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
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
 * <p><b>AOP:</b> Enabled for audit trail (Epic 17: Comprehensive Audit Trail)</p>
 * 
 * @since 0.1.0
 */
@SpringBootApplication
@ComponentScan(basePackages = "com.singularbank.signature.routing")
@EnableScheduling
@EnableAspectJAutoProxy
public class SignatureRouterApplication {

    public static void main(String[] args) {
        SpringApplication.run(SignatureRouterApplication.class, args);
    }

}

