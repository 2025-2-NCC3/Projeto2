package com.example.aplicativocomedoriadatia;

import java.io.Serializable;

public class Pedido implements Serializable {
    private String nomeAluno;
    private String itemPedido;
    private String status;

    public Pedido(String nomeAluno, String itemPedido) {
        this.nomeAluno = nomeAluno;
        this.itemPedido = itemPedido;
        this.status = "Recebido"; // status inicial
    }

    public String getNomeAluno() {
        return nomeAluno;
    }

    public String getItemPedido() {
        return itemPedido;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
