package com.loan.VerificationSystem.repository;

import com.loan.VerificationSystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from User u where u.email = :email")
    User lockByEmail(@org.springframework.data.repository.query.Param("email") String email);
    User findByEmail(String email);

    User findByMobile(String mobile);
}
