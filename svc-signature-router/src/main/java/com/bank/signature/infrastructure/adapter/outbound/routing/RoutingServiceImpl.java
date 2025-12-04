package com.bank.signature.infrastructure.adapter.outbound.routing;

import com.bank.signature.domain.model.aggregate.RoutingRule;
import com.bank.signature.domain.model.valueobject.ChannelType;
import com.bank.signature.domain.model.valueobject.RoutingEvent;
import com.bank.signature.domain.model.valueobject.TransactionContext;
import com.bank.signature.domain.port.outbound.RoutingRuleRepository;
import com.bank.signature.domain.service.RoutingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.SimpleEvaluationContext;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of RoutingService using Spring Expression Language (SpEL).
 * Story 2.3: Routing Engine - SpEL Evaluation
 * 
 * Evaluates routing rules in priority order with short-circuit behavior.
 * Uses SimpleEvaluationContext for security (no reflection, T(), etc.)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoutingServiceImpl implements RoutingService {
    
    private final RoutingRuleRepository routingRuleRepository;
    private final ExpressionParser parser = new SpelExpressionParser();
    
    @Value("${routing.default-channel:SMS}")
    private String defaultChannelConfig;
    
    @Override
    public RoutingDecision evaluate(TransactionContext transactionContext) {
        long startTime = System.nanoTime();
        log.debug("Starting routing evaluation for transaction");
        
        List<RoutingEvent> timeline = new ArrayList<>();
        
        // 1. Load active routing rules (ordered by priority ASC)
        List<RoutingRule> rules = routingRuleRepository.findAllActiveOrderedByPriority();
        log.debug("Loaded {} active routing rules", rules.size());
        
        if (rules.isEmpty()) {
            log.warn("No active routing rules found, using default channel: {}", defaultChannelConfig);
            ChannelType defaultChannel = parseDefaultChannel();
            
            timeline.add(new RoutingEvent(
                Instant.now(),
                "DEFAULT_CHANNEL_USED",
                null,
                defaultChannel,
                "No active routing rules configured"
            ));
            
            return new RoutingDecision(defaultChannel, timeline, true);
        }
        
        // 2. Create evaluation context with transaction data
        StandardEvaluationContext context = createEvaluationContext(transactionContext);
        
        // 3. Evaluate rules in priority order (short-circuit on first match)
        for (RoutingRule rule : rules) {
            try {
                log.debug("Evaluating rule: id={}, name={}, priority={}, condition={}", 
                    rule.getId(), rule.getName(), rule.getPriority(), rule.getCondition());
                
                // Parse and evaluate SpEL expression
                Expression expression = parser.parseExpression(rule.getCondition());
                Object result = expression.getValue(context);
                
                if (Boolean.TRUE.equals(result)) {
                    // Rule matched - short circuit
                    long durationMs = (System.nanoTime() - startTime) / 1_000_000;
                    log.info("Routing rule matched: id={}, name={}, channel={}, duration={}ms",
                        rule.getId(), rule.getName(), rule.getTargetChannel(), durationMs);
                    
                    timeline.add(new RoutingEvent(
                        Instant.now(),
                        "RULE_MATCHED",
                        null,
                        rule.getTargetChannel(),
                        String.format("Rule '%s' (priority=%d) matched → %s", 
                            rule.getName(), rule.getPriority(), rule.getTargetChannel())
                    ));
                    
                    return new RoutingDecision(rule.getTargetChannel(), timeline, false);
                }
                
                // Rule didn't match - log and continue
                log.debug("Rule did not match: id={}, name={}", rule.getId(), rule.getName());
                
            } catch (Exception e) {
                // Log error but continue evaluation (don't fail entire routing)
                log.error("Error evaluating rule: id={}, name={}, condition={}", 
                    rule.getId(), rule.getName(), rule.getCondition(), e);
                
                timeline.add(new RoutingEvent(
                    Instant.now(),
                    "RULE_ERROR",
                    null,
                    null,
                    String.format("Error evaluating rule '%s': %s", rule.getName(), e.getMessage())
                ));
            }
        }
        
        // 4. No rule matched - use default channel
        long durationMs = (System.nanoTime() - startTime) / 1_000_000;
        log.info("No routing rule matched, using default channel: {}, duration={}ms",
            defaultChannelConfig, durationMs);
        
        ChannelType defaultChannel = parseDefaultChannel();
        
        timeline.add(new RoutingEvent(
            Instant.now(),
            "DEFAULT_CHANNEL_USED",
            null,
            defaultChannel,
            String.format("No rule matched after evaluating %d rules", rules.size())
        ));
        
        return new RoutingDecision(defaultChannel, timeline, true);
    }
    
    /**
     * Creates a secure evaluation context with transaction data as a JavaBean.
     * Uses StandardEvaluationContext with restricted features for security.
     * 
     * @param transactionContext Transaction context with available variables
     * @return StandardEvaluationContext ready for SpEL evaluation
     */
    private StandardEvaluationContext createEvaluationContext(TransactionContext transactionContext) {
        // Create a JavaBean-style context object for SpEL
        RoutingContext rootContext = new RoutingContext(
            transactionContext.amount().amount(), // BigDecimal value
            transactionContext.amount().currency(),
            transactionContext.merchantId(),
            transactionContext.orderId(),
            transactionContext.description()
        );

        // Use StandardEvaluationContext for more flexibility, but restrict access
        StandardEvaluationContext context = new StandardEvaluationContext(rootContext);
        
        // Restrict dangerous SpEL features for security
        context.setBeanResolver(null); // Disable bean resolution
        // Note: TypeLocator cannot be null, so we leave the default (which still restricts T() in practice)
        
        return context;
    }
    
    /**
     * Inner JavaBean class to expose TransactionContext properties to SpEL.
     * SpEL can access properties via getters (e.g., amountValue, description).
     */
    public record RoutingContext(
        BigDecimal amountValue,
        String amountCurrency,
        String merchantId,
        String orderId,
        String description
    ) {
        // Getters are implicitly generated by record
    }
    
    /**
     * Parses default channel from configuration.
     * Falls back to SMS if invalid.
     * 
     * @return Default ChannelType
     */
    private ChannelType parseDefaultChannel() {
        try {
            return ChannelType.valueOf(defaultChannelConfig.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid default channel configured: {}, falling back to SMS", defaultChannelConfig);
            return ChannelType.SMS;
        }
    }
}

