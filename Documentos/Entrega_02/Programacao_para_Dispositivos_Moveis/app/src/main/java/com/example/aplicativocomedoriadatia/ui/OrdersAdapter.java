package com.example.aplicativocomedoriadatia.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.R;
import com.example.aplicativocomedoriadatia.cart.CartItem;
import com.squareup.picasso.Picasso;

import java.util.List;
import java.util.Locale;

public class OrdersAdapter extends RecyclerView.Adapter<OrdersAdapter.ViewHolder> {

    private final List<CartItem> produtos; // agora trabalha com objetos, não apenas Strings

    public OrdersAdapter(List<CartItem> produtos) {
        this.produtos = produtos;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_order, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        CartItem item = produtos.get(position);

        if (item.product != null) {
            holder.name.setText(item.product.name);
            holder.price.setText(String.format(Locale.getDefault(), "R$ %.2f", item.product.price));
            holder.qty.setText(String.format(Locale.getDefault(), "Qtd: %d", item.qty));

            if (item.product.image_url != null && !item.product.image_url.isEmpty()) {
                Picasso.get()
                        .load(item.product.image_url)
                        .placeholder(R.drawable.ic_placeholder)
                        .into(holder.img);
            } else {
                holder.img.setImageResource(R.drawable.ic_placeholder);
            }
        }
    }

    @Override
    public int getItemCount() {
        return produtos != null ? produtos.size() : 0;
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        ImageView img;
        TextView name, price, qty;

        ViewHolder(View itemView) {
            super(itemView);
            img = itemView.findViewById(R.id.img);
            name = itemView.findViewById(R.id.name);
            price = itemView.findViewById(R.id.price);
            qty = itemView.findViewById(R.id.qty);
        }
    }
}
