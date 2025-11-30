package com.bank.signature.domain.exception;

/**
 * Exception thrown when an entity is not found.
 * Story 2.2: Routing Rules - CRUD API
 */
public class NotFoundException extends DomainException {
    
    public NotFoundException(String entityType, Object identifier) {
        super("NOT_FOUND", String.format("%s not found with id: %s", entityType, identifier));
    }
    
    public NotFoundException(String message) {
        super("NOT_FOUND", message);
    }
}
