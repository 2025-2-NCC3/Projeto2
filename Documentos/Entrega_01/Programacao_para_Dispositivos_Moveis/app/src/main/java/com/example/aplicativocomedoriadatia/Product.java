package com.example.aplicativocomedoriadatia;

import java.io.Serializable;

public class Product implements Serializable {
    public String id;
    public String slug;
    public String name;
    public String description;
    public double cost_estimated;
    public String image_url;
    public boolean is_active;

    // Construtores
    public Product() {}

    public Product(String id, String name, String description, double cost_estimated, String image_url) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.cost_estimated = cost_estimated;
        this.image_url = image_url;
    }
}