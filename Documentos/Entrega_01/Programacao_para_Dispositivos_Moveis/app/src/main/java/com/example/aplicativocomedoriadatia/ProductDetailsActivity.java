package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.util.Log;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.example.aplicativocomedoriadatia.cart.CartItem;
import com.example.aplicativocomedoriadatia.cart.CartManager;
import com.example.aplicativocomedoriadatia.model.Product;

import java.io.InputStream;
import java.net.URL;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ProductDetailsActivity extends AppCompatActivity {

    private ExecutorService exec;

    private ImageButton backBTN;


    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_product_details);

        Toolbar tb = findViewById(R.id.toolbar);
        setSupportActionBar(tb);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        tb.setNavigationOnClickListener(v -> onBackPressed());

        // --- Recebe dados vindos do Intent ---
        Product p = (Product) getIntent().getSerializableExtra("product");
        double priceValue = getIntent().getDoubleExtra("price", 0.0);
        String endsAt = getIntent().getStringExtra("ends_at");
        boolean isOffer = getIntent().getBooleanExtra("is_offer", false);

        if (p == null) {
            Toast.makeText(this, "Produto inválido", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        ImageView img = findViewById(R.id.img);
        TextView name = findViewById(R.id.name);
        TextView price = findViewById(R.id.price);
        TextView desc = findViewById(R.id.description);
        TextView validity = findViewById(R.id.validity);

        backBTN = findViewById(R.id.backBTN);



        name.setText(p.name != null ? p.name : "Produto");
        desc.setText(p.description != null ? p.description : "Sem descrição.");

        // --- Define o preço ---
        price.setText(NumberFormat.getCurrencyInstance(new Locale("pt", "BR"))
                .format(priceValue));

        // --- Controle da validade ---
        if (isOffer) {
            // Produto veio da tela de ofertas
            if (endsAt != null && !endsAt.isEmpty()) {
                String data = endsAt.split("T")[0];
                validity.setText("Válido até: " + data);
                validity.setVisibility(TextView.VISIBLE);
            } else {
                validity.setText("Promoção por tempo limitado");
                validity.setVisibility(TextView.VISIBLE);
            }
        } else {
            // Produto normal — não exibe validade
            validity.setVisibility(TextView.GONE);
        }

        // --- Carrega imagem (sem Glide) ---
        if (p.image_url != null && p.image_url.startsWith("http")) {
            exec = Executors.newSingleThreadExecutor();
            exec.execute(() -> {
                try (InputStream in = new URL(p.image_url).openStream()) {
                    Bitmap bmp = BitmapFactory.decodeStream(in);
                    runOnUiThread(() -> img.setImageBitmap(bmp));
                } catch (Exception e) {
                    Log.e("ProductDetail", "Erro carregando imagem", e);
                }
            });
        } else {
            img.setImageResource(android.R.color.darker_gray);
        }

        findViewById(R.id.btnAdd).setOnClickListener(v -> {
            Toast.makeText(this, "Adicionado ao carrinho!", Toast.LENGTH_SHORT).show();

            if (p != null) {

                p.price = priceValue;

                CartItem item = new CartItem(p, 1);
                CartManager.with(this).add(item);

                Intent intent = new Intent(this, CartActivity.class);
                startActivity(intent);
            }
        });


        backBTN.setOnClickListener(v -> finish());

        // evita NullPointerException se não existir ActionBar
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (exec != null) exec.shutdownNow();
    }
}