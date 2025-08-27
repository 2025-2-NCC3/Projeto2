package com.example.aplicativocomedoriadatia;

import android.os.Bundle;
import android.os.Handler;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    private LoadingDialog loadingDialog; // cria referência

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // 🔹 Exemplo: mostrar o loading ao abrir
        loadingDialog = LoadingDialog.newInstance();
        loadingDialog.show(getSupportFragmentManager(), "loading");

        // 🔹 Simula carregar algo (ex: chamada API)
        new Handler().postDelayed(() -> {
            // quando terminar, fecha
            if (loadingDialog != null && loadingDialog.getDialog() != null) {
                loadingDialog.dismiss();
            }
        }, 3000); // 3 segundos
    }
}
