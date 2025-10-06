// app/src/main/java/com/example/aplicativocomedoriadatia/CartActivity.java
package com.example.aplicativocomedoriadatia;

import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.cart.CartItem;
import com.example.aplicativocomedoriadatia.cart.CartManager;
import com.example.aplicativocomedoriadatia.ui.CartAdapter;

import java.util.List;

public class CartActivity extends AppCompatActivity implements CartAdapter.CartActions {

    private RecyclerView recycler;
    private TextView tvTotal;
    private Button btnCheckout, btnClear;
    private CartAdapter adapter;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cart);

        recycler = findViewById(R.id.recyclerCart);
        tvTotal  = findViewById(R.id.tvTotal);
        btnCheckout = findViewById(R.id.btnCheckout);
        btnClear    = findViewById(R.id.btnClear);

        adapter = new CartAdapter(this);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        recycler.setAdapter(adapter);

        btnCheckout.setOnClickListener(v -> {
            if (adapter.getItemCount() == 0) {
                Toast.makeText(this, "Carrinho vazio.", Toast.LENGTH_SHORT).show();
            } else {
                // aqui você integra com sua tela/fluxo de pagamento
                Toast.makeText(this, "Finalizando compra...", Toast.LENGTH_SHORT).show();
            }
        });

        btnClear.setOnClickListener(v -> {
            CartManager.with(getApplicationContext()).clear();
            loadData();
            Toast.makeText(this, "Carrinho limpo.", Toast.LENGTH_SHORT).show();
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadData();
    }

    private void loadData() {
        List<CartItem> items = CartManager.with(getApplicationContext()).getItems();
        adapter.setItems(items);
        updateTotal();
    }

    private void updateTotal() {
        double total = CartManager.with(getApplicationContext()).getTotal();
        tvTotal.setText(CartManager.brl(total));
    }

    // ===== callbacks do adapter =====
    @Override
    public void onIncrease(CartItem item) {
        CartManager.with(getApplicationContext()).updateQty(item.product, item.qty + 1);
        loadData();
    }

    @Override
    public void onDecrease(CartItem item) {
        int newQty = Math.max(0, item.qty - 1);
        CartManager.with(getApplicationContext()).updateQty(item.product, newQty);
        loadData();
    }

    @Override
    public void onRemove(CartItem item) {
        CartManager.with(getApplicationContext()).remove(item.product);
        loadData();
    }
}
