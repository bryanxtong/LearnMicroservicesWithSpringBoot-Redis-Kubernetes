package microservices.book.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class UserInfoHeaderFilter implements GlobalFilter, Ordered {

    private static final String USER_ALIAS_HEADER = "X-User-Alias";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
            .map(ctx -> ctx.getAuthentication())
            .filter(auth -> auth instanceof JwtAuthenticationToken)
            .cast(JwtAuthenticationToken.class)
            .map(JwtAuthenticationToken::getToken)
            .map(this::extractUsername)
            .map(username -> addUserHeader(exchange, username))
            .defaultIfEmpty(exchange)
            .flatMap(chain::filter);
    }

    private String extractUsername(Jwt jwt) {
        // Try preferred_username first, then fall back to sub
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null || username.isEmpty()) {
            username = jwt.getSubject();
        }
        return username;
    }

    private ServerWebExchange addUserHeader(ServerWebExchange exchange, String username) {
        ServerHttpRequest request = exchange.getRequest().mutate()
            .header(USER_ALIAS_HEADER, username)
            .build();
        return exchange.mutate().request(request).build();
    }

    @Override
    public int getOrder() {
        // Run after security filter
        return Ordered.LOWEST_PRECEDENCE - 1;
    }
}
