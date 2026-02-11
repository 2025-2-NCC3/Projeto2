package com.example.aplicativocomedoriadatia.cart;

import com.example.aplicativocomedoriadatia.model.Product;

import java.io.Serializable;

public class CartItem implements Serializable {
    public Product product;
    public int qty;

    public CartItem() {}

    public CartItem(Product product, int qty) {
        this.product = product;
        this.qty = qty;
    }
}
