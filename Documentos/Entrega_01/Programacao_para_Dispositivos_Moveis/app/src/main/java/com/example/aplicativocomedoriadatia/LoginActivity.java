package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.os.Bundle;
import android.util.Patterns;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
// Remova EdgeToEdge se sua lib estiver desatualizada para evitar NoSuchMethodError
// import androidx.activity.EdgeToEdge;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

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
        // FORÇA TEMA CLARO (evita variações por tema)
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // ====== BINDINGS (garante que IDs existem) ======
        ilEmail   = findViewById(R.id.ilEmail);
        ilPassword= findViewById(R.id.ilPassword);
        etEmail   = findViewById(R.id.etEmail);
        etPassword= findViewById(R.id.etPassword);
        btnLogin  = findViewById(R.id.btnLogin);
        progress  = findViewById(R.id.progress);

        if (ilEmail == null || ilPassword == null || etEmail == null || etPassword == null || btnLogin == null) {
            toast("Erro de layout: IDs não encontrados em activity_login.xml");
            return;
        }
        if (progress == null) {
            // evita NPE se não tiver ProgressBar (opcional)
            progress = new View(this);
        }

        // ====== INIT SAFE ======
        io = Executors.newSingleThreadExecutor();
        try {
            supabase = new SupabaseAuthService(this);
        } catch (Throwable t) {
            toast("Falha ao iniciar serviço de auth: " + t.getMessage());
        }
        session = new SessionManager(this);

        // ====== LISTENERS ======
        btnLogin.setOnClickListener(v -> tryLogin());

        View tvGoSignup = findViewById(R.id.tvGoSignup);
        if (tvGoSignup != null) {
            tvGoSignup.setOnClickListener(v -> startActivity(new Intent(this, SignupActivity.class)));
        }
        View tvForgot = findViewById(R.id.tvForgot);
        if (tvForgot != null) {
            tvForgot.setOnClickListener(v -> startActivity(new Intent(this, ForgotPassword.class)));
        }
    }

    private void tryLogin() {
        String email = textOf(etEmail);
        String password = textOf(etPassword);

        ilEmail.setError(null);
        ilPassword.setError(null);

        boolean ok = true;
        if (email.isEmpty() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            ilEmail.setError("E-mail inválido");
            ok = false;
        }
        if (password.isEmpty()) {
            ilPassword.setError("Informe a senha");
            ok = false;
        }
        if (!ok) return;

        setLoading(true);

        io.execute(() -> {
            try {
                // Protege contra supabase nulo
                if (supabase == null) {
                    failUi("Serviço de autenticação não inicializado.");
                    return;
                }

                SupabaseAuthService.AuthResponse resp = supabase.signInWithPassword(email, password);

                if (resp != null && resp.isValid()) {
                    session.save(resp.accessToken, resp.refreshToken, email);
                    runOnUiThread(() -> {
                        toast("Login realizado com sucesso!");
                        // NAVEGA PARA HOME (limpando a pilha)
                        Intent i = new Intent(this, HomeActivity.class);
                        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(i);
                        finish();
                    });
                } else {
                    failUi("Credenciais inválidas, tente novamente.");
                }

            } catch (Exception e) {
                // Qualquer exceção aqui não derruba o app
                failUi("Erro no login: " + e.getMessage());
            } finally {
                runOnUiThread(() -> setLoading(false));
            }
        });
    }

    private void setLoading(boolean b) {
        btnLogin.setEnabled(!b);
        if (progress != null) progress.setVisibility(b ? View.VISIBLE : View.GONE);
    }

    private String textOf(TextInputEditText et) {
        return (et.getText() != null) ? et.getText().toString().trim() : "";
    }

    private void toast(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
    }

    private void failUi(String msg) {
        runOnUiThread(() -> toast(msg));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (io != null) io.shutdownNow();
    }
}
