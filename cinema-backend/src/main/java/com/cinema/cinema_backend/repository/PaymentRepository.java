package com.cinema.cinema_backend.repository;

import com.cinema.cinema_backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
}