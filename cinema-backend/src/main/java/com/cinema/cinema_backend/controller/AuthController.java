package com.cinema.cinema_backend.controller;

import com.cinema.cinema_backend.dto.request.LoginRequest;
import com.cinema.cinema_backend.dto.request.RegisterRequest;
import com.cinema.cinema_backend.dto.response.ApiResponse;
import com.cinema.cinema_backend.dto.response.LoginResponse;
import com.cinema.cinema_backend.dto.response.RegisterResponse;
import com.cinema.cinema_backend.dto.response.UserResponse;
import com.cinema.cinema_backend.entity.User;
import com.cinema.cinema_backend.service.AuthService;
import com.cinema.cinema_backend.service.JwtService;
import com.cinema.cinema_backend.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final boolean secureRefreshCookie;

    public AuthController(
            AuthService authService,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            @Value("${app.auth.refresh-cookie-secure:true}") boolean secureRefreshCookie
    ) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.secureRefreshCookie = secureRefreshCookie;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return new ApiResponse<>(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        User user = authService.authenticate(request);
        Jwt accessToken = jwtService.issueAccessToken(user);
        String refreshToken = refreshTokenService.issueFor(user);

        return tokenResponse(accessToken, refreshToken);
    }

    @GetMapping("/csrf")
    public ResponseEntity<ApiResponse<Map<String, String>>> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(new ApiResponse<>(Map.of(
                        "headerName", csrfToken.getHeaderName(),
                        "token", csrfToken.getToken()
                )));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken
    ) {
        RefreshTokenService.RotatedRefreshToken rotated = refreshTokenService
                .rotate(refreshToken)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid or expired refresh token."
                ));

        Jwt accessToken = jwtService.issueAccessToken(rotated.user());

        return tokenResponse(accessToken, rotated.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "refresh_token", required = false) String refreshToken
    ) {
        refreshTokenService.revokeSession(refreshToken);

        ResponseCookie expiredCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(secureRefreshCookie)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(0)
                .build();

        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.SET_COOKIE, expiredCookie.toString())
                .build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('MEMBER', 'STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> me(
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = Long.valueOf(jwt.getSubject());
        UserResponse response = authService.getCurrentUser(userId);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(new ApiResponse<>(response));
    }

    private ResponseEntity<ApiResponse<LoginResponse>> tokenResponse(
            Jwt accessToken,
            String refreshToken
    ) {
        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(secureRefreshCookie)
                .sameSite("Strict")
                .path("/api/auth")
                .build();

        LoginResponse response = new LoginResponse(
                accessToken.getTokenValue(),
                "Bearer",
                accessToken.getExpiresAt()
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(new ApiResponse<>(response));
    }
}