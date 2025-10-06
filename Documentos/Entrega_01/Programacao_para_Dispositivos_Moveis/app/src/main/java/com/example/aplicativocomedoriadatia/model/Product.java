package com.example.aplicativocomedoriadatia.model;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

public class Product implements Serializable {
    private static final long serialVersionUID = 1L;

    @SerializedName("id")             public String id;           // uuid
    @SerializedName("slug")           public String slug;
    @SerializedName("name")           public String name;
    @SerializedName("description")    public String description;

    @SerializedName("category_id")    public String category_id;  // fk (uuid)
    @SerializedName("image_url")      public String image_url;

    @SerializedName("is_active")      public Boolean is_active;
    @SerializedName("cost_estimated") public double cost_estimated; // usa como "price"
    @SerializedName("stock_qty")      public int stock_qty;

    @SerializedName("created_at")     public String created_at;
    @SerializedName("updated_at")     public String updated_at;
}
