package com.example.aplicativocomedoriadatia;

import java.util.ArrayList;
import java.util.List;

public class OrderManager {
    private static final List<Pedido> pedidos = new ArrayList<>();

    public static void adicionarPedido(Pedido pedido) {
        pedidos.add(pedido);
    }

    public static List<Pedido> getPedidos() {
        return pedidos;
    }
}
