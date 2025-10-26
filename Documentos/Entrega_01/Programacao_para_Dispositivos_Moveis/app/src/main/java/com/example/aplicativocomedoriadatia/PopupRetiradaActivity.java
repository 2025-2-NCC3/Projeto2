package com.example.aplicativocomedoriadatia;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

public class PopupRetiradaActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_popup_retirada);
        mostrarPopupRetirada();
    }
//correção
    private void mostrarPopupRetirada() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("📦 Produto Pronto")
                .setMessage("Seu pedido está disponível para retirada no balcão.")
                .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        Toast.makeText(PopupRetiradaActivity.this, "Obrigado!", Toast.LENGTH_SHORT).show();
                        dialog.dismiss();

                    }
                })
                .setCancelable(false)
                .show();
    }
}