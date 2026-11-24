package com.cinema.cinema_backend.config;

import jakarta.servlet.DispatcherType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.http.HttpMethod;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        PathPatternRequestMatcher.Builder paths = PathPatternRequestMatcher.withDefaults();

        RequestMatcher registerRequest = paths.matcher(HttpMethod.POST, "/api/auth/register");
        RequestMatcher loginRequest = paths.matcher(HttpMethod.POST, "/api/auth/login");
        RequestMatcher refreshRequest = paths.matcher(HttpMethod.POST, "/api/auth/refresh");
        RequestMatcher csrfRequest = paths.matcher(HttpMethod.GET, "/api/auth/csrf");
        RequestMatcher logoutRequest = paths.matcher(HttpMethod.POST, "/api/auth/logout");

        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthoritiesClaimName("role");
        authoritiesConverter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);

        return http
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(registerRequest, loginRequest, refreshRequest, csrfRequest, logoutRequest)
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/movies/now-showing").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/movie-posters/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/movies/{movieId:[0-9]+}").permitAll()
                        .anyRequest().authenticated()
                )
                .csrf(csrf -> csrf.ignoringRequestMatchers(registerRequest, loginRequest))
                .formLogin(Customizer.withDefaults())
                .httpBasic(Customizer.withDefaults())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                )
                .build();
    }
}