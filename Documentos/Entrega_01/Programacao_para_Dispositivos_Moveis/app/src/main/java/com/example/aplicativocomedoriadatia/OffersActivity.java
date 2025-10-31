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
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Tela de Ofertas lendo da tabela 'produtos_teste'.
 * Filtra itens com promoção (has_promotion = true), ordena por starts_at desc
 * e mapeia promotion_price -> price para manter compatibilidade com ProductPrice.
 */
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
    // Removido: private ImageButton cartBTN;  // (evita carrinho duplicado)

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_offers);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        shimmer  = findViewById(R.id.shimmerContainer);
        recycler = findViewById(R.id.recyclerProducts);
        errorBox = findViewById(R.id.errorBox);
        backBTN  = findViewById(R.id.backBTN);
        // Removido: cartBTN = findViewById(R.id.cartBTN);

        recycler.setLayoutManager(new GridLayoutManager(this, 2));
        recycler.setAdapter(adapter);

        executor = Executors.newSingleThreadExecutor();

        setupRecycler();
        fetchOffers();

        try {
            NavbarHelper.setup(this);
        } catch (Throwable t) {
            Log.w(TAG, "NavbarHelper.setup() ausente/ignorado", t);
        }

        Window window = getWindow();
        window.setStatusBarColor(ContextCompat.getColor(this, R.color.green));

        backBTN.setOnClickListener(v -> finish());

        // Removido: listener do cartBTN (carrinho duplicado)
        // cartBTN.setOnClickListener(v -> {
        //     Intent it = new Intent(this, CartActivity.class);
        //     startActivity(it);
        // });
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_home_top, menu);
        MenuItem cartItem = menu.findItem(R.id.action_cart);
        cartActionView = cartItem != null ? cartItem.getActionView() : null;

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
                ScaleAnimation sa = new ScaleAnimation(
                        0.8f, 1f,
                        0.8f, 1f,
                        tvBadge.getWidth() / 2f,
                        tvBadge.getHeight() / 2f
                );
                sa.setDuration(150);
                tvBadge.startAnimation(sa);
            }
        } else {
            tvBadge.setVisibility(View.GONE);
        }
    }

    // ================= FETCH OFERTAS =================
    private void fetchOffers() {
        Log.d(TAG, "fetchOffers(): iniciando busca de promoções...");
        showLoading();

        if (executor == null) executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            try {
                SupabaseClient api = new SupabaseClient(getApplicationContext());

                String endpoint =
                        "produtos_teste"
                                + "?select="
                                + "id,"
                                + "name,"
                                + "description,"
                                + "image_url,"
                                + "nutrition,"
                                + "price:promotion_price,"
                                + "starts_at,"
                                + "ends_at,"
                                + "has_promotion"
                                + "&has_promotion=eq.true"
                                + "&order=starts_at.desc";

                Log.d(TAG, "fetchOffers(): endpoint = " + endpoint);

                Type rawType = new TypeToken<List<ProdutoTeste>>(){}.getType();
                List<ProdutoTeste> raw = api.getList(endpoint, rawType);

                List<ProductPrice> list = new ArrayList<>();
                if (raw != null) {
                    for (int i = 0; i < raw.size(); i++) {
                        ProdutoTeste r = raw.get(i);
                        if (r == null) continue;

                        ProductPrice p = new ProductPrice();
                        p.id        = r.id;
                        p.price     = r.price;       // alias: promotion_price -> price
                        p.starts_at = r.starts_at;
                        p.ends_at   = r.ends_at;

                        com.example.aplicativocomedoriadatia.model.Product prod =
                                new com.example.aplicativocomedoriadatia.model.Product();
                        prod.id          = r.id;
                        prod.name        = r.name;
                        prod.image_url   = r.image_url;
                        prod.description = r.description;
                        prod.nutrition   = r.nutrition;  // JSONB -> Object

                        p.product = prod;

                        list.add(p);

                        Log.d(TAG, "offer[" + i + "]: id=" + p.id
                                + ", price=" + p.price
                                + ", starts_at=" + p.starts_at
                                + ", ends_at=" + p.ends_at);
                        if (p.product != null) {
                            Log.d(TAG, "offer[" + i + "].product: name=" + p.product.name
                                    + ", img=" + p.product.image_url);
                        }
                    }
                } else {
                    Log.w(TAG, "fetchOffers(): resposta bruta == null");
                }

                runOnUiThread(() -> showContent(list));

            } catch (Exception e) {
                Log.e(TAG, "fetchOffers(): Erro ao buscar ofertas", e);
                final String userMsg = (e.getMessage() != null)
                        ? "Erro ao carregar ofertas: " + e.getMessage()
                        : "Erro ao carregar ofertas (exceção sem mensagem)";
                runOnUiThread(() -> showError(userMsg));
            }
        });
    }

    private void showLoading() {
        Log.d(TAG, "showLoading(): shimmer ON, escondendo recycler");
        shimmer.setVisibility(View.VISIBLE);
        shimmer.startShimmer();
        recycler.setVisibility(View.GONE);
        errorBoxVisibility(false);
    }

    private void showContent(List<ProductPrice> offers) {
        Log.d(TAG, "showContent(): chamado");

        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);

        if (offers == null) {
            Log.w(TAG, "showContent(): offers == null, mostrando erro genérico");
            recycler.setVisibility(View.GONE);
            errorBoxVisibility(true);
            Toast.makeText(this, "Nenhuma promoção encontrada.", Toast.LENGTH_SHORT).show();
            return;
        }

        Log.d(TAG, "showContent(): offers.size=" + offers.size());

        if (offers.isEmpty()) {
            Log.w(TAG, "showContent(): lista vazia, exibindo caixa de erro/vazio");
            recycler.setVisibility(View.GONE);
            errorBoxVisibility(true);
            Toast.makeText(this, "Nenhuma promoção ativa no momento.", Toast.LENGTH_SHORT).show();
            return;
        }

        errorBoxVisibility(false);
        recycler.setVisibility(View.VISIBLE);

        Log.d(TAG, "showContent(): setItems() no adapter");
        adapter.setItems(offers);
    }

    private void showError(String msg) {
        Log.e(TAG, "showError(): " + msg);
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);

        recycler.setVisibility(View.GONE);
        errorBoxVisibility(true);

        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show();
    }

    private void setupRecycler() {
        Log.d(TAG, "setupRecycler(): configurando RecyclerView e listener");
        recycler.setLayoutManager(new GridLayoutManager(this, 2));
        recycler.setAdapter(adapter);

        adapter.setOnItemClickListener(offer -> {
            Log.d(TAG, "onItemClick(): offer clicada = " + (offer != null ? offer.id : "null"));
            openProductDetails(offer);
        });
    }

    private void openProductDetails(ProductPrice offer) {
        if (offer == null) {
            Log.w(TAG, "openProductDetails(): offer == null, abortando");
            return;
        }

        if (offer.product == null) {
            Log.w(TAG, "openProductDetails(): offer.product == null");
            Toast.makeText(this, "Produto inválido.", Toast.LENGTH_SHORT).show();
            return;
        }

        Intent it = new Intent(this, ProductDetailsActivity.class);
        it.putExtra("product", offer.product);
        it.putExtra("price", offer.price);
        it.putExtra("ends_at", offer.ends_at);
        it.putExtra("is_offer", true);
        startActivity(it);
    }

    private void errorBoxVisibility(boolean visible) {
        if (errorBox == null) return;
        errorBox.setVisibility(visible ? View.VISIBLE : View.GONE);
    }

    // ---- POJO para a tabela nova (pode mover para um package model se preferir) ----
    static class ProdutoTeste {
        public String id;
        public String name;
        public String description;
        public String image_url;
        public Object nutrition;   // JSONB
        public double price;       // alias de promotion_price
        public String starts_at;
        public String ends_at;
        public Boolean has_promotion;
    }
}
