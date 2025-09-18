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

public class LoginActivity extends AppCompatActivity {

    private TextInputLayout ilEmail, ilPassword;
    private TextInputEditText etEmail, etPassword;
    private MaterialButton btnLogin;
    private View progress;

    private ExecutorService io;
    private SupabaseAuthService supabase;
    private SessionManager session;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        ilEmail = findViewById(R.id.ilEmail);
        ilPassword = findViewById(R.id.ilPassword);
        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        progress = findViewById(R.id.progress);

        io = Executors.newSingleThreadExecutor();
        supabase = new SupabaseAuthService(this);
        session = new SessionManager(this);

        btnLogin.setOnClickListener(v -> tryLogin());
        findViewById(R.id.tvGoSignup).setOnClickListener(v ->
                startActivity(new Intent(LoginActivity.this, SignupActivity.class))
        );
        findViewById(R.id.tvForgot).setOnClickListener(v ->
                startActivity(new Intent(LoginActivity.this, ForgotPassword.class))
        );
    }

    private void tryLogin() {
        String email = safeText(etEmail);
        String password = safeText(etPassword);

        boolean ok = true;
        ilEmail.setError(null);
        ilPassword.setError(null);

        if (!validEmail(email)) {
            ilEmail.setError("E-mail inválido");
            ok = false;
        }
        if (TextUtils.isEmpty(password)) {
            ilPassword.setError("Informe a senha");
            ok = false;
        }
        if (!ok) return;

        setLoading(true);
        io.execute(() -> {
            try {
                SupabaseAuthService.AuthResponse resp = supabase.signInWithPassword(email, password);
                if (resp != null && resp.isValid()) {
                    session.save(resp.accessToken, resp.refreshToken, email);
                    runOnUiThread(() -> {
                        // Sucesso
                        StatusBanner.show(this, StatusBanner.State.SUCCESS,
                                "Login realizado", "Bem-vindo(a) de volta!", 1500);
                        startActivity(new Intent(this, MainActivity.class));
                        finish();
                    });
                } else {
                    failUi("Credenciais inválidas.");
                }
            } catch (IOException e) {
                failUi("Falha de rede: " + e.getMessage());
            } catch (Exception e) {
                failUi("Erro: " + e.getMessage());
            } finally {
                runOnUiThread(() -> setLoading(false));
            }
        });
    }

    private void failUi(String msg) {
        runOnUiThread(() -> StatusBanner.show(
                this, StatusBanner.State.ERROR, "Não foi possível entrar", msg, 3000
        ));
    }

    private String safeText(TextInputEditText et) {
        return et.getText() != null ? et.getText().toString().trim() : "";
    }

    private boolean validEmail(String email) {
        return !TextUtils.isEmpty(email) && Patterns.EMAIL_ADDRESS.matcher(email).matches();
    }

    private void setLoading(boolean b) {
        btnLogin.setEnabled(!b);
        progress.setVisibility(b ? View.VISIBLE : View.GONE);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (io != null) io.shutdownNow();
    }
}
