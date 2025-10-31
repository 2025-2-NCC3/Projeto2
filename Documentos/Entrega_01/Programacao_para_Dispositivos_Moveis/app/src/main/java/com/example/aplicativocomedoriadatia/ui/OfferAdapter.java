package com.example.aplicativocomedoriadatia.ui;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import com.bumptech.glide.Glide;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.aplicativocomedoriadatia.R;
import com.example.aplicativocomedoriadatia.model.ProductPrice;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class OfferAdapter extends RecyclerView.Adapter<OfferAdapter.OfferViewHolder> {

    private final List<ProductPrice> offers = new ArrayList<>();
    private Context context;

    public interface OnItemClickListener {
        void onItemClick(ProductPrice offer);
    }

    private OnItemClickListener clickListener;

    public void setOnItemClickListener(OnItemClickListener listener) {
        this.clickListener = listener;
    }

    @NonNull
    @Override
    public OfferViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        context = parent.getContext();
        View view = LayoutInflater.from(context).inflate(R.layout.item_offer, parent, false);
        return new OfferViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull OfferViewHolder holder, int position) {
        ProductPrice offer = offers.get(position);
        holder.bind(offer);

        holder.itemView.setOnClickListener(v -> {
            if (clickListener != null) {
                clickListener.onItemClick(offer);
            }
        });
    }

    @Override
    public int getItemCount() {
        return offers.size();
    }

    public void setItems(List<ProductPrice> newOffers) {
        offers.clear();
        if (newOffers != null) offers.addAll(newOffers);
        notifyDataSetChanged();
    }

    static class OfferViewHolder extends RecyclerView.ViewHolder {
        ImageView img;
        TextView tvName, tvPrice, tvDesc, tvOldPrice, tvDiscountTag;

        public OfferViewHolder(@NonNull View itemView) {
            super(itemView);
            img = itemView.findViewById(R.id.imgOffer);
            tvName = itemView.findViewById(R.id.tvOfferName);
            tvPrice = itemView.findViewById(R.id.tvOfferPrice);
            tvDesc = itemView.findViewById(R.id.tvOfferDesc);
            tvOldPrice = itemView.findViewById(R.id.tvOfferOldPrice); // ✅ agora bate com o XML
            tvDiscountTag = itemView.findViewById(R.id.discountTag);
        }

        void bind(ProductPrice offer) {
            if (offer == null || offer.product == null) return;

            tvName.setText(offer.product.name != null ? offer.product.name : "Oferta sem nome");
            tvPrice.setText(String.format("R$ %.2f", offer.price));

            // --- Exibe descrição ou validade ---
            if (offer.product.description != null && !offer.product.description.isEmpty()) {
                tvDesc.setText(offer.product.description);
            } else if (offer.ends_at != null) {
                tvDesc.setText("Válido até: " + offer.ends_at.split("T")[0]);
            } else {
                tvDesc.setText("Promoção por tempo limitado");
            }

            // --- Imagem ---
            if (offer.product.image_url != null && !offer.product.image_url.isEmpty()) {
                Glide.with(itemView.getContext())
                        .load(offer.product.image_url)
                        .placeholder(R.drawable.placeholder)
                        .error(R.drawable.placeholder)
                        .into(img);
            } else {
                img.setImageResource(R.drawable.placeholder);
            }

            // --- Promoção ---
            boolean hasPromo = Boolean.TRUE.equals(offer.product.has_promotion);

            if (hasPromo
                    && offer.product.old_price != null
                    && offer.product.old_price > offer.price) {

                tvOldPrice.setVisibility(View.VISIBLE);
                tvDiscountTag.setVisibility(View.VISIBLE);

                tvOldPrice.setText(String.format("R$ %.2f", offer.product.old_price));
                tvOldPrice.setPaintFlags(tvOldPrice.getPaintFlags() | android.graphics.Paint.STRIKE_THRU_TEXT_FLAG);

                double desconto = ((offer.product.old_price - offer.price) / offer.product.old_price) * 100;
                tvDiscountTag.setText(String.format(Locale.getDefault(), "-%.0f%%", desconto));

            } else {
                tvOldPrice.setVisibility(View.GONE);
                tvDiscountTag.setVisibility(View.GONE);
            }

        }
    }
}
