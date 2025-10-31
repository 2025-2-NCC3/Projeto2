package com.example.aplicativocomedoriadatia.model;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

/**
 * Modelo compatível com a tabela produtos_teste.
 * Usado na tela de ofertas e detalhes.
 */
public class ProductPrice implements Serializable {
    private static final long serialVersionUID = 1L;

    // ID do produto (tabela produtos_teste.id)
    @SerializedName("id")
    public String id;

    // Preço de promoção (promotion_price -> price)
    @SerializedName("price")
    public double price;

    // Período de validade da promoção
    @SerializedName("starts_at")
    public String starts_at;

    @SerializedName("ends_at")
    public String ends_at;

    // Nome opcional (não obrigatório, mas mantido para compatibilidade)
    @SerializedName("name")
    public String name;

    // Produto aninhado (usado pelo adapter e tela de detalhes)
    @SerializedName("product")
    public Product product;
}
