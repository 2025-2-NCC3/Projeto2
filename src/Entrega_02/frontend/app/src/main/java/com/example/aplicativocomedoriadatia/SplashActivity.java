package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;

public class SplashActivity extends AppCompatActivity {

    private SessionManager session;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Garante tema claro em todo o app
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash); // layout simples com logo central

        session = new SessionManager(this);

        // Breve delay só para mostrar o logo; pode reduzir/zerar se preferir
        new Handler(Looper.getMainLooper()).postDelayed(this::route, 700);
    }

    private void route() {
        try {
            final boolean logged = session != null && session.isLoggedIn();
            Class<?> next = logged ? HomeActivity.class : LoginActivity.class;

            Intent i = new Intent(this, next);
            // Limpa a pilha: usuário não volta para a Splash/Login ao pressionar Back
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(i);
            finish();
        } catch (Exception e) {
            // Em caso de qualquer erro inesperado, vá para o Login de forma segura
            Intent i = new Intent(this, LoginActivity.class);
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(i);
            finish();
        }
    }
}
