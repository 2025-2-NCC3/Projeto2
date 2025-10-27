package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.google.android.material.card.MaterialCardView;

import java.io.InputStream;
import java.net.URL;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

class FavoritesActivity extends AppCompatActivity {

    private LinearLayout favoritesList;
    private LinearLayout emptyState;
    private TextView tvFavoritesCount;
    private ExecutorService exec;

    private FavoriteService favoriteService;
    private SessionManager session;
    private List<Product> favoriteProducts;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_favorites);

        // Configura toolbar
        Toolbar tb = findViewById(R.id.toolbar);
        setSupportActionBar(tb);
        getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        tb.setNavigationOnClickListener(v -> onBackPressed());

        // Inicializa serviços
        session = new SessionManager(this);
        favoriteService = new FavoriteService(this);
        exec = Executors.newFixedThreadPool(3);

        // Inicializa views
        favoritesList = findViewById(R.id.favoritesList);
        emptyState = findViewById(R.id.emptyState);
        tvFavoritesCount = findViewById(R.id.tvFavoritesCount);

        // Carrega favoritos
        loadFavoriteProducts();
    }

    private void loadFavoriteProducts() {
        String userId = session.getUserId();
        String accessToken = session.getAccess();

        if (userId == null || accessToken == null) {
            showEmptyState();
            Toast.makeText(this, "Faça login para ver favoritos", Toast.LENGTH_SHORT).show();
            return;
        }

        showLoading();

        new Thread(() -> {
            try {
                // Busca favoritos com detalhes dos produtos
                favoriteProducts = favoriteService.getUserFavoritesWithDetails(userId, accessToken);

                runOnUiThread(this::updateUI);

            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() -> {
                    Toast.makeText(this, "Erro ao carregar favoritos", Toast.LENGTH_SHORT).show();
                    showEmptyState();
                });
            }
        }).start();
    }

    private void showLoading() {
        emptyState.setVisibility(View.GONE);
        favoritesList.setVisibility(View.GONE);
    }

    private void updateUI() {
        if (favoriteProducts == null || favoriteProducts.isEmpty()) {
            showEmptyState();
        } else {
            showFavoritesList();
        }
    }

    private void showEmptyState() {
        emptyState.setVisibility(View.VISIBLE);
        favoritesList.setVisibility(View.GONE);
    }

    private void showFavoritesList() {
        emptyState.setVisibility(View.GONE);
        favoritesList.setVisibility(View.VISIBLE);

        tvFavoritesCount.setText(favoriteProducts.size() + " itens favoritados");

        // Limpa a lista atual
        favoritesList.removeAllViews();

        // Adiciona os itens favoritos
        for (Product product : favoriteProducts) {
            addFavoriteItem(product);
        }
    }

    private void addFavoriteItem(Product product) {
        LayoutInflater inflater = LayoutInflater.from(this);
        MaterialCardView itemView = (MaterialCardView) inflater.inflate(
                R.layout.item_favorite_product,
                favoritesList,
                false
        );

        TextView tvName = itemView.findViewById(R.id.tvProductName);
        TextView tvPrice = itemView.findViewById(R.id.tvProductPrice);
        TextView tvDescription = itemView.findViewById(R.id.tvProductDescription);
        ImageView imgProduct = itemView.findViewById(R.id.imgProduct);
        ImageView btnRemove = itemView.findViewById(R.id.btnRemoveFavorite);

        tvName.setText(product.name != null ? product.name : "Produto");
        tvPrice.setText(formatCurrency(product.cost_estimated));
        tvDescription.setText(product.description != null ? product.description : "Sem descrição");

        loadProductImage(product.image_url, imgProduct);

        itemView.setOnClickListener(v -> openProductDetails(product));

        btnRemove.setOnClickListener(v -> removeFromFavorites(product, itemView));

        favoritesList.addView(itemView);
    }

    private void loadProductImage(String imageUrl, ImageView imageView) {
        if (imageUrl != null && !imageUrl.isEmpty()) {
            exec.execute(() -> {
                try {
                    URL url = new URL(imageUrl);
                    InputStream in = url.openStream();
                    Bitmap bmp = BitmapFactory.decodeStream(in);
                    runOnUiThread(() -> imageView.setImageBitmap(bmp));
                    in.close();
                } catch (Exception e) {
                    runOnUiThread(() ->
                            imageView.setImageResource(R.drawable.ic_fastfood_24)
                    );
                }
            });
        } else {
            imageView.setImageResource(R.drawable.ic_fastfood_24);
        }
    }

    private void removeFromFavorites(Product product, MaterialCardView itemView) {
        String userId = session.getUserId();
        String accessToken = session.getAccess();

        if (userId == null || accessToken == null) {
            Toast.makeText(this, "Erro ao remover favorito", Toast.LENGTH_SHORT).show();
            return;
        }

        new Thread(() -> {
            boolean success = favoriteService.removeFavorite(userId, product.id, accessToken);

            runOnUiThread(() -> {
                if (success) {
                    favoriteProducts.remove(product);
                    favoritesList.removeView(itemView);
                    tvFavoritesCount.setText(favoriteProducts.size() + " itens favoritados");
                    Toast.makeText(this, "Removido dos favoritos", Toast.LENGTH_SHORT).show();

                    if (favoriteProducts.isEmpty()) {
                        showEmptyState();
                    }
                } else {
                    Toast.makeText(this, "Erro ao remover favorito", Toast.LENGTH_SHORT).show();
                }
            });
        }).start();
    }

    private void openProductDetails(Product product) {
        Intent intent = new Intent(this, ProductDetailsActivity.class);
        intent.putExtra("product_id", product.id);
        intent.putExtra("product_name", product.name);
        intent.putExtra("product_description", product.description);
        intent.putExtra("product_price", product.cost_estimated);
        intent.putExtra("product_image", product.image_url);
        startActivity(intent);
    }

    public void onExploreProductsClick(View view) {
        // Navegar para tela de produtos (HomeActivity)
        Intent intent = new Intent(this, HomeActivity.class);
        startActivity(intent);
        finish();
    }

    private String formatCurrency(double value) {
        if (value == 0) return "Grátis";
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