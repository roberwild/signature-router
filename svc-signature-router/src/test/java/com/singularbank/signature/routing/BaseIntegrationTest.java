package com.singularbank.signature.routing;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Base class for integration tests.
 * Provides common Spring Boot test configuration.
 * 
 * @since Sprint 1
 */
@SpringBootTest
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {
    // Common test configuration and utilities can be added here
}

