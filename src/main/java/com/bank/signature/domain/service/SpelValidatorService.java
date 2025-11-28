package com.bank.signature.domain.service;

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
     * Allowed variables:
     * - context.amount.value (BigDecimal)
     * - context.amount.currency (String)
     * - context.merchantId (String)
     * - context.orderId (String)
     * - context.description (String)
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
     * @throws com.bank.signature.domain.exception.InvalidSpelExpressionException if validation fails
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

