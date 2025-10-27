package com.example.aplicativocomedoriadatia.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.R;
import com.example.aplicativocomedoriadatia.model.Product;
import com.squareup.picasso.Picasso;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ProductAdapter extends RecyclerView.Adapter<ProductAdapter.VH> {

    // ==================== Interfaces ====================
    public interface OnItemClickListener {
        void onItemClick(Product product);
    }

    public interface OnAddToCartListener {
        void onAddToCart(Product product);
    }

    private OnItemClickListener clickListener;
    private OnAddToCartListener onAddToCartListener;

    public void setOnItemClickListener(OnItemClickListener l) {
        this.clickListener = l;
    }

    public void setOnAddToCartListener(OnAddToCartListener listener) {
        this.onAddToCartListener = listener;
    }

    // ==================== Dados ====================
    private final List<Product> items = new ArrayList<>();
    private final NumberFormat brl = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));

    public void setItems(List<Product> list) {
        items.clear();
        if (list != null) items.addAll(list);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_product, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Product p = items.get(position);

        // Nome
        h.name.setText(p.name != null ? p.name : "Produto");

        // Preço (usando cost_estimated como preço)
        double val = p.price;
        h.price.setText(brl.format(val));

        // Imagem
        if (p.image_url != null && !p.image_url.isEmpty()) {
            Picasso.get()
                    .load(p.image_url)
                    .fit()
                    .centerCrop()
                    .placeholder(android.R.color.darker_gray)
                    .into(h.img);
        } else {
            h.img.setImageResource(android.R.color.darker_gray);
        }

        // Clique no item → abre detalhes
        h.itemView.setOnClickListener(v -> {
            if (clickListener != null) clickListener.onItemClick(p);
        });

        // Clique no botão "+" → adiciona ao carrinho
        if (h.btnAdd != null) {
            h.btnAdd.setOnClickListener(v -> {
                if (onAddToCartListener != null) {
                    onAddToCartListener.onAddToCart(p);
                }
            });
        }
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    // ==================== ViewHolder ====================
    static class VH extends RecyclerView.ViewHolder {
        final ImageView img;
        final TextView name;
        final TextView price;
        final ImageButton btnAdd;

        VH(@NonNull View v) {
            super(v);
            img = v.findViewById(R.id.img);
            name = v.findViewById(R.id.name);
            price = v.findViewById(R.id.price);
            btnAdd = v.findViewById(R.id.btnAdd); // botão de adicionar ao carrinho (se existir)

            if (img == null || name == null || price == null) {
                throw new IllegalStateException(
                        "item_product.xml precisa ter os IDs: @id/img, @id/name, @id/price e opcionalmente @id/btnAdd"
                );
            }
        }
    }
}
