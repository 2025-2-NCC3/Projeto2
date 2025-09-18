package com.example.aplicativocomedoriadatia.ui;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AlphaAnimation;
import android.view.animation.DecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

public class StatusBanner {

    public enum State { SUCCESS, ERROR }

    /**
     * Mostra um banner flutuante no topo da Activity.
     * Não requer XML. Some automaticamente após durationMs.
     */
    public static void show(Activity activity, State state, String title, String message, long durationMs) {
        FrameLayout root = activity.findViewById(android.R.id.content);
        if (root == null) return;

        // Container do banner
        LinearLayout card = new LinearLayout(activity);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setPadding(dp(activity, 12), dp(activity, 12), dp(activity, 12), dp(activity, 12));
        card.setElevation(dp(activity, 6));
        card.setBackground(makeCardBackground());

        // Faixa lateral colorida
        View stripe = new View(activity);
        int stripeColor = (state == State.SUCCESS) ? Color.parseColor("#0C6500") : Color.parseColor("#EF4444");
        stripe.setBackgroundColor(stripeColor);
        LinearLayout.LayoutParams stripeLp = new LinearLayout.LayoutParams(dp(activity, 6), ViewGroup.LayoutParams.MATCH_PARENT);
        stripe.setLayoutParams(stripeLp);
        card.addView(stripe);

        // Área de textos
        LinearLayout textCol = new LinearLayout(activity);
        textCol.setOrientation(LinearLayout.VERTICAL);
        textCol.setPadding(dp(activity, 12), 0, 0, 0);

        TextView tvTitle = new TextView(activity);
        tvTitle.setText(title);
        tvTitle.setTextSize(16);
        tvTitle.setTextColor(Color.parseColor("#111111"));
        tvTitle.setTypeface(tvTitle.getTypeface(), android.graphics.Typeface.BOLD);

        TextView tvMsg = new TextView(activity);
        tvMsg.setText(message);
        tvMsg.setTextSize(14);
        tvMsg.setTextColor(Color.parseColor("#222222"));

        textCol.addView(tvTitle);
        textCol.addView(tvMsg);

        LinearLayout.LayoutParams colLp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        textCol.setLayoutParams(colLp);
        card.addView(textCol);

        // LayoutParams do banner (topo, largura total, margem)
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.gravity = Gravity.TOP;
        lp.leftMargin = dp(activity, 16);
        lp.rightMargin = dp(activity, 16);
        lp.topMargin = dp(activity, 24);

        // Estado inicial (fade in)
        card.setAlpha(0f);
        root.addView(card, lp);

        AlphaAnimation fadeIn = new AlphaAnimation(0f, 1f);
        fadeIn.setDuration(180);
        fadeIn.setInterpolator(new DecelerateInterpolator());
        card.startAnimation(fadeIn);
        card.setAlpha(1f);

        // Auto-dismiss
        long safeDuration = Math.max(1200, durationMs <= 0 ? 2400 : durationMs);
        card.postDelayed(() -> dismiss(root, card), safeDuration);

        // Fechar ao tocar
        card.setOnClickListener(v -> dismiss(root, card));
    }

    private static void dismiss(FrameLayout root, View card) {
        if (card.getParent() == null) return;
        AlphaAnimation fadeOut = new AlphaAnimation(1f, 0f);
        fadeOut.setDuration(150);
        fadeOut.setInterpolator(new DecelerateInterpolator());
        fadeOut.setAnimationListener(new android.view.animation.Animation.AnimationListener() {
            @Override public void onAnimationStart(android.view.animation.Animation animation) {}
            @Override public void onAnimationEnd(android.view.animation.Animation animation) {
                root.removeView(card);
            }
            @Override public void onAnimationRepeat(android.view.animation.Animation animation) {}
        });
        card.startAnimation(fadeOut);
        card.setAlpha(0f);
    }

    private static GradientDrawable makeCardBackground() {
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.parseColor("#FFFFFFFF")); // white
        bg.setCornerRadius(24f);
        bg.setStroke(2, Color.parseColor("#E5E7EB")); // borda suave
        return bg;
    }

    private static int dp(Activity a, int dp) {
        return Math.round(dp * a.getResources().getDisplayMetrics().density);
    }
}
