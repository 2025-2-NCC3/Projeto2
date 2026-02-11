package com.example.aplicativocomedoriadatia.model;

import com.example.aplicativocomedoriadatia.cart.CartItem;

import java.io.Serializable;
import java.util.List;

public class Order implements Serializable {
    private List<CartItem> itens;
    private double total;

    public Order(List<CartItem> itens, double total) {
        this.itens = itens;
        this.total = total;
    }

    public List<CartItem> getItens() {
        return itens;
    }

    public double getTotal() {
        return total;
    }
}
