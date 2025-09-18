package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Patterns;
import android.view.View;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import com.example.aplicativocomedoriadatia.ui.StatusBanner;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SignupActivity extends AppCompatActivity {

    private TextInputLayout ilName, ilEmail, ilPassword, ilPassword2;
    private TextInputEditText etName, etEmail, etPassword, etPassword2;
    private MaterialButton btnSignup;
    private View progress;

    private ExecutorService io;
    private SupabaseAuthService supabase;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);

        ilName = findViewById(R.id.ilName);
        ilEmail = findViewById(R.id.ilEmail);
        ilPassword = findViewById(R.id.ilPassword);
        ilPassword2 = findViewById(R.id.ilPassword2);
        etName = findViewById(R.id.etName);
        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        etPassword2 = findViewById(R.id.etPassword2);
        btnSignup = findViewById(R.id.btnSignup);
        progress = findViewById(R.id.progress);

        io = Executors.newSingleThreadExecutor();
        supabase = new SupabaseAuthService(this);

        btnSignup.setOnClickListener(v -> trySignup());
        findViewById(R.id.tvGoLogin).setOnClickListener(v ->
                startActivity(new Intent(this, LoginActivity.class))
        );
    }

    private void trySignup() {
        String name = safe(etName);
        String email = safe(etEmail);
        String pass = safe(etPassword);
        String pass2 = safe(etPassword2);

        clearErrors();
        boolean ok = true;

        if (TextUtils.isEmpty(name)) { ilName.setError("Informe seu nome"); ok = false; }
        if (!validEmail(email)) { ilEmail.setError("E-mail inválido"); ok = false; }
        if (TextUtils.isEmpty(pass) || pass.length() < 6) { ilPassword.setError("Mínimo 6 caracteres"); ok = false; }
        if (!pass.equals(pass2)) { ilPassword2.setError("As senhas não coincidem"); ok = false; }
        if (!ok) return;

        setLoading(true);
        io.execute(() -> {
            try {
                SupabaseAuthService.AuthResponse resp = supabase.signUpWithEmail(email, pass, name);

                runOnUiThread(() -> {
                    StatusBanner.show(this, StatusBanner.State.SUCCESS,
                            "Cadastro criado", "Verifique seu e-mail para confirmar.", 2800);
                    startActivity(new Intent(this, LoginActivity.class));
                    finish();
                });

            } catch (IOException e) {
                String raw = (e.getMessage() != null) ? e.getMessage() : "Falha de rede.";
                if (raw.contains("User already registered") || raw.contains("already registered")) {
                    failUi("Este e-mail já está cadastrado. Faça login.");
                } else if (raw.contains("rate limit") || raw.contains("Too Many Requests")) {
                    failUi("Muitas tentativas. Tente novamente em instantes.");
                } else {
                    failUi("Não foi possível criar sua conta: " + raw);
                }
            } catch (Exception e) {
                failUi("Erro: " + e.getMessage());
            } finally {
                runOnUiThread(() -> setLoading(false));
            }
        });
    }

    private void clearErrors() {
        ilName.setError(null);
        ilEmail.setError(null);
        ilPassword.setError(null);
        ilPassword2.setError(null);
    }

    private String safe(TextInputEditText et) {
        return et.getText() != null ? et.getText().toString().trim() : "";
    }

    private boolean validEmail(String email) {
        return !TextUtils.isEmpty(email) && Patterns.EMAIL_ADDRESS.matcher(email).matches();
    }

    private void setLoading(boolean b) {
        btnSignup.setEnabled(!b);
        progress.setVisibility(b ? View.VISIBLE : View.GONE);
    }

    private void failUi(String msg) {
        runOnUiThread(() -> StatusBanner.show(
                this, StatusBanner.State.ERROR, "Não foi possível cadastrar", msg, 4000
        ));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (io != null) io.shutdownNow();
    }
}
