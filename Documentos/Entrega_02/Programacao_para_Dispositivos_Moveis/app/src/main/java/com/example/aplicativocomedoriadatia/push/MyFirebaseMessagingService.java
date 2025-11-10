// com/example/aplicativocomedoriadatia/push/MyFirebaseMessagingService.java
package com.example.aplicativocomedoriadatia.push;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.example.aplicativocomedoriadatia.HomeActivity;
import com.example.aplicativocomedoriadatia.R;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "promo_channel";

    @Override public void onMessageReceived(RemoteMessage msg) {
        // Se vier "notification" do servidor, o Android já exibe sozinho com o app fechado.
        // Aqui cobrimos mensagens do tipo "data" também:
        String title = msg.getNotification() != null ? msg.getNotification().getTitle() :
                (msg.getData().get("title") != null ? msg.getData().get("title") : "Novidade!");
        String body  = msg.getNotification() != null ? msg.getNotification().getBody() :
                (msg.getData().get("body") != null ? msg.getData().get("body") : "Confira os novos produtos.");

        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(new NotificationChannel(
                    CHANNEL_ID, "Novos produtos", NotificationManager.IMPORTANCE_HIGH));
        }

        Intent intent = new Intent(this, HomeActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                this, 0, intent,
                Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                        : PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_logo_comedoria)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pi);

        nm.notify((int) System.currentTimeMillis(), b.build());
    }
}
