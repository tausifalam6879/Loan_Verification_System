package com.loan.VerificationSystem.service;

import com.loan.VerificationSystem.dto.LoginRequestDTO;
import com.loan.VerificationSystem.dto.LoginResponseDTO;
import com.loan.VerificationSystem.dto.OtpRequestDTO;
import com.loan.VerificationSystem.dto.OtpResponseDTO;
import com.loan.VerificationSystem.dto.OtpVerifyRequestDTO;
import com.loan.VerificationSystem.dto.UserRequestDTO;
import com.loan.VerificationSystem.dto.UserProfileUpdateDTO;
import com.loan.VerificationSystem.dto.UserResponseDTO;
import com.loan.VerificationSystem.entity.User;
import com.loan.VerificationSystem.repository.UserRepository;
import com.loan.VerificationSystem.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final EmailNotificationService emailNotificationService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       OtpService otpService,
                       EmailNotificationService emailNotificationService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.emailNotificationService = emailNotificationService;
    }

    public UserResponseDTO registerUser(UserRequestDTO request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedMobile = normalizeMobile(request.getMobile());

        if (hasText(request.getOtpToken())) {
            otpService.validateToken(normalizedEmail, normalizedMobile, "REGISTER", request.getOtpToken(), tokenChannel(normalizeChannel(request.getOtpChannel())));
        }

        User existingUser = userRepository.findByEmail(normalizedEmail);

        if (existingUser != null) {
            throw new RuntimeException("Email already registered");
        }

        if (hasText(normalizedMobile) && userRepository.findByMobile(normalizedMobile) != null) {
            throw new RuntimeException("Mobile number already registered");
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(normalizedEmail);
        user.setMobile(hasText(normalizedMobile) ? normalizedMobile : null);
        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setRole("USER");

        User savedUser = userRepository.save(user);
        emailNotificationService.send(
                savedUser.getEmail(),
                "FinTrack account created",
                "Your FinTrack account has been created successfully."
        );

        return mapToResponse(savedUser);
    }

    public LoginResponseDTO loginUser(LoginRequestDTO request) {
        String channel = normalizeChannel(request.getChannel());
        User user = findUserForLogin(request, channel);

        if (user == null) {
            throw new RuntimeException("Invalid email or password");
        }

        if (hasText(request.getOtpToken())) {
            otpService.validateToken(normalizeEmail(request.getEmail()), normalizeMobile(request.getMobile()), "LOGIN", request.getOtpToken(), tokenChannel(channel));
            return buildLoginResponse(user);
        }

        if (!hasText(request.getPassword())) {
            throw new RuntimeException("Password or verified OTP is required");
        }

        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!matches) {
            throw new RuntimeException("Invalid email or password");
        }

        return buildLoginResponse(user);
    }

    private LoginResponseDTO buildLoginResponse(User user) {
        String token = jwtService.generateToken(user.getEmail());

        return new LoginResponseDTO(
                token,
                user.getEmail(),
                user.getRole()
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    public OtpResponseDTO requestOtp(OtpRequestDTO request) {
        ensureOtpIdentityAllowed(request.getEmail(), request.getMobile(), request.getPurpose(), request.getChannel());
        OtpService.OtpDeliveryResult delivery = otpService.sendOtp(
                normalizeEmail(request.getEmail()),
                normalizeMobile(request.getMobile()),
                request.getPurpose(),
                request.getChannel()
        );
        String message;
        if (!delivery.otpRequired()) {
            message = "OTP is disabled. Start backend with APP_OTP_ENABLED=true to enable OTP verification.";
        } else if (delivery.deliveryChannel().startsWith("console")) {
            message = "OTP generated in development mode. Use OTP " + delivery.developmentOtp() + " or check backend log.";
        } else {
            message = "OTP sent via " + delivery.deliveryChannel() + ".";
        }
        return new OtpResponseDTO(message, delivery.otpRequired(), null, delivery.deliveryChannel(), delivery.developmentOtp());
    }

    public OtpResponseDTO verifyOtp(OtpVerifyRequestDTO request) {
        ensureOtpIdentityAllowed(request.getEmail(), request.getMobile(), request.getPurpose(), request.getChannel());
        String token = otpService.verifyOtp(
                normalizeEmail(request.getEmail()),
                normalizeMobile(request.getMobile()),
                request.getPurpose(),
                request.getOtp(),
                request.getChannel()
        );
        String message = otpService.isOtpEnabled()
                ? "OTP verified."
                : "OTP is disabled for this environment.";
        return new OtpResponseDTO(message, otpService.isOtpEnabled(), token, normalizeChannel(request.getChannel()).toLowerCase(), null);
    }

    public boolean isOtpEnabled() {
        return otpService.isOtpEnabled();
    }

    public UserResponseDTO getCurrentUser() {
        return mapToResponse(getAuthenticatedUser());
    }

    public UserResponseDTO updateCurrentUser(UserProfileUpdateDTO request) {
        User user = getAuthenticatedUser();
        String normalizedMobile = normalizeMobile(request.getMobile());

        if (hasText(normalizedMobile)) {
            User mobileOwner = userRepository.findByMobile(normalizedMobile);
            if (mobileOwner != null && !mobileOwner.getId().equals(user.getId())) {
                throw new RuntimeException("Mobile number already registered");
            }
        }

        user.setFullName(request.getFullName().trim());
        user.setMobile(hasText(normalizedMobile) ? normalizedMobile : null);
        return mapToResponse(userRepository.save(user));
    }

    private UserResponseDTO mapToResponse(User user) {

        UserResponseDTO response = new UserResponseDTO();

        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setMobile(user.getMobile());
        response.setRole(user.getRole());
        response.setTotalApplications((long) user.getLoanApplications().size());
        response.setCreditScore(user.getLoanApplications().stream()
                .map(com.loan.VerificationSystem.entity.LoanApplication::getCreditScore)
                .filter(java.util.Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(null));

        return response;
    }

    private User findUserForLogin(LoginRequestDTO request, String channel) {
        if ("MOBILE".equals(channel) || "WHATSAPP".equals(channel)) {
            return userRepository.findByMobile(normalizeMobile(request.getMobile()));
        }

        return userRepository.findByEmail(normalizeEmail(request.getEmail()));
    }

    private void ensureOtpIdentityAllowed(String email, String mobile, String purpose, String channel) {
        String normalizedPurpose = purpose == null ? "" : purpose.trim().toUpperCase(java.util.Locale.ROOT);
        if (!"LOGIN".equals(normalizedPurpose) && !"REGISTER".equals(normalizedPurpose)) {
            return;
        }

        String normalizedChannel = normalizeChannel(channel);
        User user;
        if ("MOBILE".equals(normalizedChannel) || "WHATSAPP".equals(normalizedChannel)) {
            String normalizedMobile = normalizeMobile(mobile);
            user = hasText(normalizedMobile) ? userRepository.findByMobile(normalizedMobile) : null;
        } else {
            String normalizedEmail = normalizeEmail(email);
            user = hasText(normalizedEmail) ? userRepository.findByEmail(normalizedEmail) : null;
        }

        if ("LOGIN".equals(normalizedPurpose) && user == null) {
            throw new RuntimeException("Unable to process OTP for the provided login details");
        }
        if ("REGISTER".equals(normalizedPurpose) && user != null) {
            String identityLabel = "EMAIL".equals(normalizedChannel) ? "Email" : "Mobile number";
            throw new RuntimeException(identityLabel + " already registered. Please use Login instead.");
        }
    }

    private User getAuthenticatedUser() {
        String email = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("Authenticated user not found");
        }
        return user;
    }

    private String normalizeChannel(String channel) {
        String normalized = channel == null ? "PASSWORD" : channel.trim().toUpperCase();
        if ("EMAILOTP".equals(normalized) || "EMAIL_OTP".equals(normalized)) {
            return "EMAIL";
        }
        return normalized;
    }

    private String tokenChannel(String channel) {
        if ("MOBILE".equals(channel)) {
            return "MOBILE";
        }
        if ("WHATSAPP".equals(channel)) {
            return "WHATSAPP";
        }
        return "EMAIL";
    }

    private String normalizeMobile(String mobile) {
        return mobile == null ? "" : mobile.replaceAll("[\\s-]", "");
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
