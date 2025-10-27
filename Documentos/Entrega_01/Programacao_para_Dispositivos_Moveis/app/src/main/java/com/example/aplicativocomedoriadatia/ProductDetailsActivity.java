package com.example.aplicativocomedoriadatia;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.content.ContextCompat;

import com.example.aplicativocomedoriadatia.model.Product;

import java.io.InputStream;
import java.net.URL;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ProductDetailsActivity extends AppCompatActivity {

    private ExecutorService exec;
    private FavoriteService favoriteService;
    private SessionManager session;
    private Product product;
    private boolean isFavorite = false;

    private ImageButton btnFavorite;
    private ImageView img;
    private TextView name, price, description;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_product_details);

        // Inicializa serviços
        session = new SessionManager(this);
        favoriteService = new FavoriteService(this);
        exec = Executors.newSingleThreadExecutor();

        // Configura toolbar
        Toolbar tb = findViewById(R.id.toolbar);
        setSupportActionBar(tb);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        tb.setNavigationOnClickListener(v -> onBackPressed());

        // Inicializa views
        initViews();

        // Obtém o produto
        product = (Product) getIntent().getSerializableExtra("product");
        if (product == null) {
            Toast.makeText(this, "Produto inválido", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Carrega dados do produto
        loadProductData();

        // Verifica se é favorito (se usuário está logado)
        checkIfFavorite();

        // Configura listeners
        setupClickListeners();
    }

    private void initViews() {
        img = findViewById(R.id.img);
        name = findViewById(R.id.name);
        price = findViewById(R.id.price);
        description = findViewById(R.id.description);
        btnFavorite = findViewById(R.id.btnFavorite);
    }

    private void loadProductData() {
        name.setText(product.name != null ? product.name : "Produto");
        price.setText(formatCurrency(product.cost_estimated));
        description.setText(product.description != null ? product.description : "Sem descrição.");

        // Carrega imagem
        if (product.image_url != null && !product.image_url.isEmpty()) {
            exec.execute(() -> {
                try (InputStream in = new URL(product.image_url).openStream()) {
                    Bitmap bmp = BitmapFactory.decodeStream(in);
                    runOnUiThread(() -> img.setImageBitmap(bmp));
                } catch (Exception e) {
                    runOnUiThread(() -> img.setImageResource(android.R.color.darker_gray));
                }
            });
        } else {
            img.setImageResource(android.R.color.darker_gray);
        }

        // Botão adicionar ao carrinho
        findViewById(R.id.btnAdd).setOnClickListener(v ->
                Toast.makeText(this, "Adicionado ao carrinho!", Toast.LENGTH_SHORT).show()
        );
    }

    private void checkIfFavorite() {
        String userId = session.getUserId();
        String accessToken = session.getAccess();

        if (userId != null && accessToken != null && product != null) {
            exec.execute(() -> {
                isFavorite = favoriteService.isFavorite(userId, product.id, accessToken);
                runOnUiThread(this::updateFavoriteButton);
            });
        }
    }

    private void setupClickListeners() {
        btnFavorite.setOnClickListener(v -> toggleFavorite());
    }

    private void toggleFavorite() {
        String userId = session.getUserId();
        String accessToken = session.getAccess();

        if (userId == null || accessToken == null) {
            Toast.makeText(this, "Faça login para favoritar produtos", Toast.LENGTH_SHORT).show();
            return;
        }

        if (product == null) return;

        // Feedback visual imediato
        isFavorite = !isFavorite;
        updateFavoriteButton();

        exec.execute(() -> {
            boolean success;
            if (isFavorite) {
                success = favoriteService.addFavorite(userId, product.id, accessToken);
            } else {
                success = favoriteService.removeFavorite(userId, product.id, accessToken);
            }

            runOnUiThread(() -> {
                if (success) {
                    String message = isFavorite ? "❤️ Adicionado aos favoritos!" : "💔 Removido dos favoritos";
                    Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
                } else {
                    // Reverte se deu erro
                    isFavorite = !isFavorite;
                    updateFavoriteButton();
                    Toast.makeText(this, "Erro ao atualizar favoritos", Toast.LENGTH_SHORT).show();
                }
            });
        });
    }

    private void updateFavoriteButton() {
        if (isFavorite) {
            btnFavorite.setImageResource(R.drawable.ic_favorite);
            btnFavorite.setColorFilter(ContextCompat.getColor(this, R.color.red_500));
        } else {
            btnFavorite.setImageResource(R.drawable.ic_favorite_border);
            btnFavorite.setColorFilter(ContextCompat.getColor(this, R.color.gray_400));
        }
    }

    private String formatCurrency(double value) {
        return NumberFormat.getCurrencyInstance(new Locale("pt", "BR")).format(value);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (exec != null) {
            exec.shutdownNow();
        }
    }
}