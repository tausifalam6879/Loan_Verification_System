package com.loan.VerificationSystem.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import jakarta.servlet.FilterChain;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class JwtAuthenticationFilterTest {
    @Test
    void publicLoginIgnoresOldTokenWithoutDatabaseLookup() throws Exception {
        JwtService jwt = mock(JwtService.class);
        CustomUserDetailsService users = mock(CustomUserDetailsService.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwt, users);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/users/login");
        request.setServletPath("/api/users/login");
        request.addHeader("Authorization", "Bearer expired-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
        verifyNoInteractions(jwt, users);
    }

    @Test
    void protectedRoutesStillRequireJwtProcessing() {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(mock(JwtService.class), mock(CustomUserDetailsService.class));
        for (String path : new String[]{"/api/users/me", "/api/users/session", "/api/users/login/other"}) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setServletPath(path);
            assertFalse(filter.shouldNotFilter(request));
        }
    }
}
