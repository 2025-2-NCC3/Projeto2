package com.example.aplicativocomedoriadatia.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.example.aplicativocomedoriadatia.R;

public class StatusAdapter extends RecyclerView.Adapter<StatusAdapter.StatusViewHolder> {

    private final String[] statusList;
    private final String statusAtual;

    public StatusAdapter(String[] statusList, String statusAtual) {
        this.statusList = statusList;
        this.statusAtual = statusAtual;
    }

    @NonNull
    @Override
    public StatusViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_status, parent, false);
        return new StatusViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull StatusViewHolder holder, int position) {
        String status = statusList[position];
        holder.tvStatus.setText(status);

        // define a aparência de cada etapa da linha do tempo
        if (status.equals(statusAtual)) {
            // etapa atual -> destaque
            holder.iconStatus.setImageResource(R.drawable.ic_circle_active);
            holder.tvStatus.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.green_500));
        } else if (isStatusAnterior(status)) {
            // etapas anteriores -> completas
            holder.iconStatus.setImageResource(R.drawable.ic_circle_done);
            holder.tvStatus.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.gray_800));
        } else {
            // etapas futuras -> inativas
            holder.iconStatus.setImageResource(R.drawable.ic_circle_inactive);
            holder.tvStatus.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.gray_400));
        }
    }

    @Override
    public int getItemCount() {
        return statusList.length;
    }

    private boolean isStatusAnterior(String status) {
        // define se o status é anterior ao atual (para desenhar como "feito")
        int indexAtual = -1;
        int indexStatus = -1;

        for (int i = 0; i < statusList.length; i++) {
            if (statusList[i].equals(statusAtual)) indexAtual = i;
            if (statusList[i].equals(status)) indexStatus = i;
        }
        return indexStatus < indexAtual;
    }

    static class StatusViewHolder extends RecyclerView.ViewHolder {
        TextView tvStatus;
        ImageView iconStatus;

        public StatusViewHolder(@NonNull View itemView) {
            super(itemView);
            tvStatus = itemView.findViewById(R.id.tvStatus);
            iconStatus = itemView.findViewById(R.id.iconStatus);
        }
    }
}
