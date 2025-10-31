package com.example.aplicativocomedoriadatia;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextWatcher;
import android.util.Log;
import android.util.SparseArray;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.animation.ScaleAnimation;
import android.widget.Button;
import android.widget.HorizontalScrollView;
import android.widget.ImageButton;
import android.widget.ImageView; // para imgCart no ActionView
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.ColorInt;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.appcompat.widget.Toolbar;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
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

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.text.ParsePosition;
import java.text.SimpleDateFormat;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class HomeActivity extends AppCompatActivity {

    private static final String TAG = "HomeActivity";

    // ===== Refresh/Notificações =====
    private static final long AUTO_REFRESH_MS = 20_000L;
    private static final String CHANNEL_ID = "promo_channel";
    private static final int REQ_POST_NOTIF = 1001;
    private static final String PREFS_NAME = "home_prefs";
    private static final String KEY_LAST_CREATED_AT_MS = "last_created_at_ms";
    private static final int MAX_NOTIFS_PER_CYCLE = 3;

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

    // ===== Dados =====
    private final ProductAdapter adapter = new ProductAdapter();
    private final List<Product> masterProducts = new ArrayList<>();
    private String selectedCategory = "Todos";
    private FilterChipsController chipsController;
    private ExecutorService executor;

    // ===== Badge do carrinho (no ActionView do menu) =====
    private TextView tvBadge;

    // ===== Busca com debounce =====
    private final Handler searchHandler = new Handler(Looper.getMainLooper());
    private Runnable searchRunnable;

    private ImageButton cartBTN;

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
        cartBTN = findViewById(R.id.cartBTN);

        toolbar = findViewById(R.id.toolbar);
        if (toolbar != null) setSupportActionBar(toolbar);

        setupHeaderAndChips();
        setupRecycler();
        setupRetry();
        NavbarHelper.setup(this);
        setupSearch();

        executor = Executors.newSingleThreadExecutor();
        fetchProducts(null);

        if (cartBTN != null) {
            cartBTN.setOnClickListener(v -> {
                Intent it = new Intent(this, CartActivity.class);
                startActivity(it);
            });
        }

        // Notificações: cria canal + pede permissão (se necessário)
        ensureNotificationChannel();
        askNotificationPermissionIfNeeded();
    }

    // ===== MENU / ACTION VIEW: infla menu e conecta o badge =====
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_home_top, menu);
        MenuItem cartItem = menu.findItem(R.id.action_cart);
        View actionView = (cartItem != null) ? cartItem.getActionView() : null;

        if (actionView != null) {
            tvBadge = actionView.findViewById(R.id.tvBadge);
            ImageView imgCart = actionView.findViewById(R.id.imgCart);
            updateCartBadge(false);

            actionView.setOnClickListener(v -> {
                startActivity(new Intent(this, CartActivity.class));
            });
        }
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
                        tvBadge.getWidth() / 2f, tvBadge.getHeight() / 2f
                );
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

    // ================= Conteúdo / produtos =================
    private void setupHeaderAndChips() {
        if (btnSeeAll != null) {
            btnSeeAll.setOnClickListener(v -> {
                Intent it = new Intent(this, AllProductsActivity.class);
                startActivity(it);
            });
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
        it.putExtra("price", product.price);
        it.putExtra("is_offer", false);
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
        updateCartBadge(false);

        // <<< Verifica lançamentos e notifica >>>
        maybeNotifyNewProducts(products);
    }

    private void showError(String message) {
        shimmer.stopShimmer();
        shimmer.setVisibility(View.GONE);
        recycler.setVisibility(View.GONE);
        errorBox.setVisibility(View.VISIBLE);
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        updateCartBadge(false);
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

    // ========= BUSCA NO SUPABASE (usando a nova tabela) =========
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
                Log.e(TAG, "fetchProducts(): erro", e);
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
                        updateCartBadge(false);
                        // <<< Notifica lançamentos tb no refresh silencioso >>>
                        maybeNotifyNewProducts(list);
                    });
                }
            } catch (Exception ignored) {}
        });
    }

    /** Monta o endpoint para a tabela 'produtos_teste'. */
    private String buildProductsEndpoint(String q) {
        String base = "produtos_teste"
                + "?select="
                + "id,slug,name,description,image_url,"
                + "is_active,stock_qty,"
                + "price,promotion_price,has_promotion,"
                + "starts_at,ends_at,"
                + "features,nutrition,"
                + "created_at,updated_at"
                + "&is_active=eq.true"
                + "&order=created_at.desc"   // <<< ordena por lançamentos
                + "&limit=50";

        if (q != null && !q.trim().isEmpty()) {
            String pattern = "*" + q.trim() + "*";
            String encoded = Uri.encode(pattern);
            base += "&name=ilike." + encoded;
        }
        return base;
    }

    // ========= Notificações baseadas em novos produtos =========

    private void ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    "Novos produtos",
                    NotificationManager.IMPORTANCE_HIGH
            );
            nm.createNotificationChannel(ch);
        }
    }

    private void askNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                        REQ_POST_NOTIF
                );
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode, String[] permissions, int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        // aqui não disparamos nada imediato; as notificações vêm no próximo refresh
    }

    /** Verifica produtos com created_at > último visto e dispara notificações. */
    private void maybeNotifyNewProducts(@Nullable List<Product> list) {
        if (list == null || list.isEmpty()) return;

        long lastSeen = getPrefs().getLong(KEY_LAST_CREATED_AT_MS, 0L);

        // Filtra apenas os realmente novos (com created_at maior que o último visto)
        List<Product> fresh = new ArrayList<>();
        long maxSeen = lastSeen;
        int count = 0;

        for (Product p : list) {
            if (p == null) continue;
            long createdMs = parseCreatedAtToMillis(p.created_at);
            if (createdMs > 0) {
                if (createdMs > lastSeen) {
                    fresh.add(p);
                    count++;
                    if (count >= MAX_NOTIFS_PER_CYCLE) break; // evita spam
                }
                if (createdMs > maxSeen) maxSeen = createdMs;
            }
        }

        if (!fresh.isEmpty()) {
            // Notifica cada novo (ou faça uma agrupada se preferir)
            for (Product p : fresh) {
                sendNewProductNotification(p);
            }
            // Atualiza o marcador de último created_at visto
            getPrefs().edit().putLong(KEY_LAST_CREATED_AT_MS, maxSeen).apply();
        } else {
            // Mesmo sem notificação, mantém o maior created_at para evitar repetir
            long top = parseCreatedAtToMillis(list.get(0).created_at);
            if (top > lastSeen) {
                getPrefs().edit().putLong(KEY_LAST_CREATED_AT_MS, top).apply();
            }
        }
    }

    /** Envia uma notificação para um único produto novo. */
    private void sendNewProductNotification(Product p) {
        if (p == null) return;

        String title = "Novo produto: " + safe(p.name, "Item novo!");
        String body  = safe(p.description, "Confira as novidades no cardápio.");

        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        // Intent para abrir detalhes do produto
        Intent intent = new Intent(this, ProductDetailsActivity.class);
        intent.putExtra("product", p);
        intent.putExtra("price", p.price);
        intent.putExtra("is_offer", false);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pi = PendingIntent.getActivity(
                this,
                (int) System.currentTimeMillis(),
                intent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                        ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                        : PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(R.drawable.ic_logo_comedoria)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)
                        .setContentIntent(pi);

        nm.notify((int) System.currentTimeMillis(), builder.build());
    }

    private String safe(String v, String fallback) {
        return (v == null || v.trim().isEmpty()) ? fallback : v.trim();
    }

    /** Converte created_at ISO → epoch millis (tenta java.time e fallback para SimpleDateFormat). */
    private long parseCreatedAtToMillis(@Nullable String iso) {
        if (iso == null || iso.trim().isEmpty()) return 0L;

        // Tenta java.time (API 26+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                // Supabase geralmente retorna "yyyy-MM-dd'T'HH:mm:ss[.SSS][XXX]"
                OffsetDateTime odt = OffsetDateTime.parse(iso, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                return odt.toInstant().toEpochMilli();
            } catch (Exception ignored) {}
            try {
                // caso venha sem offset/timezone, tenta como LocalDateTime assumindo UTC
                DateTimeFormatter f = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss[.SSS]");
                return java.time.LocalDateTime.parse(iso, f)
                        .toInstant(java.time.ZoneOffset.UTC).toEpochMilli();
            } catch (Exception ignored) {}
        }

        // Fallback (API < 26) — tenta alguns formatos comuns
        try {
            SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX", Locale.US);
            return f.parse(iso, new ParsePosition(0)).getTime();
        } catch (Exception ignored) {}
        try {
            SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssX", Locale.US);
            return f.parse(iso, new ParsePosition(0)).getTime();
        } catch (Exception ignored) {}

        return 0L;
    }

    private SharedPreferences getPrefs() {
        return getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
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

            for (int i = 0; i < idToCategory.size(); i++) {
                int viewId = idToCategory.keyAt(i);
                TextView tv = container.findViewById(viewId);
                if (tv != null) {
                    applyDefaultStyle(tv);
                    tv.setOnClickListener(v -> selectChip(tv));
                }
            }

            TextView chipTodos = safeFind(R.id.chipTodos);
            if (chipTodos != null) selectChip(chipTodos);
        }

        static FilterChipsController attach(LinearLayout container, OnFilterSelected callback) {
            return new FilterChipsController(container, callback);
        }

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
