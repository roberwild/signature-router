package com.bank.signature.infrastructure.adapter.outbound.spel;

import com.bank.signature.domain.exception.InvalidSpelExpressionException;
import com.bank.signature.domain.service.SpelValidatorService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.ParseException;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.SimpleEvaluationContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Implementation of SpelValidatorService using Spring Expression Language.
 * Story 2.2: Routing Rules - CRUD API
 * 
 * Uses SimpleEvaluationContext (not StandardEvaluationContext) for security:
 * - Prevents T() type references
 * - Prevents reflection
 * - Prevents bean references
 * - Only allows whitelisted variables and functions
 */
@Service
@Slf4j
public class SpelValidatorServiceImpl implements SpelValidatorService {
    
    private final ExpressionParser parser;
    
    public SpelValidatorServiceImpl() {
        this.parser = new SpelExpressionParser();
    }
    
    @Override
    public void validate(String spelExpression) {
        ValidationResult result = validateWithResult(spelExpression);
        if (!result.valid()) {
            throw new InvalidSpelExpressionException(result.errorMessage(), result.errorPosition());
        }
    }
    
    @Override
    public ValidationResult validateWithResult(String spelExpression) {
        if (spelExpression == null || spelExpression.isBlank()) {
            return ValidationResult.failure("SpEL expression cannot be null or blank", 0);
        }
        
        try {
            // 1. Parse the expression (syntax validation)
            Expression expression = parser.parseExpression(spelExpression);
            log.debug("SpEL expression parsed successfully: {}", spelExpression);
            
            // 2. Check for prohibited features
            String lowerExpr = spelExpression.toLowerCase();
            if (lowerExpr.contains("t(")) {
                return ValidationResult.failure(
                    "Type references T() are not allowed for security reasons",
                    spelExpression.toLowerCase().indexOf("t(")
                );
            }
            if (lowerExpr.contains("@")) {
                return ValidationResult.failure(
                    "Bean references @ are not allowed for security reasons",
                    spelExpression.indexOf("@")
                );
            }
            if (lowerExpr.contains("#")) {
                return ValidationResult.failure(
                    "Variable references # are not allowed (use 'context' directly)",
                    spelExpression.indexOf("#")
                );
            }
            
            // 3. Evaluate with sample context to ensure it works
            SimpleEvaluationContext context = createSafeEvaluationContext();
            Object result = expression.getValue(context);
            
            // 4. Ensure result is Boolean (routing rules must return boolean)
            if (result != null && !(result instanceof Boolean)) {
                return ValidationResult.failure(
                    "SpEL expression must evaluate to a Boolean (true/false), but got: " + result.getClass().getSimpleName(),
                    -1
                );
            }
            
            log.info("SpEL expression validated successfully: {} -> {}", spelExpression, result);
            return ValidationResult.success();
            
        } catch (ParseException e) {
            log.warn("SpEL parse error at position {}: {}", e.getPosition(), e.getMessage());
            return ValidationResult.failure(
                "Parse error: " + e.getExpressionString() + " at position " + e.getPosition(),
                e.getPosition()
            );
        } catch (Exception e) {
            log.warn("SpEL evaluation error: {}", e.getMessage(), e);
            return ValidationResult.failure(
                "Evaluation error: " + e.getMessage(),
                -1
            );
        }
    }
    
    /**
     * Creates a safe evaluation context with sample transaction data.
     * Uses SimpleEvaluationContext for security (no reflection, T(), etc.)
     * 
     * @return SimpleEvaluationContext with sample context variables
     */
    private SimpleEvaluationContext createSafeEvaluationContext() {
        // Create sample transaction context for validation
        Map<String, Object> amount = new HashMap<>();
        amount.put("value", new BigDecimal("100.00"));
        amount.put("currency", "EUR");
        
        Map<String, Object> context = new HashMap<>();
        context.put("amount", amount);
        context.put("merchantId", "merchant-123");
        context.put("orderId", "order-456");
        context.put("description", "Test transaction");
        
        // Build SimpleEvaluationContext (secure, no reflection)
        return SimpleEvaluationContext.forReadOnlyDataBinding()
            .withRootObject(Map.of("context", context))
            .build();
    }
}

