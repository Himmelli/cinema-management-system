package com.cinema.cinema_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration
@Profile("dev")
public class DevSwaggerLoginConfig {

    @Bean
    public UserDetailsService devSwaggerUsers(
            PasswordEncoder passwordEncoder,
            @Value("${DEV_SWAGGER_PASSWORD}") String password
    ) {
        return new InMemoryUserDetailsManager(
                User.withUsername("swagger-dev")
                        .password(passwordEncoder.encode(password))
                        .roles("DEV")
                        .build()
        );
    }
}