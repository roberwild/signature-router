package com.bank.signature.infrastructure.adapter.outbound.spel;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Test context POJO for SpEL validation.
 * SimpleEvaluationContext.forReadOnlyDataBinding() can access properties of POJOs,
 * but NOT properties of Maps (even with public getters).
 * 
 * @since Epic 17 - SpEL Validation Fix
 */
@Data
@AllArgsConstructor
public class TransactionTestContext {
    private Amount amount;
    private String merchantId;
    private String orderId;
    private String description;
    
    @Data
    @AllArgsConstructor
    public static class Amount {
        private BigDecimal value;
        private String currency;
    }
}

