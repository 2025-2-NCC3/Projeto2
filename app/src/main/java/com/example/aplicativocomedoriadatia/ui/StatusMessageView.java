package com.example.aplicativocomedoriadatia.ui;

import android.content.Context;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.android.material.card.MaterialCardView;
import com.example.aplicativocomedoriadatia.R;

public class StatusMessageView extends MaterialCardView {

    public enum State { SUCCESS, ERROR }

    private TextView txtTitle, txtMessage;

    public StatusMessageView(@NonNull Context context) {
        super(context);
        init(context);
    }

    public StatusMessageView(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }

    private void init(Context ctx) {
        LayoutInflater.from(ctx).inflate(R.layout.view_status_message, this, true);
        txtTitle   = findViewById(R.id.txtTitle);
        txtMessage = findViewById(R.id.txtMessage);
    }

    public void setState(State state) {
        if (state == State.SUCCESS) {
            setCardBackgroundColor(getResources().getColor(R.color.green));
            txtTitle.setTextColor(getResources().getColor(R.color.white));
            txtMessage.setTextColor(getResources().getColor(R.color.white));
        } else {
            setCardBackgroundColor(getResources().getColor(R.color.red));
            txtTitle.setTextColor(getResources().getColor(R.color.white));
            txtMessage.setTextColor(getResources().getColor(R.color.white));
        }
    }

    public void setTitle(String title) {
        txtTitle.setText(title);
    }

    public void setMessage(String message) {
        txtMessage.setText(message);
    }

    public void show() {
        setVisibility(VISIBLE);
        Animation in = AnimationUtils.loadAnimation(getContext(), android.R.anim.fade_in);
        startAnimation(in);
    }

    public void dismiss() {
        Animation out = AnimationUtils.loadAnimation(getContext(), android.R.anim.fade_out);
        out.setAnimationListener(new Animation.AnimationListener() {
            @Override public void onAnimationStart(Animation animation) {}
            @Override public void onAnimationEnd(Animation animation) {
                setVisibility(GONE);
            }
            @Override public void onAnimationRepeat(Animation animation) {}
        });
        startAnimation(out);
    }
}