package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.animation.DecelerateInterpolator;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.google.android.material.button.MaterialButton;

public class WelcomeActivity extends AppCompatActivity {

    private static final long ANIM_DURATION = 380L;
    private static final long CLICK_DEBOUNCE_MS = 600L;
    private long lastClick = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 1) Splash moderna (androidx.core:core-splashscreen)
        SplashScreen.installSplashScreen(this);

        super.onCreate(savedInstanceState);

        // 2) Edge-to-Edge (opcional)
        EdgeToEdge.enable(this);

        // 3) Layout da tela de boas-vindas
        setContentView(R.layout.activity_welcome);

        // 4) Ajuste de insets (se o root existir)
        View root = findViewById(R.id.welcome_root);
        if (root != null) {
            ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
                Insets sys = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(sys.left, sys.top, sys.right, sys.bottom);
                return insets;
            });
        }

        // 5) Referências de UI
        TextView tvTitle      = findViewById(R.id.tvTitle);
        TextView tvSubtitle   = findViewById(R.id.tvSubtitle);
        MaterialButton btnLogin   = findViewById(R.id.btnLogin);
        MaterialButton btnSignup  = findViewById(R.id.btnSignup);

        // 6) Animações de entrada com null-check
        animateIn(tvTitle, 0);
        animateIn(tvSubtitle, 80);
        animateIn(btnLogin, 160);
        animateIn(btnSignup, 240);

        // 7) Ações de clique (com debounce)
        if (btnLogin != null) {
            btnLogin.setOnClickListener(v -> {
                if (debounced()) return;
                openActivityOrToast(LoginActivity.class, "Tela de Login ainda não existe.");
            });
        }
        if (btnSignup != null) {
            btnSignup.setOnClickListener(v -> {
                if (debounced()) return;
                openActivityOrToast(SignupActivity.class, "Tela de Cadastro ainda não existe.");
            });
        }
    }

    private void animateIn(View view, long delay) {
        if (view == null) return;
        view.setAlpha(0f);
        view.setTranslationY(24f);
        view.animate()
                .alpha(1f)
                .translationY(0f)
                .setDuration(ANIM_DURATION)
                .setStartDelay(delay)
                .setInterpolator(new DecelerateInterpolator())
                .start();
    }

    private boolean debounced() {
        long now = System.currentTimeMillis();
        if (now - lastClick < CLICK_DEBOUNCE_MS) return true;
        lastClick = now;
        return false;
    }

    private void openActivityOrToast(Class<?> target, String missingMsg) {
        try {
            startActivity(new Intent(this, target));
        } catch (Exception e) {
            Toast.makeText(this, missingMsg, Toast.LENGTH_SHORT).show();
        }
    }
}
