package com.loan.VerificationSystem.security;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

public final class TotpCrypto {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private TotpCrypto() {}
    public static byte[] secret() { byte[] bytes = new byte[20]; RANDOM.nextBytes(bytes); return bytes; }
    public static String base32(byte[] bytes) {
        StringBuilder result = new StringBuilder(); int buffer = 0, bits = 0;
        for (byte value : bytes) {
            buffer = (buffer << 8) | (value & 255); bits += 8;
            while (bits >= 5) { bits -= 5; result.append(ALPHABET.charAt((buffer >>> bits) & 31)); }
        }
        if (bits > 0) result.append(ALPHABET.charAt((buffer << (5 - bits)) & 31));
        return result.toString();
    }
    public static String code(byte[] secret, long step, int digits) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(secret, "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
            int offset = hash[hash.length - 1] & 15;
            int number = ByteBuffer.wrap(hash, offset, 4).getInt() & 0x7fffffff;
            int modulus = digits == 8 ? 100000000 : 1000000;
            return String.format(java.util.Locale.ROOT, "%0" + digits + "d", number % modulus);
        } catch (Exception error) { throw new IllegalStateException("Authenticator calculation unavailable"); }
    }
    public static long match(byte[] secret, String supplied, long now, long lastUsed) {
        if (supplied == null || !supplied.matches("[0-9]{6}")) return -1;
        long step = now / 30000;
        for (long candidate = step - 1; candidate <= step + 1; candidate++) {
            if (candidate > lastUsed && MessageDigest.isEqual(code(secret, candidate, 6).getBytes(StandardCharsets.US_ASCII), supplied.getBytes(StandardCharsets.US_ASCII))) return candidate;
        }
        return -1;
    }
    private static SecretKeySpec key(String master) throws Exception {
        Mac kdf = Mac.getInstance("HmacSHA256");
        kdf.init(new SecretKeySpec(master.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return new SecretKeySpec(kdf.doFinal("FinTrack/authenticator/encryption/v1".getBytes(StandardCharsets.UTF_8)), "AES");
    }
    public static String encrypt(byte[] secret, String master, Long userId) {
        try {
            byte[] nonce = new byte[12]; RANDOM.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(master), new GCMParameterSpec(128, nonce));
            cipher.updateAAD(userId.toString().getBytes(StandardCharsets.UTF_8));
            byte[] encrypted = cipher.doFinal(secret);
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(12 + encrypted.length).put(nonce).put(encrypted).array());
        } catch (Exception error) { throw new IllegalStateException("Authenticator storage unavailable"); }
    }
    public static byte[] decrypt(String value, String master, Long userId) {
        try {
            byte[] packed = Base64.getDecoder().decode(value);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(master), new GCMParameterSpec(128, packed, 0, 12));
            cipher.updateAAD(userId.toString().getBytes(StandardCharsets.UTF_8));
            return cipher.doFinal(packed, 12, packed.length - 12);
        } catch (Exception error) { throw new IllegalStateException("Authenticator key unavailable. Use email OTP recovery."); }
    }
}
