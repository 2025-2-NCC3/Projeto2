package com.example.aplicativocomedoriadatia;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageButton;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.model.Product;
import com.example.aplicativocomedoriadatia.network.SupabaseClient;
import com.example.aplicativocomedoriadatia.ui.ProductAdapter;
import com.facebook.shimmer.ShimmerFrameLayout;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AllProductsActivity extends AppCompatActivity {

    private ImageButton backBTN, cartBTN;
    private RecyclerView recycler;
    private ProductAdapter adapter;
    private ShimmerFrameLayout shimmer;

    private ExecutorService executor;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_allproducts);

        NavbarHelper.setup(this);

        // Bind dos elementos
        recycler = findViewById(R.id.recyclerProducts);
        shimmer  = findViewById(R.id.shimmerContainer);
        backBTN  = findViewById(R.id.backBTN);
        cartBTN  = findViewById(R.id.cartBTN);

        // Configuração do RecyclerView
        recycler.setLayoutManager(new GridLayoutManager(this, 2));
        adapter = new ProductAdapter();
        recycler.setAdapter(adapter);

        // Clique em item → abre detalhes
        adapter.setOnItemClickListener(this::openProductDetails);

        // Botão voltar
        backBTN.setOnClickListener(v -> finish());

        // Botão carrinho
        cartBTN.setOnClickListener(v -> {
            Intent it = new Intent(this, CartActivity.class);
            startActivity(it);
        });

        executor = Executors.newSingleThreadExecutor();
        fetchProducts(); // Chama o carregamento
    }

    /** Mostra o shimmer enquanto carrega */
    private void showLoading() {
        shimmer.setVisibility(View.VISIBLE);
        shimmer.startShimmer();
        recycler.setVisibility(View.GONE);
    }

    /** Mostra os produtos carregados */
    private void showContent(@Nullable List<Product> list) {
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);
        recycler.setVisibility(View.VISIBLE);
        adapter.setItems(list == null ? java.util.Collections.emptyList() : list);
    }

    /** Busca TODOS os produtos do Supabase (tabela produtos_teste) */
    private void fetchProducts() {
        showLoading();
        final Context appCtx = getApplicationContext();

        executor.execute(() -> {
            try {
                SupabaseClient api = new SupabaseClient(appCtx);
                Type type = new TypeToken<List<Product>>() {}.getType();
                String endpoint = buildProductsEndpoint();
                List<Product> list = api.getList(endpoint, type);

                runOnUiThread(() -> showContent(list));
            } catch (Exception e) {
                runOnUiThread(() ->
                        Toast.makeText(this, "Falha ao carregar produtos.", Toast.LENGTH_SHORT).show()
                );
            }
        });
    }

    /** Endpoint da tabela "produtos_teste" (sem filtro de is_active e sem limit) */
    private String buildProductsEndpoint() {
        return "produtos_teste"
                + "?select="
                + "id,slug,name,description,image_url,"
                + "is_active,stock_qty,"
                + "price,promotion_price,has_promotion,"
                + "starts_at,ends_at,"
                + "features,nutrition,"
                + "created_at,updated_at"
                + "&order=created_at.desc";
        // Observação: removemos qualquer filtro (ex.: is_active) e limit,
        // para realmente retornar TODOS os registros da tabela.
    }

    /** Abre a tela de detalhes do produto */
    private void openProductDetails(Product product) {
        if (product == null) return;

        Intent it = new Intent(this, ProductDetailsActivity.class);
        it.putExtra("product", product);
        it.putExtra("price", product.price); // preço base
        it.putExtra("is_offer", false);
        startActivity(it);
    }
}
