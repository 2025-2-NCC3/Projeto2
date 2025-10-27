package com.example.aplicativocomedoriadatia;

public class Pedido {
    public String nomeAluno;
    public String itemPedido;
    public String status;

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
