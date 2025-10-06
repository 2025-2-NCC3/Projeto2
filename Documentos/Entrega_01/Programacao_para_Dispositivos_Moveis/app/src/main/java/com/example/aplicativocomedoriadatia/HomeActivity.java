package com.example.aplicativocomedoriadatia;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.animation.ScaleAnimation;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.annotation.ColorInt;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.appcompat.widget.Toolbar;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.cart.CartItem;
import com.example.aplicativocomedoriadatia.cart.CartManager;
import com.example.aplicativocomedoriadatia.model.Product;
import com.example.aplicativocomedoriadatia.network.SupabaseClient;
import com.example.aplicativocomedoriadatia.ui.ProductAdapter;
import com.facebook.shimmer.ShimmerFrameLayout;
import com.google.android.material.textfield.TextInputEditText;
import com.google.gson.reflect.TypeToken;

import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.TextWatcher;
import android.util.SparseArray;
import android.widget.HorizontalScrollView;
import android.widget.TextView;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HomeActivity extends AppCompatActivity {

    private static final String TAG = "HomeActivity";
    private static final long AUTO_REFRESH_MS = 20_000L;

    // ===== Variáveis principais =====
    private String lastQuery = "";
    private String lastDataSignature = "";
    private final Handler autoHandler = new Handler(Looper.getMainLooper());

    private final Runnable autoRunnable = new Runnable() {
        @Override public void run() {
            fetchProductsSilent(lastQuery.isEmpty() ? null : lastQuery);
            autoHandler.postDelayed(this, AUTO_REFRESH_MS);
        }
    };

    // ===== Views =====
    private ShimmerFrameLayout shimmer;
    private RecyclerView recycler;
    private View errorBox;
    private Button retry;
    private Toolbar toolbar;
    private View btnSeeAll;
    private LinearLayout chipsContainer;
    private TextInputEditText etSearch;
    private LinearLayout navInicio, navPedidos, navOfertas, navPerfil;

    // ===== Dados =====
    private final ProductAdapter adapter = new ProductAdapter();
    private final List<Product> masterProducts = new ArrayList<>();
    private String selectedCategory = "Todos";
    private FilterChipsController chipsController;
    private ExecutorService executor;

    // ===== Badge do carrinho =====
    private TextView tvBadge;

    // ===== Busca com debounce =====
    private final Handler searchHandler = new Handler(Looper.getMainLooper());
    private Runnable searchRunnable;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        // Bind
        shimmer = findViewById(R.id.shimmerContainer);
        recycler = findViewById(R.id.recyclerProducts);
        errorBox = findViewById(R.id.errorBox);
        retry = findViewById(R.id.btnRetry);
        btnSeeAll = findViewById(R.id.btnSeeAll);
        chipsContainer = findViewById(R.id.chipsContainer);
        etSearch = findViewById(R.id.etSearch);
        navInicio = findViewById(R.id.nav_inicio);
        navPedidos = findViewById(R.id.nav_pedidos);
        navOfertas = findViewById(R.id.nav_ofertas);
        navPerfil = findViewById(R.id.nav_perfil);

        toolbar = findViewById(R.id.toolbar);
        if (toolbar != null) setSupportActionBar(toolbar);

        setupHeaderAndChips();
        setupRecycler();
        setupRetry();
        setupBottomNav();
        setupSearch();

        executor = Executors.newSingleThreadExecutor();
        fetchProducts(null);
    }

    // ================= MENU do Carrinho =================
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_home_top, menu);

        MenuItem cartItem = menu.findItem(R.id.action_cart);
        View actionView = cartItem.getActionView();
        tvBadge = actionView.findViewById(R.id.tvBadge);

        // clique no ícone do carrinho → abre tela
        actionView.setOnClickListener(v ->
                startActivity(new Intent(this, CartActivity.class))
        );

        updateCartBadge(false);
        return true;
    }

    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        updateCartBadge(false);
        return super.onPrepareOptionsMenu(menu);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (shimmer != null && shimmer.getVisibility() == View.VISIBLE) shimmer.startShimmer();
        startAutoRefresh();
        updateCartBadge(false);
    }

    @Override
    protected void onPause() {
        super.onPause();
        stopAutoRefresh();
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.action_cart) {
            startActivity(new Intent(this, CartActivity.class));
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    /** Atualiza o número de produtos no badge do carrinho. */
    private void updateCartBadge(boolean animate) {
        if (tvBadge == null) return;
        int totalQty = 0;
        for (CartItem it : CartManager.with(getApplicationContext()).getItems()) {
            totalQty += Math.max(0, it.qty);
        }

        if (totalQty > 0) {
            tvBadge.setText(String.valueOf(totalQty));
            tvBadge.setVisibility(View.VISIBLE);
            if (animate) {
                ScaleAnimation sa = new ScaleAnimation(
                        0.8f, 1f, 0.8f, 1f,
                        tvBadge.getWidth() / 2f, tvBadge.getHeight() / 2f);
                sa.setDuration(150);
                tvBadge.startAnimation(sa);
            }
        } else {
            tvBadge.setVisibility(View.GONE);
        }
    }

    // ================= Busca =================
    private void setupSearch() {
        if (etSearch == null) return;
        etSearch.setOnEditorActionListener((v, actionId, event) -> {
            performSearch(getText(etSearch));
            return true;
        });
        etSearch.addTextChangedListener(new SimpleTextWatcher() {
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (searchRunnable != null) searchHandler.removeCallbacks(searchRunnable);
                searchRunnable = () -> performSearch(s.toString());
                searchHandler.postDelayed(searchRunnable, 300);
            }
        });
    }

    private void performSearch(String q) {
        String trimmed = q == null ? "" : q.trim();
        if (trimmed.equals(lastQuery)) return;
        lastQuery = trimmed;
        fetchProducts(trimmed.isEmpty() ? null : trimmed);
    }

    private static String getText(TextInputEditText et) {
        return et != null && et.getText() != null ? et.getText().toString() : "";
    }

    // ================= Bottom Navigation =================
    private void setupBottomNav() {
        if (navInicio == null || navPedidos == null || navOfertas == null || navPerfil == null) return;

        View.OnClickListener listener = v -> {
            setSelectedTab(v.getId());
            if (v.getId() == R.id.nav_inicio) {
                if (etSearch != null) etSearch.setText("");
                selectedCategory = "Todos";
                if (chipsController != null) chipsController.selectById(R.id.chipTodos);
                fetchProducts(null);
            } else if (v.getId() == R.id.nav_pedidos) {
                Toast.makeText(this, "Pedidos (em breve)", Toast.LENGTH_SHORT).show();
            } else if (v.getId() == R.id.nav_ofertas) {
                // agora abre a OffersActivity de verdade
                startActivity(new Intent(this, OffersActivity.class));
            } else if (v.getId() == R.id.nav_perfil) {
                Toast.makeText(this, "Perfil (em breve)", Toast.LENGTH_SHORT).show();
            }
        };

        navInicio.setOnClickListener(listener);
        navPedidos.setOnClickListener(listener);
        navOfertas.setOnClickListener(listener);
        navPerfil.setOnClickListener(listener);
        setSelectedTab(R.id.nav_inicio);
    }

    private void setSelectedTab(int viewId) {
        navInicio.setSelected(viewId == R.id.nav_inicio);
        navPedidos.setSelected(viewId == R.id.nav_pedidos);
        navOfertas.setSelected(viewId == R.id.nav_ofertas);
        navPerfil.setSelected(viewId == R.id.nav_perfil);
    }

    // ================= Conteúdo / produtos =================
    private void setupHeaderAndChips() {
        if (btnSeeAll != null) {
            btnSeeAll.setOnClickListener(v ->
                    Toast.makeText(this, "Abrir lista completa", Toast.LENGTH_SHORT).show());
        }

        if (chipsContainer != null) {
            chipsController = FilterChipsController.attach(chipsContainer, category -> {
                selectedCategory = (category == null ? "Todos" : category);
                applyCurrentFilters();
            });
        }
    }

    private void setupRecycler() {
        recycler.setLayoutManager(new GridLayoutManager(this, 2));
        recycler.setAdapter(adapter);
        adapter.setOnItemClickListener(this::openProductDetails);
    }

    private void openProductDetails(Product product) {
        if (product == null) return;
        Intent it = new Intent(this, ProductDetailsActivity.class);
        it.putExtra("product", product);
        startActivity(it);
    }

    private void setupRetry() {
        if (retry != null)
            retry.setOnClickListener(v -> fetchProducts(lastQuery.isEmpty() ? null : lastQuery));
    }

    // ====== Ciclo de vida: auto-refresh ======
    private void startAutoRefresh() {
        stopAutoRefresh();
        autoHandler.postDelayed(autoRunnable, AUTO_REFRESH_MS);
    }

    private void stopAutoRefresh() {
        autoHandler.removeCallbacks(autoRunnable);
    }

    // ====== Estados de UI ======
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
        masterProducts.clear();
        if (products != null) masterProducts.addAll(products);
        lastDataSignature = listSignature(products);
        applyCurrentFilters();
    }

    private void showError(String message) {
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);
        recycler.setVisibility(View.GONE);
        errorBox.setVisibility(View.VISIBLE);
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }

    private void applyCurrentFilters() {
        final String q = getText(etSearch).trim().toLowerCase();
        final boolean hasQuery = !q.isEmpty();
        final boolean filterByCategory = selectedCategory != null && !"Todos".equalsIgnoreCase(selectedCategory);

        List<Product> filtered = new ArrayList<>();
        for (Product p : masterProducts) {
            if (p == null) continue;
            boolean ok = true;
            if (filterByCategory) ok = matchesCategory(p, selectedCategory);
            if (ok && hasQuery) ok = containsText(p, q);
            if (ok) filtered.add(p);
        }
        recycler.setVisibility(View.VISIBLE);
        adapter.setItems(filtered);
    }

    private boolean matchesCategory(Product p, String categoryLabel) {
        String label = (categoryLabel == null ? "" : categoryLabel).toLowerCase();
        String name = getLower(p, "name", "nome", "title");
        String desc = getLower(p, "description", "descricao", "details", "desc");
        if (label.contains("promo")) {
            return name.contains("promo") || desc.contains("promo")
                    || name.contains("oferta") || desc.contains("oferta");
        }
        return name.contains(label) || desc.contains(label);
    }

    private boolean containsText(Product p, String q) {
        String name = getLower(p, "name", "nome", "title");
        String desc = getLower(p, "description", "descricao", "details", "desc");
        return name.contains(q) || desc.contains(q);
    }

    // ========= BUSCA NO SUPABASE =========
    private void fetchProducts(@Nullable String query) {
        showLoading();
        final Context appCtx = getApplicationContext();
        final String q = (query == null) ? "" : query;
        if (executor == null) executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            try {
                SupabaseClient api = new SupabaseClient(appCtx);
                Type type = new TypeToken<List<Product>>(){}.getType();
                String endpoint = buildProductsEndpoint(q);
                List<Product> list = api.getList(endpoint, type);
                runOnUiThread(() -> showContent(list));
            } catch (Exception e) {
                runOnUiThread(() -> showError("Falha ao carregar produtos."));
            }
        });
    }

    private void fetchProductsSilent(@Nullable String query) {
        final Context appCtx = getApplicationContext();
        final String q = (query == null) ? "" : query;
        if (executor == null) executor = Executors.newSingleThreadExecutor();
        executor.execute(() -> {
            try {
                SupabaseClient api = new SupabaseClient(appCtx);
                Type type = new TypeToken<List<Product>>(){}.getType();
                String endpoint = buildProductsEndpoint(q);
                List<Product> list = api.getList(endpoint, type);
                String newSig = listSignature(list);
                if (!newSig.equals(lastDataSignature)) {
                    runOnUiThread(() -> {
                        masterProducts.clear();
                        if (list != null) masterProducts.addAll(list);
                        lastDataSignature = newSig;
                        applyCurrentFilters();
                    });
                }
            } catch (Exception ignored) {}
        });
    }

    private String buildProductsEndpoint(String q) {
        String base = "products"
                + "?select=id,slug,name,description,category_id,image_url,is_active,cost_estimated,stock_qty,created_at,updated_at"
                + "&is_active=eq.true"
                + "&order=created_at.desc"
                + "&limit=12";
        if (q != null && !q.trim().isEmpty()) {
            String pattern = "*" + q.trim() + "*";
            String encoded = Uri.encode(pattern);
            base += "&name=ilike." + encoded;
        }
        return base;
    }

    // ========= Utilitários =========
    private abstract static class SimpleTextWatcher implements TextWatcher {
        @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
        @Override public void afterTextChanged(android.text.Editable s) {}
    }

    private String getLower(Object obj, String... candidates) {
        String v = getStringByReflection(obj, candidates);
        return v == null ? "" : v.toLowerCase();
    }

    private @Nullable String getStringByReflection(Object obj, String... candidates) {
        if (obj == null || candidates == null) return null;
        Class<?> c = obj.getClass();
        for (String name : candidates) {
            if (name == null || name.isEmpty()) continue;
            String cap = name.substring(0, 1).toUpperCase() + name.substring(1);
            try {
                Method m = c.getMethod("get" + cap);
                Object r = m.invoke(obj);
                if (r != null) return String.valueOf(r);
            } catch (Exception ignored) {}
            try {
                Method m = c.getMethod("is" + cap);
                Object r = m.invoke(obj);
                if (r != null) return String.valueOf(r);
            } catch (Exception ignored) {}
            try {
                Field f = c.getField(name);
                Object r = f.get(obj);
                if (r != null) return String.valueOf(r);
            } catch (Exception ignored) {}
            try {
                Field f = c.getDeclaredField(name);
                f.setAccessible(true);
                Object r = f.get(obj);
                if (r != null) return String.valueOf(r);
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String listSignature(List<Product> list) {
        if (list == null || list.isEmpty()) return "empty";
        StringBuilder sb = new StringBuilder(list.size() * 16);
        for (Product p : list) sb.append(productKey(p)).append(';');
        return sb.toString();
    }

    private String productKey(Product p) {
        String id = getStringByReflection(p, "id", "uuid", "codigo", "code");
        String upd = getStringByReflection(p, "updated_at", "updatedAt", "updated");
        if (id == null) id = getStringByReflection(p, "slug", "sku");
        if (id == null) id = String.valueOf(p.hashCode());
        if (upd == null) upd = getStringByReflection(p, "name", "description");
        return id + "|" + upd;
    }

    // ===== Chips Controller interno =====
    // =====================================================================
// Controller de Chips (interno)
// =====================================================================
    private static final class FilterChipsController {

        interface OnFilterSelected { void onFilter(String category); }

        private final Context ctx;
        private final LinearLayout container;
        private final OnFilterSelected callback;
        private final SparseArray<String> idToCategory = new SparseArray<>();

        private @Nullable TextView selected;

        @ColorInt int colorWhite;
        @ColorInt int colorBlack;
        @ColorInt int colorGrayStroke;

        FilterChipsController(LinearLayout container, OnFilterSelected callback) {
            this.ctx = container.getContext();
            this.container = container;
            this.callback = callback;

            colorWhite = ContextCompat.getColor(ctx, R.color.white);
            colorBlack = ContextCompat.getColor(ctx, R.color.black);
            colorGrayStroke = ContextCompat.getColor(ctx, R.color.gray_200);

            putIfExists(R.id.chipTodos, "Todos");
            putIfExists(R.id.chipLanches, "Lanches");
            putIfExists(R.id.chipBebidas, "Bebidas");
            putIfExists(R.id.chipDoces, "Doces");
            putIfExists(R.id.chipPromocoes, "Promoções");

            // aplica estilo e listeners
            for (int i = 0; i < idToCategory.size(); i++) {
                int viewId = idToCategory.keyAt(i);
                TextView tv = container.findViewById(viewId);
                if (tv != null) {
                    applyDefaultStyle(tv);
                    tv.setOnClickListener(v -> selectChip(tv));
                }
            }

            // seleção padrão
            TextView chipTodos = safeFind(R.id.chipTodos);
            if (chipTodos != null) selectChip(chipTodos);
        }

        static FilterChipsController attach(LinearLayout container, OnFilterSelected callback) {
            return new FilterChipsController(container, callback);
        }

        /** <<< MÉTODO QUE FALTAVA >>>  */
        void selectById(int viewId) {
            TextView tv = safeFind(viewId);
            if (tv != null) selectChip(tv);
        }

        private void putIfExists(int id, String category) {
            View v = container.findViewById(id);
            if (v != null) idToCategory.put(id, category);
        }

        private @Nullable TextView safeFind(int id) {
            View v = container.findViewById(id);
            return (v instanceof TextView) ? (TextView) v : null;
        }

        private void selectChip(TextView tv) {
            if (selected != null && selected != tv) {
                applyDefaultStyle(selected);
                selected.setSelected(false);
            }
            applySelectedStyle(tv);
            tv.setSelected(true);
            selected = tv;

            View parent = (View) container.getParent();
            if (parent instanceof HorizontalScrollView) {
                ((HorizontalScrollView) parent).post(() ->
                        ((HorizontalScrollView) parent).smoothScrollTo(
                                Math.max(tv.getLeft() - dp(24), 0), 0
                        )
                );
            }

            String category = idToCategory.get(tv.getId());
            if (category != null && callback != null) callback.onFilter(category);
        }

        private void applyDefaultStyle(TextView tv) {
            int pL = tv.getPaddingLeft(), pT = tv.getPaddingTop(), pR = tv.getPaddingRight(), pB = tv.getPaddingBottom();
            tv.setBackground(createOutlineDrawable());
            tv.setTextColor(colorBlack);
            tv.setTypeface(Typeface.DEFAULT_BOLD);
            tv.setAlpha(1f);
            tv.setPadding(pL, pT, pR, pB);
        }

        private void applySelectedStyle(TextView tv) {
            int pL = tv.getPaddingLeft(), pT = tv.getPaddingTop(), pR = tv.getPaddingRight(), pB = tv.getPaddingBottom();
            tv.setBackground(ContextCompat.getDrawable(ctx, R.drawable.bg_chip_green));
            tv.setTextColor(colorWhite);
            tv.setTypeface(Typeface.DEFAULT_BOLD);
            tv.setAlpha(1f);
            tv.setPadding(pL, pT, pR, pB);
        }

        private GradientDrawable createOutlineDrawable() {
            GradientDrawable d = new GradientDrawable();
            d.setShape(GradientDrawable.RECTANGLE);
            d.setCornerRadius(dp(18f));
            d.setColor(0x00FFFFFF);
            d.setStroke(dp(2), colorGrayStroke);
            return d;
        }

        private int dp(float v) {
            return Math.round(v * ctx.getResources().getDisplayMetrics().density);
        }
    }

}
