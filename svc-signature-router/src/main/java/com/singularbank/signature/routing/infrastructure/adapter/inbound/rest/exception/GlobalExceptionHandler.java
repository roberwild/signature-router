package com.singularbank.signature.routing.infrastructure.adapter.inbound.rest.exception;

import com.singularbank.signature.routing.domain.exception.DomainException;
import com.singularbank.signature.routing.domain.exception.NotFoundException;
import com.singularbank.signature.routing.infrastructure.adapter.inbound.rest.dto.ErrorResponse;
import com.singularbank.signature.routing.infrastructure.ratelimit.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for consistent error responses across all REST endpoints.
 * 
 * <p>Maps exceptions to HTTP status codes and ErrorResponse DTOs with trace correlation.</p>
 * 
 * <p><b>Exception Mapping:</b></p>
 * <ul>
 *   <li>DomainException → HTTP 422 Unprocessable Entity</li>
 *   <li>NotFoundException → HTTP 404 Not Found</li>
 *   <li>MethodArgumentNotValidException → HTTP 400 Bad Request with field errors</li>
 *   <li>AccessDeniedException → HTTP 403 Forbidden</li>
 *   <li>Exception (generic) → HTTP 500 Internal Server Error (NO stack trace in response)</li>
 * </ul>
 * 
 * @since Story 1.7
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    /**
     * Handle domain-specific exceptions (business logic errors).
     * 
     * @param ex Domain exception
     * @param request HTTP servlet request
     * @return ErrorResponse with HTTP 422
     */
    @ExceptionHandler(DomainException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ErrorResponse handleDomainException(DomainException ex, HttpServletRequest request) {
        log.warn("Domain exception: {} - {}", ex.getErrorCode(), ex.getMessage());
        return buildErrorResponse(ex.getErrorCode(), ex.getMessage(), null, request);
    }
    
    /**
     * Handle entity not found exceptions.
     * 
     * @param ex NotFoundException
     * @param request HTTP servlet request
     * @return ErrorResponse with HTTP 404
     */
    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFoundException(NotFoundException ex, HttpServletRequest request) {
        log.info("Entity not found: {}", ex.getMessage());
        return buildErrorResponse("NOT_FOUND", ex.getMessage(), null, request);
    }
    
    /**
     * Handle validation exceptions (Bean Validation).
     * 
     * @param ex MethodArgumentNotValidException
     * @param request HTTP servlet request
     * @return ErrorResponse with HTTP 400 and field errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, Object> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            fieldErrors.put(error.getField(), error.getDefaultMessage())
        );
        
        log.warn("Validation failed: {}", fieldErrors);
        return buildErrorResponse("VALIDATION_ERROR", "Invalid input", fieldErrors, request);
    }
    
    /**
     * Handle authorization failures (Spring Security).
     * 
     * @param ex AccessDeniedException
     * @param request HTTP servlet request
     * @return ErrorResponse with HTTP 403
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied for path: {} - {}", request.getRequestURI(), ex.getMessage());
        return buildErrorResponse("FORBIDDEN", "Access denied", null, request);
    }
    
    /**
     * Handle rate limit exceeded exceptions.
     * Critical Improvement #2: Rate Limiting
     * 
     * @param ex RateLimitExceededException
     * @param request HTTP servlet request
     * @return ErrorResponse with HTTP 429
     */
    @ExceptionHandler(RateLimitExceededException.class)
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public ErrorResponse handleRateLimitExceededException(RateLimitExceededException ex, HttpServletRequest request) {
        log.warn("Rate limit exceeded: limiter={}, identifier={}",
            ex.getRateLimiterName(), ex.getIdentifier());
        
        Map<String, Object> details = new HashMap<>();
        details.put("rateLimiter", ex.getRateLimiterName());
        details.put("identifier", ex.getIdentifier());
        details.put("retryAfter", "60"); // Retry after 60 seconds
        
        return buildErrorResponse("RATE_LIMIT_EXCEEDED", ex.getMessage(), details, request);
    }
    
    /**
     * Handle unexpected exceptions (fallback).
     * 
     * @param ex Generic exception
     * @param request HTTP servlet request
     * @return ErrorResponse with HTTP 500 (NO stack trace)
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error: ", ex); // Full stack trace in logs
        return buildErrorResponse("INTERNAL_ERROR", "An unexpected error occurred", null, request);
    }
    
    /**
     * Build standard ErrorResponse with trace correlation.
     * 
     * @param code Error code
     * @param message Error message
     * @param details Additional error details (nullable)
     * @param request HTTP servlet request
     * @return ErrorResponse DTO
     */
    private ErrorResponse buildErrorResponse(String code, String message, Map<String, Object> details, HttpServletRequest request) {
        return ErrorResponse.builder()
            .code(code)
            .message(message)
            .details(details)
            .timestamp(Instant.now().toString())
            .traceId(MDC.get("traceId") != null ? MDC.get("traceId") : "NO_TRACE")
            .path(request.getRequestURI())
            .build();
    }
}

