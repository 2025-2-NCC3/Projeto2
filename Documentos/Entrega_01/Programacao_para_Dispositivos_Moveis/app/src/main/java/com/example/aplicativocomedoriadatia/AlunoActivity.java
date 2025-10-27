package com.example.aplicativocomedoriadatia;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

public class AlunoActivity extends AppCompatActivity {

    private RecyclerView recyclerStatus;
    private Pedido pedido;
    private TextView tvNomePedido;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_aluno);

        recyclerStatus = findViewById(R.id.recyclerStatus);
        recyclerStatus.setLayoutManager(new LinearLayoutManager(this));

        tvNomePedido = findViewById(R.id.tvNomePedido);

        // aqui cria um pedido de ex (pode ser subs. depois por dados reais)
        pedido = new Pedido("João", "Hambúrguer");

        // mostra o nome do aluno no topo
        tvNomePedido.setText("Pedido de: " + pedido.getNomeAluno());

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
