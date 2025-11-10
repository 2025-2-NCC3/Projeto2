package com.example.aplicativocomedoriadatia;

import android.content.Context;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.util.SparseArray;
import android.view.View;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.ColorInt;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;

/**
 * Controlador para chips de filtro feitos com TextViews dentro de um LinearLayout (horizontal).
 * - Faz seleção exclusiva
 * - Altera estilo visual (selecionado x padrão)
 * - Emite callback com a categoria selecionada
 * - Faz scroll automático até o chip selecionado
 */
public final class FilterChipsController {

    public interface OnFilterSelected {
        /**
         * @param category Categoria legível (ex.: "Todos", "Lanches", "Bebidas"...)
         *                 Use "Todos" para remover filtro.
         */
        void onFilter(String category);
    }

    private final Context ctx;
    private final LinearLayout container;
    private final OnFilterSelected callback;
    private final SparseArray<String> idToCategory = new SparseArray<>();

    private @Nullable TextView selected;

    private @ColorInt int colorWhite;
    private @ColorInt int colorBlack;
    private @ColorInt int colorGrayStroke;

    // Ajuste aqui o canto arredondado/espessura da borda do chip padrão
    private final float cornerRadiusDp = 18f;
    private final int strokeWidthDp = 2;

    private FilterChipsController(LinearLayout container, OnFilterSelected callback) {
        this.ctx = container.getContext();
        this.container = container;
        this.callback = callback;

        colorWhite = ContextCompat.getColor(ctx, R.color.white);
        colorBlack = ContextCompat.getColor(ctx, R.color.black);
        colorGrayStroke = ContextCompat.getColor(ctx, R.color.gray_200);

        // Mapeie os IDs dos chips para as categorias:
        // (ignore se algum id não existir no layout)
        putIfExists(R.id.chipTodos, "Todos");
        putIfExists(R.id.chipLanches, "Lanches");
        putIfExists(R.id.chipBebidas, "Bebidas");
        putIfExists(R.id.chipDoces, "Doces");
        putIfExists(R.id.chipPromocoes, "Promoções");

        // Inicializa estilo padrão e listeners
        for (int i = 0; i < idToCategory.size(); i++) {
            int viewId = idToCategory.keyAt(i);
            TextView tv = container.findViewById(viewId);
            if (tv != null) {
                applyDefaultStyle(tv);
                tv.setOnClickListener(v -> selectChip(tv));
            }
        }

        // Seleciona "Todos" por padrão (se existir)
        TextView chipTodos = safeFind(R.id.chipTodos);
        if (chipTodos != null) {
            selectChip(chipTodos);
        }
    }

    public static FilterChipsController attach(LinearLayout container, OnFilterSelected callback) {
        return new FilterChipsController(container, callback);
    }

    /** Se quiser forçar uma seleção via código (ex.: restaurar estado). */
    public void selectById(int viewId) {
        TextView tv = safeFind(viewId);
        if (tv != null) selectChip(tv);
    }

    // ===================== Internos =====================

    private void putIfExists(int id, String category) {
        View v = container.findViewById(id);
        if (v != null) idToCategory.put(id, category);
    }

    private @Nullable TextView safeFind(int id) {
        View v = container.findViewById(id);
        return (v instanceof TextView) ? (TextView) v : null;
    }

    private void selectChip(TextView tv) {
        // desmarca anterior
        if (selected != null && selected != tv) {
            applyDefaultStyle(selected);
            selected.setSelected(false);
        }
        // marca atual
        applySelectedStyle(tv);
        tv.setSelected(true);
        selected = tv;

        // Scroll até o chip (se estiver em um HorizontalScrollView)
        View parent = (View) container.getParent();
        if (parent instanceof HorizontalScrollView) {
            ((HorizontalScrollView) parent).post(() ->
                    ((HorizontalScrollView) parent).smoothScrollTo(
                            Math.max(tv.getLeft() - dp(24), 0), 0
                    )
            );
        }

        // callback
        String category = idToCategory.get(tv.getId());
        if (category != null && callback != null) {
            callback.onFilter(category);
        }
    }

    private void applyDefaultStyle(TextView tv) {
        // preserva paddings ao trocar background
        int pL = tv.getPaddingLeft();
        int pT = tv.getPaddingTop();
        int pR = tv.getPaddingRight();
        int pB = tv.getPaddingBottom();

        tv.setBackground(createOutlineDrawable());
        tv.setTextColor(colorBlack);
        tv.setTypeface(Typeface.DEFAULT_BOLD);
        tv.setAlpha(1f);

        tv.setPadding(pL, pT, pR, pB);
    }

    private void applySelectedStyle(TextView tv) {
        int pL = tv.getPaddingLeft();
        int pT = tv.getPaddingTop();
        int pR = tv.getPaddingRight();
        int pB = tv.getPaddingBottom();

        // Usa seu shape verde existente para selecionado
        tv.setBackground(ContextCompat.getDrawable(ctx, R.drawable.bg_chip_green));
        tv.setTextColor(colorWhite);
        tv.setTypeface(Typeface.DEFAULT_BOLD);
        tv.setAlpha(1f);

        tv.setPadding(pL, pT, pR, pB);
    }

    private GradientDrawable createOutlineDrawable() {
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.RECTANGLE);
        d.setCornerRadius(dp(cornerRadiusDp));
        d.setColor(0x00FFFFFF); // transparente
        d.setStroke(dp(strokeWidthDp), colorGrayStroke);
        return d;
    }

    private int dp(float v) {
        return Math.round(v * ctx.getResources().getDisplayMetrics().density);
    }
}
