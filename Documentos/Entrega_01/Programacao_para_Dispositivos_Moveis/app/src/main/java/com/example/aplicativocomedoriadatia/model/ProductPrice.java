package com.example.aplicativocomedoriadatia.model;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

public class ProductPrice implements Serializable {
    private static final long serialVersionUID = 1L;

    @SerializedName("id")         public String id;          // uuid
    @SerializedName("product_id") public String product_id;  // uuid (FK → products.id)
    @SerializedName("price")      public double price;       // valor numérico
    @SerializedName("starts_at")  public String starts_at;   // timestamptz
    @SerializedName("ends_at")    public String ends_at;     // timestamptz (pode ser nulo)
    @SerializedName("name")       public String name;        // texto opcional (descrição)

    @SerializedName("product")    public Product product;
}
