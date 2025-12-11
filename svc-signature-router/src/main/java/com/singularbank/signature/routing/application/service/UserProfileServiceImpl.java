package com.singularbank.signature.routing.application.service;

import com.singularbank.signature.routing.domain.model.entity.UserProfile;
import com.singularbank.signature.routing.domain.port.outbound.UserProfileRepository;
import com.singularbank.signature.routing.domain.model.valueobject.UUIDGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Implementation of UserProfileService.
 * 
 * <p>Manages user profiles based on login events. Profiles are created
 * when a user logs in for the first time and updated on subsequent logins.</p>
 * 
 * @since Story 14.2 - Users Page Backend Integration
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {
    
    private final UserProfileRepository userProfileRepository;
    
    @Override
    @Transactional
    public UserProfile recordLogin(
        String keycloakId,
        String username,
        String email,
        String fullName,
        String firstName,
        String lastName,
        Set<String> roles,
        String ipAddress
    ) {
        log.debug("Recording login for user: {} (keycloakId: {})", username, keycloakId);
        
        Instant now = Instant.now();
        
        // Try to find existing profile
        Optional<UserProfile> existingProfile = userProfileRepository.findByKeycloakId(keycloakId);
        
        UserProfile profile;
        if (existingProfile.isPresent()) {
            // Update existing profile
            profile = existingProfile.get();
            profile.setUsername(username);
            profile.setEmail(email);
            profile.setFullName(fullName);
            profile.setFirstName(firstName);
            profile.setLastName(lastName);
            profile.setRoles(roles);
            profile.setLastLoginAt(now);
            profile.setLoginCount(profile.getLoginCount() + 1);
            profile.setLastLoginIp(ipAddress);
            profile.setActive(true);
            profile.setUpdatedAt(now);
            
            log.info("Updated profile for user: {} (login #{})", username, profile.getLoginCount());
        } else {
            // Create new profile
            profile = UserProfile.builder()
                .id(UUIDGenerator.generateV7())
                .keycloakId(keycloakId)
                .username(username)
                .email(email)
                .fullName(fullName)
                .firstName(firstName)
                .lastName(lastName)
                .roles(roles)
                .active(true)
                .firstLoginAt(now)
                .lastLoginAt(now)
                .loginCount(1)
                .lastLoginIp(ipAddress)
                .createdAt(now)
                .updatedAt(now)
                .build();
            
            log.info("Created new profile for user: {}", username);
        }
        
        return userProfileRepository.save(profile);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserProfile> getById(UUID id) {
        return userProfileRepository.findById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Optional<UserProfile> getByKeycloakId(String keycloakId) {
        return userProfileRepository.findByKeycloakId(keycloakId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<UserProfile> getAll(Pageable pageable) {
        return userProfileRepository.findAll(pageable);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserProfile> getAllUsers() {
        return userProfileRepository.findAll();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserProfile> getAllActive() {
        return userProfileRepository.findAllActive();
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<UserProfile> search(String searchTerm, Pageable pageable) {
        return userProfileRepository.search(searchTerm, pageable);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserStats getStats() {
        long total = userProfileRepository.count();
        long active = userProfileRepository.countActive();
        long admins = userProfileRepository.countByRole("admin") + 
                      userProfileRepository.countByRole("ADMIN") +
                      userProfileRepository.countByRole("signature-admin");
        long operators = userProfileRepository.countByRole("operator") +
                         userProfileRepository.countByRole("OPERATOR") +
                         userProfileRepository.countByRole("signature-operator");
        long viewers = userProfileRepository.countByRole("viewer") +
                       userProfileRepository.countByRole("VIEWER") +
                       userProfileRepository.countByRole("signature-viewer");
        
        return new UserStats(total, active, admins, operators, viewers);
    }
}

