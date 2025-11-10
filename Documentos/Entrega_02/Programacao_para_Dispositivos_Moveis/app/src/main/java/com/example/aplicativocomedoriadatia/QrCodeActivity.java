package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

public class QrCodeActivity extends AppCompatActivity {

    private ImageView ivQrCode;
    private TextView tvAmount, tvTimer;
    private Handler timerHandler = new Handler();
    private int timerSeconds = 300;
    private double amount;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_qrcode);

        ivQrCode = findViewById(R.id.ivQrCode);
        tvAmount = findViewById(R.id.tvAmount);
        tvTimer = findViewById(R.id.tvTimer);

        amount = getIntent().getDoubleExtra("amount", 0.0);

        String formattedAmount = formatToBrazilianCurrency(amount);
        tvAmount.setText(formattedAmount);

        generateQRCode(amount);
        startTimer();
        simulateAutomaticPayment();
    }

    private String formatToBrazilianCurrency(double value) {
        return String.format("R$ %.2f", value).replace(".", ",");
    }

    private void generateQRCode(double amount) {
        String pixPayload = createFakePixPayload(amount);

        QRCodeWriter writer = new QRCodeWriter();
        try {
            BitMatrix bitMatrix = writer.encode(pixPayload, BarcodeFormat.QR_CODE, 512, 512);
            int width = bitMatrix.getWidth();
            int height = bitMatrix.getHeight();
            Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565);

            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    bmp.setPixel(x, y, bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE);
                }
            }
            ivQrCode.setImageBitmap(bmp);

        } catch (WriterException e) {
            e.printStackTrace();
            Toast.makeText(this, "Erro ao gerar QR Code", Toast.LENGTH_SHORT).show();
        }
    }

    private String createFakePixPayload(double amount) {
        String merchantName = "LOJA DEMONSTRACAO";
        String merchantCity = "SAO PAULO";

        return "000201" +
                "26580014br.gov.bcb.pix" +
                "0136" + "123e4567-e89b-12d3-a456-426614174000" +
                "52040000" +
                "5303986" +
                "5406" + String.format("%.2f", amount) +
                "5802BR" +
                "590" + String.format("%02d", merchantName.length()) + merchantName +
                "600" + String.format("%02d", merchantCity.length()) + merchantCity +
                "62070503***" +
                "6304ABCD";
    }

    private void startTimer() {
        timerHandler.postDelayed(timerRunnable, 1000);
    }

    private Runnable timerRunnable = new Runnable() {
        @Override
        public void run() {
            if (timerSeconds > 0) {
                timerSeconds--;
                updateTimerDisplay();
                timerHandler.postDelayed(this, 1000);
            } else {
                Toast.makeText(QrCodeActivity.this, "QR Code expirado", Toast.LENGTH_SHORT).show();
                finish();
            }
        }
    };

    private void updateTimerDisplay() {
        int minutes = timerSeconds / 60;
        int seconds = timerSeconds % 60;
        tvTimer.setText(String.format("Expira em: %02d:%02d", minutes, seconds));
    }

    private void simulateAutomaticPayment() {
        new Handler().postDelayed(() -> {
            String successMessage = String.format("Pagamento de %s simulado com sucesso! ✅", formatToBrazilianCurrency(amount));
            Toast.makeText(this, successMessage, Toast.LENGTH_LONG).show();

            Intent returnIntent = new Intent();
            setResult(RESULT_OK, returnIntent);
            finish();
        }, 10000);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        timerHandler.removeCallbacks(timerRunnable);
    }
}