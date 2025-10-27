package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import androidx.appcompat.app.AppCompatActivity;

import java.util.ArrayList;
import java.util.List;

public class BalcaoActivity extends AppCompatActivity {

    private List<Pedido> pedidos = new ArrayList<>();
    private ArrayAdapter<String> adapter;
    private List<String> nomesPedidos = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_balcao); //

        NavbarHelper.setup(this);

        ListView listView = findViewById(R.id.listPedidos); //

        // Pedidos de exemplo
        pedidos.add(new Pedido("João", "Hambúrguer"));
        pedidos.add(new Pedido("Maria", "Suco"));

        atualizarLista();

        adapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, nomesPedidos);
        listView.setAdapter(adapter);

        listView.setOnItemClickListener((parent, view, position, id) -> {
            Pedido pedido = pedidos.get(position);

            Intent intent = new Intent(BalcaoActivity.this, AlunoActivity.class);
            intent.putExtra("pedido", pedido);
            startActivity(intent);
        });
    }

    private void atualizarLista() {
        nomesPedidos.clear();
        for (Pedido p : pedidos) {
            nomesPedidos.add(p.getNomeAluno() + " - " + p.getItemPedido() + " [" + p.getStatus() + "]");
        }
        if (adapter != null) {
            adapter.notifyDataSetChanged();
        }
    }
}
