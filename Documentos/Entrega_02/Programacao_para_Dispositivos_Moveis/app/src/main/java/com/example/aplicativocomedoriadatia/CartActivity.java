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

import java.util.ArrayList;
import java.util.List;

public class CartActivity extends AppCompatActivity implements CartAdapter.CartActions {

    private RecyclerView recycler;
    private TextView tvTotal;
    private Button btnCheckout, btnContinue;
    private CartAdapter adapter;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cart);

        recycler = findViewById(R.id.recyclerCart);
        tvTotal = findViewById(R.id.tvTotal);
        btnCheckout = findViewById(R.id.btnCheckout);
        btnContinue = findViewById(R.id.btnContinue);

        adapter = new CartAdapter(this);
        recycler.setLayoutManager(new LinearLayoutManager(this));
        recycler.setAdapter(adapter);

        btnCheckout.setOnClickListener(v -> {
            if (adapter.getItemCount() == 0) {
                Toast.makeText(this, "Carrinho vazio.", Toast.LENGTH_SHORT).show();
            } else {
                // Pega os itens do carrinho
                List<CartItem> cartItems = CartManager.with(getApplicationContext()).getItems();
                double totalValue = CartManager.with(getApplicationContext()).getTotal();

                // ✅ Cria intent para a tela de pagamento (envia apenas o necessário)
                Intent paymentIntent = new Intent(CartActivity.this, PaymentActivity.class);
                paymentIntent.putExtra("total_amount", totalValue);
                // Não precisa enviar os itens aqui, o PaymentActivity vai pegar do CartManager

                startActivity(paymentIntent);
            }
        });


        btnContinue.setOnClickListener(v -> {
            Intent it = new Intent(CartActivity.this, HomeActivity.class);
            startActivity(it);
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
        String formattedTotal = formatToBrazilianCurrency(total);
        tvTotal.setText(formattedTotal);
    }

    private String formatToBrazilianCurrency(double value) {
        return String.format("R$ %.2f", value).replace(".", ",");
    }

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