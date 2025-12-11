package com.singularbank.signature.routing.domain.exception;

/**
 * Exception thrown when an entity is not found.
 * Story 2.2: Routing Rules - CRUD API
 */
public class NotFoundException extends DomainException {
    
    public NotFoundException(String entityType, Object identifier) {
        super(String.format("%s not found with id: %s", entityType, identifier), "NOT_FOUND");
    }
    
    public NotFoundException(String message) {
        super(message, "NOT_FOUND");
    }
}
