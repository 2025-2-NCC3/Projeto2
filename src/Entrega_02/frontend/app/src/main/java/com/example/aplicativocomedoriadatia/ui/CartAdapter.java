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
import com.example.aplicativocomedoriadatia.cart.CartItem;
import com.example.aplicativocomedoriadatia.cart.CartManager;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.List;

public class CartAdapter extends RecyclerView.Adapter<CartAdapter.VH> {

    public interface CartActions {
        void onIncrease(CartItem item);
        void onDecrease(CartItem item);
        void onRemove(CartItem item);
    }

    private final List<CartItem> items = new ArrayList<>();
    private final CartActions actions;

    public CartAdapter(CartActions actions) {
        this.actions = actions;
    }

    public void setItems(List<CartItem> data) {
        items.clear();
        if (data != null) items.addAll(data);
        notifyDataSetChanged();
    }

    @NonNull @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_cart, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        CartItem it = items.get(position);

        String name = it.product != null && it.product.name != null ? it.product.name : "Produto";
        double price = (it.product != null) ? it.product.price : 0.0;
        double subtotal = price * it.qty;

        h.name.setText(name);
        h.price.setText(CartManager.brl(price));
        h.qty.setText(String.valueOf(it.qty));
        h.subtotal.setText(CartManager.brl(subtotal));

        if (it.product != null && it.product.image_url != null && !it.product.image_url.isEmpty()) {
            Picasso.get().load(it.product.image_url).fit().centerCrop()
                    .placeholder(android.R.color.darker_gray).into(h.img);
        } else {
            h.img.setImageResource(android.R.color.darker_gray);
        }

        h.btnPlus.setOnClickListener(v -> {
            if (actions != null) actions.onIncrease(it);
        });
        h.btnMinus.setOnClickListener(v -> {
            if (actions != null) actions.onDecrease(it);
        });
        h.btnRemove.setOnClickListener(v -> {
            if (actions != null) actions.onRemove(it);
        });
    }

    @Override public int getItemCount() { return items.size(); }

    static class VH extends RecyclerView.ViewHolder {
        ImageView img;
        TextView name, price, qty, subtotal;
        ImageButton btnPlus, btnMinus, btnRemove;

        VH(@NonNull View v) {
            super(v);
            img = v.findViewById(R.id.img);
            name = v.findViewById(R.id.name);
            price = v.findViewById(R.id.price);
            qty = v.findViewById(R.id.qty);
            subtotal = v.findViewById(R.id.subtotal);
            btnPlus = v.findViewById(R.id.btnPlus);
            btnMinus = v.findViewById(R.id.btnMinus);
            btnRemove = v.findViewById(R.id.btnRemove);
        }
    }
}
