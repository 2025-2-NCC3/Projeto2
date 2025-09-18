package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.example.aplicativocomedoriadatia.ui.StatusBanner;

public class ForgotPassword extends AppCompatActivity {

    private EditText etEmail;
    private Button btnResetPassword;
    private TextView tvBackToLogin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forgot_password);

        etEmail = findViewById(R.id.etEmail);
        btnResetPassword = findViewById(R.id.btnResetPassword);
        tvBackToLogin = findViewById(R.id.tvBackToLogin);

        btnResetPassword.setOnClickListener(v -> {
            String email = etEmail.getText().toString().trim();

            if (email.isEmpty()) {
                StatusBanner.show(this, StatusBanner.State.ERROR,
                        "E-mail obrigatório", "Digite seu e-mail para continuar.", 3000);
            } else {
                // Aqui você pode integrar com Supabase reset password, se desejar.
                StatusBanner.show(this, StatusBanner.State.SUCCESS,
                        "Verifique seu e-mail", "Se o e-mail existir, enviaremos o link de recuperação.", 3500);
            }
        });

        tvBackToLogin.setOnClickListener(v -> {
            Intent intent = new Intent(ForgotPassword.this, LoginActivity.class);
            startActivity(intent);
            finish();
        });
    }
}
