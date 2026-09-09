package com.loan.VerificationSystem.service;
import com.loan.VerificationSystem.entity.*;
import com.loan.VerificationSystem.repository.*;
import com.loan.VerificationSystem.security.TotpCrypto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthenticatorServiceTest {
    private final AuthenticatorRepository repository=mock(AuthenticatorRepository.class);
    private final UserRepository users=mock(UserRepository.class);
    private final PasswordEncoder passwords=mock(PasswordEncoder.class);
    private final String master="test-only-strong-master-not-production";
    private final AuthenticatorService service=new AuthenticatorService(repository,users,passwords,master);
    private final User user=new User();
    private final AuthenticatorCredential credential=new AuthenticatorCredential();
    private final byte[] secret=TotpCrypto.secret();
    @BeforeEach void setup() {
        user.setId(1L);user.setEmail("test@example.com");user.setPassword("hash");
        when(users.lockByEmail(user.getEmail())).thenReturn(user);
        when(users.findByEmail(user.getEmail())).thenReturn(user);
        when(passwords.matches("correct","hash")).thenReturn(true);
        credential.setUserId(1L);credential.setEncryptedSecret(TotpCrypto.encrypt(secret,master,1L));
        credential.setPendingUntil(System.currentTimeMillis()+600000);
        when(repository.findById(1L)).thenReturn(Optional.of(credential));
    }
    @Test void enrollmentRequiresPasswordAndDoesNotEnableUntilConfirmed() {
        assertThrows(IllegalArgumentException.class,()->service.begin(user.getEmail(),"wrong"));
        var response=service.begin(user.getEmail(),"correct");
        assertNotNull(response.get("setupKey"));assertFalse(credential.isEnabled());
        byte[] actual=TotpCrypto.decrypt(credential.getEncryptedSecret(),master,1L);
        assertTrue(service.verify(user.getEmail(),TotpCrypto.code(actual,System.currentTimeMillis()/30000,6),true));
        assertTrue(credential.isEnabled());
        assertThrows(IllegalArgumentException.class,()->service.begin(user.getEmail(),"correct"));
    }
    @Test void expiredEnrollmentCannotBeConfirmed() {
        credential.setPendingUntil(1);
        assertFalse(service.verify(user.getEmail(),TotpCrypto.code(secret,System.currentTimeMillis()/30000,6),true));
        assertFalse(credential.isEnabled());
    }
    @Test void wrongCodesLockAndValidCodeIsConsumed() {
        credential.setEnabled(true);
        for(int i=0;i<5;i++) assertFalse(service.verify(user.getEmail(),"bad",false));
        assertTrue(credential.getLockedUntil()>System.currentTimeMillis());
        String code=TotpCrypto.code(secret,System.currentTimeMillis()/30000,6);
        assertFalse(service.verify(user.getEmail(),code,false));
        credential.setLockedUntil(0);
        assertTrue(service.verify(user.getEmail(),code,false));
        assertFalse(service.verify(user.getEmail(),code,false));
        verify(repository,atLeast(6)).save(credential);
    }
}
