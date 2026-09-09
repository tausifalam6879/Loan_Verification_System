package com.loan.VerificationSystem.security;
import org.junit.jupiter.api.Test;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.*;

class TotpCryptoTest {
    private final byte[] secret = "12345678901234567890".getBytes(StandardCharsets.US_ASCII);
    @Test void matchesRfc6238Sha1Vectors() {
        long[] times={59,1111111109,1111111111,1234567890,2000000000,20000000000L};
        String[] expected={"94287082","07081804","14050471","89005924","69279037","65353130"};
        for(int i=0;i<times.length;i++) assertEquals(expected[i],TotpCrypto.code(secret,times[i]/30,8));
        assertEquals("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",TotpCrypto.base32(secret));
    }
    @Test void rejectsReplayInvalidAndExpiredCodes() {
        long now=1234567890000L, step=now/30000;
        String code=TotpCrypto.code(secret,step,6);
        assertEquals(step,TotpCrypto.match(secret,code,now,-1));
        assertEquals(-1,TotpCrypto.match(secret,code,now,step));
        assertEquals(-1,TotpCrypto.match(secret,code,now+90000,-1));
        assertEquals(-1,TotpCrypto.match(secret,"abcdef",now,-1));
        assertEquals(-1,TotpCrypto.match(secret,null,now,-1));
        assertEquals(step-1,TotpCrypto.match(secret,TotpCrypto.code(secret,step-1,6),now,-1));
    }
    @Test void encryptedSecretsAreRandomizedAndBoundToAccount() {
        String master="test-only-strong-master-key-not-production";
        String encrypted=TotpCrypto.encrypt(secret,master,1L);
        assertNotEquals(encrypted,TotpCrypto.encrypt(secret,master,1L));
        assertArrayEquals(secret,TotpCrypto.decrypt(encrypted,master,1L));
        assertThrows(IllegalStateException.class,()->TotpCrypto.decrypt(encrypted,master,2L));
        assertThrows(IllegalStateException.class,()->TotpCrypto.decrypt(encrypted,"other-key",1L));
    }
}
