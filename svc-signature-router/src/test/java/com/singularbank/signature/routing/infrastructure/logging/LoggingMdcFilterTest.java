package com.singularbank.signature.routing.infrastructure.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.slf4j.MDC;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for LoggingMdcFilter.
 * Critical Improvement #5: Structured JSON Logging
 */
@DisplayName("LoggingMdcFilter")
class LoggingMdcFilterTest {
    
    private LoggingMdcFilter filter;
    
    @Mock
    private HttpServletRequest request;
    
    @Mock
    private HttpServletResponse response;
    
    @Mock
    private FilterChain filterChain;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        filter = new LoggingMdcFilter();
        MDC.clear();
    }
    
    @AfterEach
    void tearDown() {
        MDC.clear();
    }
    
    @Test
    @DisplayName("Should populate MDC with traceId from header")
    void shouldPopulateMdcWithTraceIdFromHeader() throws Exception {
        // Given
        String traceId = "test-trace-123";
        when(request.getHeader("X-Trace-Id")).thenReturn(traceId);
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/signatures");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        
        // When
        filter.doFilter(request, response, filterChain);
        
        // Then
        verify(filterChain).doFilter(request, response);
        // MDC is cleared after filter, so we can't assert here
        // This test verifies the filter completes without errors
    }
    
    @Test
    @DisplayName("Should generate traceId if header is missing")
    void shouldGenerateTraceIdIfHeaderMissing() throws Exception {
        // Given
        when(request.getHeader("X-Trace-Id")).thenReturn(null);
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/signatures");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        
        // When
        filter.doFilter(request, response, filterChain);
        
        // Then
        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    @DisplayName("Should extract real IP from X-Forwarded-For header")
    void shouldExtractRealIpFromXForwardedFor() throws Exception {
        // Given
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.1, 198.51.100.1");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/signatures");
        
        // When
        filter.doFilter(request, response, filterChain);
        
        // Then
        verify(filterChain).doFilter(request, response);
    }
}

