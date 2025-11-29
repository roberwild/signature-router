package com.bank.signature.infrastructure.config;

import org.apache.catalina.Context;
import org.apache.catalina.connector.Connector;
import org.apache.tomcat.util.descriptor.web.SecurityCollection;
import org.apache.tomcat.util.descriptor.web.SecurityConstraint;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * HTTP → HTTPS redirect configuration.
 * Story 8.6: TLS Certificate Management
 * 
 * <p><b>Redirect Behavior:</b></p>
 * <ul>
 *   <li>HTTP port 8080 → HTTPS port 8443</li>
 *   <li>All paths (/*) require HTTPS (CONFIDENTIAL)</li>
 *   <li>Only enabled in production and UAT profiles</li>
 * </ul>
 * 
 * <p><b>Compliance:</b></p>
 * <ul>
 *   <li>PCI-DSS Req 4.2: Strong cryptography for transmission</li>
 *   <li>SOC 2 CC6.6: Encryption of data</li>
 * </ul>
 * 
 * @since Story 8.6
 */
@Configuration
@Profile({"prod", "uat"})
public class HttpsRedirectConfig {
    
    /**
     * Configures Tomcat to redirect HTTP traffic to HTTPS.
     * 
     * @return Configured ServletWebServerFactory with HTTP → HTTPS redirect
     */
    @Bean
    public ServletWebServerFactory servletContainer() {
        TomcatServletWebServerFactory tomcat = new TomcatServletWebServerFactory() {
            @Override
            protected void postProcessContext(Context context) {
                SecurityConstraint securityConstraint = new SecurityConstraint();
                securityConstraint.setUserConstraint("CONFIDENTIAL");
                
                SecurityCollection collection = new SecurityCollection();
                collection.addPattern("/*");
                
                securityConstraint.addCollection(collection);
                context.addConstraint(securityConstraint);
            }
        };
        
        // Add HTTP connector (port 8080) that redirects to HTTPS (port 8443)
        tomcat.addAdditionalTomcatConnectors(redirectConnector());
        return tomcat;
    }
    
    /**
     * Creates HTTP connector that redirects to HTTPS port.
     * 
     * @return HTTP connector configured for redirect
     */
    private Connector redirectConnector() {
        Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
        connector.setScheme("http");
        connector.setPort(8080);
        connector.setSecure(false);
        connector.setRedirectPort(8443);
        return connector;
    }
}

