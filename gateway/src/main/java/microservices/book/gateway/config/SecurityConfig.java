package microservices.book.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .authorizeExchange(exchanges -> exchanges
                // Allow CORS preflight requests
                .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public endpoints
                .pathMatchers("/challenges/**").permitAll()
                .pathMatchers("/leaders").permitAll()
                .pathMatchers("/actuator/**").permitAll()
                // Protected endpoints
                .pathMatchers("/attempts/**").authenticated()
                .pathMatchers("/users/**").authenticated()
                // Default: require authentication
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> {})
            );
        return http.build();
    }
}
