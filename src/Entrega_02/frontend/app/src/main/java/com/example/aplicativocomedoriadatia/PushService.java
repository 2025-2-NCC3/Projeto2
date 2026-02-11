package com.example.aplicativocomedoriadatia;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class PushService extends FirebaseMessagingService {

    private static final String TAG = "PushService";
    private static final String CHANNEL_ID = "promo_channel";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Log.d(TAG, "FCM recebido: " + remoteMessage);

        String title = null;
        String body  = null;

        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body  = remoteMessage.getNotification().getBody();
        }

        if (title == null) title = remoteMessage.getData().get("title");
        if (body  == null) body  = remoteMessage.getData().get("body");

        showNotification(title, body);
    }

    @Override
    public void onNewToken(@NonNull String token) {
        Log.d(TAG, "Novo token FCM: " + token);
        FcmTokenUploader.saveTokenToSupabase(getApplicationContext(), token);
    }

    private void showNotification(String title, String body) {
        if (title == null || title.trim().isEmpty()) {
            title = "Comedoria da Tia 🍔";
        }
        if (body == null || body.trim().isEmpty()) {
            body = "Tem novidade pra você!";
        }

        NotificationManager nm =
                (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        // Canal (Android 8+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    "Promoções da Comedoria",
                    NotificationManager.IMPORTANCE_HIGH
            );
            nm.createNotificationChannel(ch);
        }

        Intent intent = new Intent(this, HomeActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pi = PendingIntent.getActivity(
                this,
                0,
                intent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                        ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                        : PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(R.drawable.ic_logo_comedoria) // usa seu ícone existente
                        .setContentTitle(title)
                        .setContentText(body)
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setAutoCancel(true)
                        .setContentIntent(pi);

        nm.notify((int) System.currentTimeMillis(), builder.build());
    }
}