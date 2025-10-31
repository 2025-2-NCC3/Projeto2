package com.example.aplicativocomedoriadatia;

import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.cart.CartItem;
import com.example.aplicativocomedoriadatia.ui.OrdersAdapter;

import java.util.ArrayList;

public class OrdersActivity extends AppCompatActivity {

    private RecyclerView recyclerOrders;
    private TextView tvTotal;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_orders);

        NavbarHelper.setup(this);

        recyclerOrders = findViewById(R.id.recyclerOrders);
        tvTotal = findViewById(R.id.tvTotal);

        // Recupera os dados
        ArrayList<CartItem> produtos = (ArrayList<CartItem>) getIntent().getSerializableExtra("produtos");
        double total = getIntent().getDoubleExtra("total", 0.0);

        if (produtos == null || produtos.isEmpty()) {
            Toast.makeText(this, "Nenhum produto recebido", Toast.LENGTH_SHORT).show();
        }

        // Exibe o total formatado
        tvTotal.setText(String.format("R$ %.2f", total).replace(".", ","));

        // Configura o RecyclerView
        recyclerOrders.setLayoutManager(new LinearLayoutManager(this));
        recyclerOrders.setAdapter(new OrdersAdapter(produtos != null ? produtos : new ArrayList<>()));
    }
}