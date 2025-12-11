package com.singularbank.signature.routing.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3.1 configuration for Springdoc.
 * 
 * <p>Provides interactive Swagger UI at /swagger-ui.html with automatic
 * request/response schema generation.</p>
 * 
 * <p><b>Endpoints:</b></p>
 * <ul>
 *   <li>Swagger UI: /swagger-ui.html</li>
 *   <li>OpenAPI JSON: /v3/api-docs</li>
 * </ul>
 * 
 * <p><b>Security:</b> Bearer JWT authentication configured</p>
 * 
 * @since Story 1.7
 */
@Configuration
public class OpenApiConfig {
    
    /**
     * Configure OpenAPI specification with API metadata and security scheme.
     * 
     * @return OpenAPI bean
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Signature Router API")
                .version("0.1.0")
                .description("Banking-grade Signature Router & Management System with DDD + Hexagonal Architecture")
                .contact(new Contact()
                    .name("Bank Signature Team")
                    .email("signature-team@bank.com"))
                .license(new License()
                    .name("Proprietary")
                    .url("https://bank.com/license")))
            .addServersItem(new Server()
                .url("http://localhost:8080")
                .description("Local development"))
            .addServersItem(new Server()
                .url("https://api-uat.signature-router.bank.com")
                .description("UAT environment"))
            .addServersItem(new Server()
                .url("https://api.signature-router.bank.com")
                .description("Production"))
            .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
            .components(new io.swagger.v3.oas.models.Components()
                .addSecuritySchemes("Bearer Authentication", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT token obtained from OAuth2 authorization server")));
    }
}

