package com.example.aplicativocomedoriadatia;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class ComedoriaMain extends AppCompatActivity {

    Button btnRetirar, btnDelivery;

    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        btnRetirar = findViewById(R.id.btnRetirar);
        btnDelivery = findViewById(R.id.btnDelivery);

        btnRetirar.setOnClickListener(v ->
                Toast.makeText(this, "Modo: Peça e Retire", Toast.LENGTH_SHORT).show()
        );

        btnDelivery.setOnClickListener(v ->
                Toast.makeText(this, "Modo: Delivery", Toast.LENGTH_SHORT).show()
        );
    }
}
