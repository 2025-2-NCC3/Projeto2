// app/src/main/java/com/example/aplicativocomedoriadatia/ProductDetailsActivity.java
package com.example.aplicativocomedoriadatia;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.example.aplicativocomedoriadatia.model.Product;

import java.io.InputStream;
import java.net.URL;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ProductDetailsActivity extends AppCompatActivity {

    private ExecutorService exec;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_product_details);

        Toolbar tb = findViewById(R.id.toolbar);
        setSupportActionBar(tb);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        tb.setNavigationOnClickListener(v -> onBackPressed());

        Product p = (Product) getIntent().getSerializableExtra("product");
        if (p == null) {
            Toast.makeText(this, "Produto inválido", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        ImageView img = findViewById(R.id.img);
        TextView name  = findViewById(R.id.name);
        TextView price = findViewById(R.id.price);
        TextView desc  = findViewById(R.id.description);

        name.setText(p.name != null ? p.name : "Produto");
        price.setText(NumberFormat.getCurrencyInstance(new Locale("pt","BR"))
                .format(p.cost_estimated));
        desc.setText(p.description != null ? p.description : "Sem descrição.");

        // Carrega imagem remota de forma simples (sem libs)
        if (p.image_url != null && p.image_url.startsWith("http")) {
            exec = Executors.newSingleThreadExecutor();
            exec.execute(() -> {
                try (InputStream in = new URL(p.image_url).openStream()) {
                    Bitmap bmp = BitmapFactory.decodeStream(in);
                    runOnUiThread(() -> img.setImageBitmap(bmp));
                } catch (Exception ignored) {
                    // fallback silencioso
                }
            });
        } else {
            img.setImageResource(android.R.color.darker_gray);
        }

        findViewById(R.id.btnAdd).setOnClickListener(v ->
                Toast.makeText(this, "Adicionado ao carrinho!", Toast.LENGTH_SHORT).show()
        );
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (exec != null) exec.shutdownNow();
    }
}
