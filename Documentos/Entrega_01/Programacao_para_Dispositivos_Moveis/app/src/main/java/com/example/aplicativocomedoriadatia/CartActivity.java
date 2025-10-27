package com.example.aplicativocomedoriadatia;

import android.content.Intent;
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
//arrumado
    private RecyclerView recycler;
    private TextView tvTotal;
    private Button btnCheckout, btnContinue;
    private CartAdapter adapter;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cart);

        recycler = findViewById(R.id.recyclerCart);
        tvTotal  = findViewById(R.id.tvTotal);
        btnCheckout = findViewById(R.id.btnCheckout);
        btnContinue = findViewById(R.id.btnContinue);

        adapter = new CartAdapter(this);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        recycler.setAdapter(adapter);

        btnCheckout.setOnClickListener(v -> {
            if (adapter.getItemCount() == 0) {
                Toast.makeText(this, "Carrinho vazio.", Toast.LENGTH_SHORT).show();
            } else {
                String totalText = tvTotal.getText().toString();
                double totalValue = extractValueFromText(totalText);

                Intent intent = new Intent(CartActivity.this, PaymentActivity.class);
                intent.putExtra("total_amount", totalValue);
                startActivity(intent);
            }
        });

        btnContinue.setOnClickListener(v -> {
            Intent it = new Intent(CartActivity.this, HomeActivity.class);
            startActivity(it);
        });

        Intent it = getIntent();

        String name = it.getStringExtra("name");
        String desc = it.getStringExtra("description");
        String image = it.getStringExtra("image_url");
        double price = it.getDoubleExtra("price", 0.0);
        double cost_estimated = it.getDoubleExtra("price", 0.0);
        boolean isOffer = it.getBooleanExtra("is_offer", false);
        String endsAt = it.getStringExtra("ends_at");
    }

    private double extractValueFromText(String text) {
        try {
            // Remove "R$", espaços e substitui vírgula por ponto
            String cleanText = text.replace("R$", "").replace(",", ".").trim();
            return Double.parseDouble(cleanText);
        } catch (NumberFormatException e) {
            return 0.0;
        }
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