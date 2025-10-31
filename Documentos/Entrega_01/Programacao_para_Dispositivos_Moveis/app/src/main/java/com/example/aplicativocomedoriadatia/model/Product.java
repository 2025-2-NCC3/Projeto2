package com.example.aplicativocomedoriadatia.model;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

/**
 * Modelo atualizado para refletir a tabela pública produtos_teste
 * do Supabase. Inclui campos de preço, promoção e JSONB.
 */
public class Product implements Serializable {
    private static final long serialVersionUID = 1L;

    // Identificação e informações básicas
    @SerializedName("id")           public String id;
    @SerializedName("slug")         public String slug;
    @SerializedName("name")         public String name;
    @SerializedName("description")  public String description;

    // URLs e imagens
    @SerializedName("image_url")    public String image_url;

    // Status e controle
    @SerializedName("is_active")    public Boolean is_active;
    @SerializedName("stock_qty")    public int stock_qty;

    // Preços e promoções
    @SerializedName("price")             public double price;             // preço base (price)
    @SerializedName("promotion_price")   public Double promotion_price;   // preço promocional (pode ser null)
    @SerializedName("has_promotion")     public Boolean has_promotion;

    // Período da promoção
    @SerializedName("starts_at")    public String starts_at;
    @SerializedName("ends_at")      public String ends_at;

    // Dados extras (JSONB)
    @SerializedName("features")     public Object features;   // JSONB: ex. atributos adicionais
    @SerializedName("nutrition")    public Object nutrition;  // JSONB: tabela nutricional

    // Datas do registro
    @SerializedName("created_at")   public String created_at;
    @SerializedName("updated_at")   public String updated_at;
}
