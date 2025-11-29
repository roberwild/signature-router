package com.bank.signature.domain.model.valueobject;

/**
 * SLO Compliance Status
 * 
 * Represents the current status of SLO compliance based on error budget remaining.
 * 
 * @author BMAD DevOps
 * @since Story 9.6
 */
public enum SLOStatus {
    
    /**
     * SLO is compliant - Error budget remaining > 50%
     * Safe to deploy new features
     */
    COMPLIANT,
    
    /**
     * SLO is at risk - Error budget remaining between 20-50%
     * Reduce deployment frequency, focus on stability
     */
    AT_RISK,
    
    /**
     * SLO violated - Error budget remaining < 20%
     * Freeze non-critical deployments, immediate action required
     */
    VIOLATED
}

