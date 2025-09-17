package com.example.aplicativocomedoriadatia;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.model.Product;
import com.example.aplicativocomedoriadatia.network.SupabaseClient;
import com.example.aplicativocomedoriadatia.ui.ProductAdapter;
import com.facebook.shimmer.ShimmerFrameLayout;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HomeActivity extends AppCompatActivity {

    private static final String TAG = "HomeActivity";

    private ShimmerFrameLayout shimmer;
    private RecyclerView recycler;
    private View errorBox;
    private Button retry;

    private Toolbar toolbar;
    private View btnSeeAll;
    private LinearLayout chipsContainer; // “chips” sem Material: TextViews dentro do HorizontalScrollView

    private final ProductAdapter adapter = new ProductAdapter();
    private ExecutorService executor;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        // ---- Views principais
        shimmer = findViewById(R.id.shimmerContainer);
        recycler = findViewById(R.id.recyclerProducts);
        errorBox = findViewById(R.id.errorBox);
        retry = findViewById(R.id.btnRetry);

        // ---- Toolbar AppCompat com menu
        toolbar = findViewById(R.id.topAppBar);
        setupToolbar();

        // ---- Cabeçalho e “chips”
        btnSeeAll = findViewById(R.id.btnSeeAll);
        chipsContainer = findViewById(R.id.chipsContainer);
        setupHeaderAndChips();

        // ---- Recycler
        recycler.setLayoutManager(new GridLayoutManager(this, 2));
        recycler.setAdapter(adapter);

        // ---- Retry
        retry.setOnClickListener(v -> fetchProducts());

        // ---- Executor para rede
        executor = Executors.newSingleThreadExecutor();

        // ---- Carregar
        fetchProducts();
    }

    private void setupToolbar() {
        // Se quiser título do Toolbar controlado pelo AppCompat:
        // setSupportActionBar(toolbar);
        // getSupportActionBar().setTitle("Comedoria da Tia");

        // Clique no item de menu (carrinho)
        toolbar.setOnMenuItemClickListener(item -> {
            if (item.getItemId() == R.id.action_cart) {
                // Abra a tela que preferir (ex.: ComedoriaMain ou uma CartActivity)
                startActivity(new Intent(this, ComedoriaMain.class));
                return true;
            }
            return false;
        });
    }

    private void setupHeaderAndChips() {
        if (btnSeeAll != null) {
            btnSeeAll.setOnClickListener(v ->
                    Toast.makeText(this, "Abrir lista completa", Toast.LENGTH_SHORT).show()
            );
        }

        // Adiciona listeners simples aos "chips" (TextViews dentro de chipsContainer)
        if (chipsContainer != null) {
            for (int i = 0; i < chipsContainer.getChildCount(); i++) {
                View chip = chipsContainer.getChildAt(i);
                chip.setOnClickListener(v -> {
                    CharSequence label = (v instanceof android.widget.TextView)
                            ? ((android.widget.TextView) v).getText()
                            : "Filtro";
                    // Aqui você pode aplicar um filtro real no adapter/consulta.
                    Toast.makeText(this, "Filtro: " + label, Toast.LENGTH_SHORT).show();
                });
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (shimmer.getVisibility() == View.VISIBLE) {
            shimmer.startShimmer();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        shimmer.stopShimmer();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (executor != null) executor.shutdownNow();
    }

    private void showLoading() {
        errorBox.setVisibility(View.GONE);
        recycler.setVisibility(View.GONE);
        shimmer.setVisibility(View.VISIBLE);
        shimmer.startShimmer();
    }

    private void showContent(List<Product> products) {
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);
        errorBox.setVisibility(View.GONE);
        recycler.setVisibility(View.VISIBLE);
        adapter.setItems(products != null ? products : Collections.emptyList());
    }

    private void showError(String message) {
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);
        recycler.setVisibility(View.GONE);
        errorBox.setVisibility(View.VISIBLE);
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        Log.e(TAG, "Erro ao carregar produtos: " + message);
    }

    private void fetchProducts() {
        showLoading();

        final Context appCtx = getApplicationContext();

        executor.execute(() -> {
            try {
                SupabaseClient api = new SupabaseClient(appCtx);
                Type type = new TypeToken<List<Product>>(){}.getType();
                // Se quiser otimizar, selecione apenas campos necessários:
                // "products?select=id,name,price,image_url&order=created_at.desc&limit=12"
                List<Product> list = api.getList(
                        "products?select=*&order=created_at.desc&limit=12", type);

                runOnUiThread(() -> showContent(list));

            } catch (IOException e) {
                Log.e(TAG, "IOException no fetchProducts", e);
                runOnUiThread(() -> showError("Falha de rede/servidor."));
            } catch (Exception e) {
                Log.e(TAG, "Exceção inesperada no fetchProducts", e);
                runOnUiThread(() -> showError("Erro inesperado ao carregar."));
            }
        });
    }
}
