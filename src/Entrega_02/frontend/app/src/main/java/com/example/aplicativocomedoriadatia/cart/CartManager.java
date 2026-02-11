package com.example.aplicativocomedoriadatia.cart;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import com.example.aplicativocomedoriadatia.model.Product;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;

/**
 * Gerenciador de carrinho com persistência local (SharedPreferences).
 * Combina as funcionalidades do antigo e do novo CartManager.
 *
 * Agora com logs (CART_DEBUG) para entender preço/quantidade.
 */
public class CartManager {

    private static final String PREF = "cart_prefs";
    private static final String KEY = "cart_items";
    private static CartManager INSTANCE;

    private final SharedPreferences sp;
    private final Gson gson = new Gson();
    private final Type listType = new TypeToken<List<CartItem>>() {}.getType();

    private CartManager(Context ctx) {
        sp = ctx.getApplicationContext().getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    public static CartManager with(Context ctx) {
        if (INSTANCE == null) INSTANCE = new CartManager(ctx);
        return INSTANCE;
    }

    // ===== CRUD principal =====
    public synchronized List<CartItem> getItems() {
        String json = sp.getString(KEY, "[]");

        Log.d("CART_DEBUG", "CartManager.getItems() JSON bruto do SharedPreferences: " + json);

        List<CartItem> items = gson.fromJson(json, listType);
        if (items == null) {
            items = new ArrayList<>();
        }

        for (CartItem it : items) {
            if (it != null && it.product != null) {
                Log.d("CART_DEBUG", "CartManager.getItems() -> item carregado: " +
                        "name=" + it.product.name +
                        ", qty=" + it.qty +
                        ", cost_estimated=" + it.product.price
                );
            } else {
                Log.d("CART_DEBUG", "CartManager.getItems() -> item nulo ou sem product");
            }
        }

        return items;
    }

    private synchronized void save(List<CartItem> items) {
        String json = gson.toJson(items);
        Log.d("CART_DEBUG", "CartManager.save() salvando JSON: " + json);

        sp.edit().putString(KEY, json).apply();
    }

    public synchronized void clear() {
        Log.d("CART_DEBUG", "CartManager.clear() limpando carrinho");
        save(new ArrayList<>());
    }

    public synchronized void add(Product product, int qty) {
        Log.d("CART_DEBUG", "CartManager.add() chamado com qty=" + qty);
        if (product == null || qty <= 0) {
            Log.e("CART_DEBUG", "CartManager.add() abortado: product null ou qty <= 0");
            return;
        }

        List<CartItem> items = getItems();

        String id = product.id != null ? product.id : product.slug;
        boolean found = false;

        for (CartItem it : items) {
            String itId = it.product.id != null ? it.product.id : it.product.slug;
            if (id != null && id.equals(itId)) {
                it.qty += qty;
                found = true;
                Log.d("CART_DEBUG", "CartManager.add() produto já existia. Somando qty. Novo qty=" + it.qty);
                break;
            }
        }
        if (!found) {
            Log.d("CART_DEBUG", "CartManager.add() produto novo no carrinho: name=" + product.name +
                    ", cost_estimated=" + product.price +
                    ", qty=" + qty
            );
            items.add(new CartItem(product, qty));
        }

        save(items);
    }

    // Permite adicionar diretamente um CartItem
    public synchronized void add(CartItem item) {
        if (item == null || item.product == null) {
            Log.e("CART_DEBUG", "CartManager.add(item) abortado: item ou item.product null");
            return;
        }
        Log.d("CART_DEBUG", "CartManager.add(item) -> encaminhando para add(product, qty)");
        add(item.product, item.qty);
    }

    public synchronized void updateQty(Product product, int qty) {
        Log.d("CART_DEBUG", "CartManager.updateQty() qty=" + qty +
                " product=" + (product != null ? product.name : "null"));

        if (product == null) return;

        if (qty <= 0) {
            remove(product);
            return;
        }

        List<CartItem> items = getItems();
        String id = product.id != null ? product.id : product.slug;

        for (CartItem it : items) {
            String itId = it.product.id != null ? it.product.id : it.product.slug;
            if (id != null && id.equals(itId)) {
                it.qty = qty;
                Log.d("CART_DEBUG", "CartManager.updateQty() atualizado qty=" + qty + " para " + it.product.name);
                break;
            }
        }
        save(items);
    }

    public synchronized void remove(Product product) {
        Log.d("CART_DEBUG", "CartManager.remove() product=" +
                (product != null ? product.name : "null"));

        if (product == null) return;
        List<CartItem> items = getItems();

        String id = product.id != null ? product.id : product.slug;
        for (Iterator<CartItem> it = items.iterator(); it.hasNext();) {
            CartItem c = it.next();
            String itId = c.product.id != null ? c.product.id : c.product.slug;
            if (id != null && id.equals(itId)) {
                Log.d("CART_DEBUG", "CartManager.remove() removendo " + c.product.name);
                it.remove();
                break;
            }
        }
        save(items);
    }

    // ===== Utilitários =====
    public synchronized double getTotal() {
        double total = 0.0;
        List<CartItem> items = getItems();

        for (CartItem it : items) {
            double price = 0.0;
            if (it.product != null) {
                price = it.product.price;
            }

            Log.d("CART_DEBUG", "CartManager.getTotal() item=" +
                    (it.product != null ? it.product.name : "null") +
                    " qty=" + it.qty +
                    " unitPrice(cost_estimated)=" + price +
                    " subtotal=" + (price * it.qty)
            );

            total += price * it.qty;
        }

        Log.d("CART_DEBUG", "CartManager.getTotal() total final=" + total);
        return total;
    }

    public static String brl(double v) {
        return NumberFormat.getCurrencyInstance(new Locale("pt", "BR")).format(v);
    }
}