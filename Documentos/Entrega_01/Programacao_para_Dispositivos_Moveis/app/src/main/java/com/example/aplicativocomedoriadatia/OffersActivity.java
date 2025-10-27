package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.view.animation.ScaleAnimation;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.appcompat.widget.Toolbar;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.cart.CartItem;
import com.example.aplicativocomedoriadatia.cart.CartManager;
import com.example.aplicativocomedoriadatia.model.ProductPrice;
import com.example.aplicativocomedoriadatia.network.SupabaseClient;
import com.example.aplicativocomedoriadatia.ui.OfferAdapter;
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

    private final OfferAdapter adapter = new OfferAdapter();
    private ExecutorService executor;

    private View cartActionView;
    private TextView tvBadge;

    private ImageButton backBTN;

    private ImageButton cartBTN;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_offers);

        Toolbar toolbar = findViewById(R.id.toolbar);

        shimmer = findViewById(R.id.shimmerContainer);
        recycler = findViewById(R.id.recyclerProducts);
        errorBox = findViewById(R.id.errorBox);
        backBTN = findViewById(R.id.backBTN);
        cartBTN = findViewById(R.id.cartBTN);

        recycler.setLayoutManager(new GridLayoutManager(this, 2));
        recycler.setAdapter(adapter);

        executor = Executors.newSingleThreadExecutor();

        setupRecycler();
        fetchOffers();
        NavbarHelper.setup(this);

        Window window = getWindow();
        window.setStatusBarColor(ContextCompat.getColor(this, R.color.green));

        backBTN.setOnClickListener(v -> finish());

        cartBTN.setOnClickListener(v -> {
            Intent it = new Intent(this, CartActivity.class);
            startActivity(it);
        });
    }

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

    // ================= FETCH OFERTAS =================
    private void fetchOffers() {
        showLoading();

        if (executor == null) executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            try {
                SupabaseClient api = new SupabaseClient(getApplicationContext());
                Type type = new TypeToken<List<ProductPrice>>(){}.getType();

                String endpoint = "product_prices?select=id,price,starts_at,ends_at,product:product_id(id,name,description,image_url)&order=starts_at.desc";

                List<ProductPrice> list = api.getList(endpoint, type);
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

    private void showContent(List<ProductPrice> offers) {
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);
        recycler.setVisibility(View.VISIBLE);
        adapter.setItems(offers);
    }

    private void showError(String msg) {
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
    }

    private void setupRecycler() {
        recycler.setLayoutManager(new GridLayoutManager(this, 2));
        recycler.setAdapter(adapter);

        adapter.setOnItemClickListener(this::openProductDetails);
    }

    private void openProductDetails(ProductPrice offer) {
        if (offer == null || offer.product == null) return;

        Intent it = new Intent(this, ProductDetailsActivity.class);
        it.putExtra("product", offer.product);
        it.putExtra("price", offer.price); // preço promocional
        it.putExtra("ends_at", offer.ends_at);
        it.putExtra("is_offer", true); // identifica que veio da tela de ofertas
        startActivity(it);
    }

}
