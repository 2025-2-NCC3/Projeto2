package com.example.aplicativocomedoriadatia;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.ui.StatusAdapter;

public class AlunoActivity extends AppCompatActivity {

    private RecyclerView recyclerStatus;
    private Pedido pedido;
    private TextView tvNomePedido;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_aluno);

        NavbarHelper.setup(this);

        recyclerStatus = findViewById(R.id.recyclerStatus);
        recyclerStatus.setLayoutManager(new LinearLayoutManager(this));

        tvNomePedido = findViewById(R.id.tvNomePedido);

        pedido = (Pedido) getIntent().getSerializableExtra("pedido");

        if (pedido != null) {
            tvNomePedido.setText("Pedido de: " + pedido.getNomeAluno());
        }

        atualizarLinhaDoTempo();
    }

    private void atualizarLinhaDoTempo() {
        // status possíveis do pedido
        String[] status = {"Recebido", "Preparando", "Pronto"};

        // adapter que controla-exibe na linha do tempo
        StatusAdapter adapter = new StatusAdapter(status, pedido.getStatus());
        recyclerStatus.setAdapter(adapter);
    }


    public void atualizarPedido(String novoStatus) {
        pedido.setStatus(novoStatus);
        atualizarLinhaDoTempo();
    }
}
