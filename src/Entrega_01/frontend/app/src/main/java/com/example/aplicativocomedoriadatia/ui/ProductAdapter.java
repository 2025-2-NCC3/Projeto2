package com.example.aplicativocomedoriadatia.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.R;
import com.example.aplicativocomedoriadatia.model.Product;
import com.squareup.picasso.Picasso;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ProductAdapter extends RecyclerView.Adapter<ProductAdapter.VH> {

    private final List<Product> items = new ArrayList<>();

    public void setItems(List<Product> list) {
        items.clear();
        if (list != null) items.addAll(list);
        notifyDataSetChanged();
    }

    @Override public VH onCreateViewHolder(ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_product, parent, false);
        return new VH(v);
    }

    @Override public void onBindViewHolder(VH h, int position) {
        Product p = items.get(position);
        h.name.setText(p.name);

        // 🔧 CORREÇÃO: usar cost_estimated (double) e formatar em BRL
        String preco = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"))
                .format(p.cost_estimated);
        h.price.setText(String.format(new java.util.Locale("pt","BR"), "R$ %.2f", p.cost_estimated));


        if (p.image_url != null && !p.image_url.isEmpty()) {
            Picasso.get().load(p.image_url).fit().centerCrop()
                    .placeholder(android.R.color.darker_gray).into(h.img);
        } else {
            h.img.setImageResource(android.R.color.darker_gray);
        }
    }

    @Override public int getItemCount() { return items.size(); }

    static class VH extends RecyclerView.ViewHolder {
        ImageView img; TextView name; TextView price;
        VH(View v) {
            super(v);
            img = v.findViewById(R.id.img);
            name = v.findViewById(R.id.name);
            price = v.findViewById(R.id.price);
        }
    }
}
