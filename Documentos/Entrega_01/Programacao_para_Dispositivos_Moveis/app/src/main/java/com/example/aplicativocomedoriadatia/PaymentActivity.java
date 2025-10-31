package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.aplicativocomedoriadatia.cart.CartItem;
import com.example.aplicativocomedoriadatia.cart.CartManager;
import com.google.android.material.card.MaterialCardView;

import java.util.ArrayList;
import java.util.List;

public class PaymentActivity extends AppCompatActivity {

    private RadioGroup rgPaymentMethod;
    private Button btnProcessPayment;
    private TextView tvAmount, tvOrderSummary;
    private MaterialCardView cardPixInfo, cardCardInfo;

    private RadioButton rbPix, rbCreditCard, rbDebitCard;

    private double totalAmount;
    private String selectedMethod = "pix";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_payment);

        totalAmount = getIntent().getDoubleExtra("total_amount", 0.0);

        initViews();
        setupClickListeners();
        updateOrderSummary();
    }

    private void initViews() {
        rgPaymentMethod = findViewById(R.id.rgPaymentMethod);
        btnProcessPayment = findViewById(R.id.btnProcessPayment);
        tvAmount = findViewById(R.id.tvAmount);
        tvOrderSummary = findViewById(R.id.tvOrderSummary);
        cardPixInfo = findViewById(R.id.cardPixInfo);
        cardCardInfo = findViewById(R.id.cardCardInfo);

        String formattedAmount = formatToBrazilianCurrency(totalAmount);
        tvAmount.setText(formattedAmount);
        showPaymentMethodInfo("pix");
    }

    private void setupClickListeners() {
        btnProcessPayment.setOnClickListener(v -> processPayment());

        rgPaymentMethod.setOnCheckedChangeListener((group, checkedId) -> {
            if (checkedId == R.id.rbPix) {
                selectedMethod = "pix";
                showPaymentMethodInfo("pix");
            } else if (checkedId == R.id.rbCreditCard) {
                selectedMethod = "credit_card";
                showPaymentMethodInfo("credit_card");
            } else if (checkedId == R.id.rbDebitCard) {
                selectedMethod = "debit_card";
                showPaymentMethodInfo("debit_card");
            }
        });

        // Adiciona listeners para os LinearLayouts clicáveis
        setupRadioButtonClicks();
    }

    private void showPaymentMethodInfo(String method) {
        switch (method) {
            case "pix":
                cardPixInfo.setVisibility(View.VISIBLE);
                cardCardInfo.setVisibility(View.GONE);
                btnProcessPayment.setText("Pagar com PIX");
                break;
            case "credit_card":
            case "debit_card":
                cardPixInfo.setVisibility(View.GONE);
                cardCardInfo.setVisibility(View.VISIBLE);
                String text = method.equals("credit_card") ?
                        "Pagar com Cartão de Crédito" : "Pagar com Cartão de Débito";
                btnProcessPayment.setText(text);
                break;
        }
        updateOrderSummary();
    }

    private void processPayment() {
        if (selectedMethod.equals("pix")) {
            openQrCodeScreen();
        } else {
            processCardPayment();
        }
    }

    private void openQrCodeScreen() {
        Intent intent = new Intent(this, QrCodeActivity.class);
        intent.putExtra("amount", totalAmount);
        startActivityForResult(intent, 1001);
    }

    private void processCardPayment() {
        btnProcessPayment.setEnabled(false);
        btnProcessPayment.setText("Processando cartão...");

        new Handler().postDelayed(() -> {
            String successText = getSuccessMessage();
            Toast.makeText(PaymentActivity.this, successText, Toast.LENGTH_LONG).show();
            goToOrdersScreen();
            btnProcessPayment.setEnabled(true);
            updateButtonText();
        }, 3000);
    }

    private void goToOrdersScreen() {
        List<CartItem> items = CartManager.with(getApplicationContext()).getItems();

        if (items == null || items.isEmpty()) {
            Toast.makeText(this, "Erro: Carrinho vazio", Toast.LENGTH_LONG).show();
            return;
        }

        ArrayList<CartItem> cartItems = new ArrayList<>(items);
        double total = CartManager.with(getApplicationContext()).getTotal();

        Intent intent = new Intent(this, OrdersActivity.class);
        intent.putExtra("produtos", cartItems);
        intent.putExtra("total", total);

        CartManager.with(getApplicationContext()).clear();
        startActivity(intent);
        finish();
    }

    private String getSuccessMessage() {
        switch (selectedMethod) {
            case "pix":
                return "Pagamento PIX aprovado! ✅";
            case "credit_card":
                return "Cartão de crédito aprovado! ✅";
            case "debit_card":
                return "Cartão de débito aprovado! ✅";
            default:
                return "Pagamento aprovado! ✅";
        }
    }

    private void updateButtonText() {
        switch (selectedMethod) {
            case "pix":
                btnProcessPayment.setText("Pagar com PIX");
                break;
            case "credit_card":
                btnProcessPayment.setText("Pagar com Cartão de Crédito");
                break;
            case "debit_card":
                btnProcessPayment.setText("Pagar com Cartão de Débito");
                break;
        }
    }

    private void updateOrderSummary() {
        List<CartItem> items = CartManager.with(getApplicationContext()).getItems();

        StringBuilder summary = new StringBuilder();
        summary.append("Itens do Pedido:\n\n");

        for (CartItem item : items) {
            String productName = item.product != null ? item.product.name : "Produto";
            summary.append(String.format("%dx %s\n", item.qty, productName));
        }

        summary.append(String.format("\nTotal: %s\n", formatToBrazilianCurrency(totalAmount)));
        summary.append(String.format("Método: %s\n\n", getMethodDisplayName(selectedMethod)));
        summary.append("Clique no botão para simular pagamento");

        tvOrderSummary.setText(summary.toString());
    }

    private String getMethodDisplayName(String method) {
        switch (method) {
            case "pix":
                return "PIX";
            case "credit_card":
                return "Cartão de Crédito";
            case "debit_card":
                return "Cartão de Débito";
            default:
                return method;
        }
    }

    private String formatToBrazilianCurrency(double value) {
        return String.format("R$ %.2f", value).replace(".", ",");
    }


    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == 1001 && resultCode == RESULT_OK) {
            Toast.makeText(this, "Pagamento PIX aprovado! ✅", Toast.LENGTH_LONG).show();
            goToOrdersScreen();
        }
    }


    private void setupRadioButtonClicks() {
        // Encontra os LinearLayouts pais dos RadioButtons
        LinearLayout pixLayout = (LinearLayout) findViewById(R.id.rbPix).getParent();
        LinearLayout creditLayout = (LinearLayout) findViewById(R.id.rbCreditCard).getParent();
        LinearLayout debitLayout = (LinearLayout) findViewById(R.id.rbDebitCard).getParent();

        // Configura os cliques nos layouts para selecionar os RadioButtons
        pixLayout.setOnClickListener(v -> {
            rgPaymentMethod.check(R.id.rbPix);
        });

        creditLayout.setOnClickListener(v -> {
            rgPaymentMethod.check(R.id.rbCreditCard);
        });

        debitLayout.setOnClickListener(v -> {
            rgPaymentMethod.check(R.id.rbDebitCard);
        });
    }
}