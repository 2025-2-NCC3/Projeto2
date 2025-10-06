package com.example.aplicativocomedoriadatia.cart;

import android.content.Context;
import android.content.SharedPreferences;

import com.example.aplicativocomedoriadatia.model.Product;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

public class CartManager {

    private static final String PREF = "cart_prefs";
    private static final String KEY  = "cart_items";
    private static CartManager INSTANCE;

    private final SharedPreferences sp;
    private final Gson gson = new Gson();
    private final Type listType = new TypeToken<List<CartItem>>(){}.getType();

    private CartManager(Context ctx) {
        sp = ctx.getApplicationContext().getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    public static CartManager with(Context ctx) {
        if (INSTANCE == null) INSTANCE = new CartManager(ctx);
        return INSTANCE;
    }

    // CRUD básico
    public synchronized List<CartItem> getItems() {
        String json = sp.getString(KEY, "[]");
        List<CartItem> items = gson.fromJson(json, listType);
        return items != null ? items : new ArrayList<>();
    }

    private synchronized void save(List<CartItem> items) {
        sp.edit().putString(KEY, gson.toJson(items)).apply();
    }

    public synchronized void clear() {
        save(new ArrayList<>());
    }

    public synchronized void add(Product p, int qty) {
        if (p == null || qty <= 0) return;
        List<CartItem> items = getItems();

        // mesma identidade por id/slug
        String id = p.id != null ? p.id : p.slug;
        boolean found = false;

        for (CartItem it : items) {
            String itId = it.product.id != null ? it.product.id : it.product.slug;
            if (id != null && id.equals(itId)) {
                it.qty += qty;
                found = true;
                break;
            }
        }
        if (!found) items.add(new CartItem(p, qty));

        save(items);
    }

    public synchronized void updateQty(Product p, int qty) {
        if (p == null) return;
        if (qty <= 0) { remove(p); return; }

        List<CartItem> items = getItems();
        String id = p.id != null ? p.id : p.slug;

        for (CartItem it : items) {
            String itId = it.product.id != null ? it.product.id : it.product.slug;
            if (id != null && id.equals(itId)) {
                it.qty = qty;
                break;
            }
        }
        save(items);
    }

    public synchronized void remove(Product p) {
        if (p == null) return;
        List<CartItem> items = getItems();

        String id = p.id != null ? p.id : p.slug;
        for (Iterator<CartItem> it = items.iterator(); it.hasNext();) {
            CartItem c = it.next();
            String itId = c.product.id != null ? c.product.id : c.product.slug;
            if (id != null && id.equals(itId)) {
                it.remove();
                break;
            }
        }
        save(items);
    }

    public synchronized double getTotal() {
        double total = 0.0;
        for (CartItem it : getItems()) {
            double price = (it.product != null) ? it.product.cost_estimated : 0.0;
            total += price * it.qty;
        }
        return total;
    }

    public static String brl(double v) {
        return NumberFormat.getCurrencyInstance(new Locale("pt","BR")).format(v);
    }
}
