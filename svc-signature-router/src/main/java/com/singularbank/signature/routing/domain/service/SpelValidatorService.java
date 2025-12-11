package com.singularbank.signature.routing.domain.service;

/**
 * Domain service for validating SpEL (Spring Expression Language) expressions.
 * Story 2.2: Routing Rules - CRUD API
 * 
 * Validates SpEL conditions used in routing rules to ensure:
 * - Syntax is valid
 * - Only allowed variables are used (context.*)
 * - Only safe functions are used (no reflection, T(), etc.)
 * - Expression can be evaluated without errors
 */
public interface SpelValidatorService {
    
    /**
     * Validates a SpEL expression for routing rules.
     * 
     * Available properties (from RoutingContext JavaBean):
     * - amountValue (BigDecimal) - transaction amount value
     * - amountCurrency (String) - transaction currency (e.g., "EUR", "USD")
     * - merchantId (String) - merchant identifier
     * - orderId (String) - order identifier
     * - description (String) - transaction description
     * 
     * Example expressions:
     * - amountValue > 1000.00
     * - amountValue >= 100.00 && amountValue <= 1000.00
     * - description matches '.*urgente.*'
     * - amountCurrency == 'EUR' && amountValue > 500
     * 
     * Allowed operators:
     * - Comparison: ==, !=, <, >, <=, >=
     * - Logical: and, or, not, &&, ||, !
     * - Math: +, -, *, /, %
     * - String: +, matches
     * 
     * Prohibited features:
     * - Type references: T(java.lang.System)
     * - Method invocation on external classes
     * - Reflection
     * - Bean references: @beanName
     * 
     * @param spelExpression The SpEL expression to validate
     * @throws com.singularbank.signature.routing.domain.exception.InvalidSpelExpressionException if validation fails
     */
    void validate(String spelExpression);
    
    /**
     * Validates a SpEL expression and returns validation result.
     * Non-throwing variant that returns success/failure with error message.
     * 
     * @param spelExpression The SpEL expression to validate
     * @return ValidationResult with success flag and error message if failed
     */
    ValidationResult validateWithResult(String spelExpression);
    
    /**
     * Result of SpEL validation.
     * 
     * @param valid Whether the expression is valid
     * @param errorMessage Error message if invalid (null if valid)
     * @param errorPosition Position in expression where error occurred (-1 if N/A)
     */
    record ValidationResult(boolean valid, String errorMessage, int errorPosition) {
        
        public static ValidationResult success() {
            return new ValidationResult(true, null, -1);
        }
        
        public static ValidationResult failure(String errorMessage, int errorPosition) {
            return new ValidationResult(false, errorMessage, errorPosition);
        }
    }
}

