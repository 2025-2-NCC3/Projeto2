package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

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

        // Clique do botão de enviar
        btnResetPassword.setOnClickListener(v -> {
            String email = etEmail.getText().toString().trim();

            if (email.isEmpty()) {
                Toast.makeText(ForgotPassword.this, "Digite seu e-mail", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(ForgotPassword.this,
                        "Se o e-mail existir, enviaremos o link de recuperação",
                        Toast.LENGTH_LONG).show();
            }
        });

        // 🔹 Clique em "Voltar ao login"
        tvBackToLogin.setOnClickListener(v -> {
            Intent intent = new Intent(ForgotPassword.this, LoginActivity.class);
            startActivity(intent);
            finish(); // fecha a tela atual
        });
    }
}
