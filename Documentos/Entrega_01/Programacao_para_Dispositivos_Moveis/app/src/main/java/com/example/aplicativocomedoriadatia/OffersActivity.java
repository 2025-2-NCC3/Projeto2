package com.example.aplicativocomedoriadatia;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.animation.ScaleAnimation;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.cart.CartItem;
import com.example.aplicativocomedoriadatia.cart.CartManager;
import com.example.aplicativocomedoriadatia.model.Product;
import com.example.aplicativocomedoriadatia.network.SupabaseClient;
import com.example.aplicativocomedoriadatia.ui.ProductAdapter;
import com.facebook.shimmer.ShimmerFrameLayout;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class OffersActivity extends AppCompatActivity {

    private static final String TAG = "OffersActivity";

    private ShimmerFrameLayout shimmer;
    private RecyclerView recycler;
    private View errorBox;

    private final ProductAdapter adapter = new ProductAdapter();
    private ExecutorService executor;

    private View cartActionView;
    private TextView tvBadge;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_offers);

        // Toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle("Ofertas");
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        shimmer = findViewById(R.id.shimmerContainer);
        recycler = findViewById(R.id.recyclerProducts);
        errorBox = findViewById(R.id.errorBox);

        setupRecycler();
        executor = Executors.newSingleThreadExecutor();

        fetchOffers();
    }

    // ================= MENU =================
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_home_top, menu);
        MenuItem cartItem = menu.findItem(R.id.action_cart);
        cartActionView = cartItem.getActionView();

        if (cartActionView != null) {
            tvBadge = cartActionView.findViewById(R.id.tvBadge);
            ImageView imgCart = cartActionView.findViewById(R.id.imgCart);
            updateCartBadge(false);

            cartActionView.setOnClickListener(v -> {
                Intent it = new Intent(this, CartActivity.class);
                startActivity(it);
            });
        }

        return true;
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateCartBadge(false);
    }

    private void updateCartBadge(boolean animate) {
        if (tvBadge == null) return;
        int total = 0;
        for (CartItem it : CartManager.with(getApplicationContext()).getItems()) {
            total += Math.max(0, it.qty);
        }

        if (total > 0) {
            tvBadge.setText(String.valueOf(total));
            tvBadge.setVisibility(View.VISIBLE);
            if (animate) {
                ScaleAnimation sa = new ScaleAnimation(0.8f, 1f, 0.8f, 1f,
                        tvBadge.getWidth() / 2f, tvBadge.getHeight() / 2f);
                sa.setDuration(150);
                tvBadge.startAnimation(sa);
            }
        } else {
            tvBadge.setVisibility(View.GONE);
        }
    }

    // ================= RECYCLER =================
    private void setupRecycler() {
        recycler.setLayoutManager(new GridLayoutManager(this, 2));
        recycler.setAdapter(adapter);

        adapter.setOnItemClickListener(product -> {
            Intent it = new Intent(this, ProductDetailsActivity.class);
            it.putExtra("product", product);
            startActivity(it);
        });

        adapter.setOnAddToCartListener(product -> {
            CartManager.with(getApplicationContext()).add(product, 1);
            Toast.makeText(this, "Adicionado ao carrinho!", Toast.LENGTH_SHORT).show();
            updateCartBadge(true);
        });
    }

    // ================= FETCH OFERTAS =================
    private void fetchOffers() {
        showLoading();

        final Context appCtx = getApplicationContext();

        if (executor == null) executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            try {
                SupabaseClient api = new SupabaseClient(appCtx);
                Type type = new TypeToken<List<Product>>(){}.getType();

                // Busca produtos que contenham "promo" ou "oferta" no nome ou descrição
                String query = Uri.encode("*promo*|*oferta*|*desconto*");
                String endpoint = "products?select=id,name,description,image_url,cost_estimated&or=(name.ilike." +
                        query + ",description.ilike." + query + ")&order=created_at.desc";

                List<Product> list = api.getList(endpoint, type);
                runOnUiThread(() -> showContent(list));

            } catch (Exception e) {
                Log.e(TAG, "Erro ao buscar ofertas", e);
                runOnUiThread(() -> showError("Erro ao carregar ofertas."));
            }
        });
    }

    private void showLoading() {
        shimmer.setVisibility(View.VISIBLE);
        shimmer.startShimmer();
        recycler.setVisibility(View.GONE);
    }

    private void showContent(List<Product> products) {
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);
        recycler.setVisibility(View.VISIBLE);
        adapter.setItems(products);
    }

    private void showError(String msg) {
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
    }

    // ================= VOLTAR =================
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
