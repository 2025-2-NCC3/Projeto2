package com.example.aplicativocomedoriadatia;

import android.content.Context;
import android.util.Log;

import com.example.aplicativocomedoriadatia.network.SupabaseClient;

import org.json.JSONObject;

import java.lang.reflect.Type;

public class FcmTokenUploader {

    private static final String TAG = "FcmTokenUploader";

    /**

     Salva (ou tenta salvar) o token FCM do device na tabela "device_tokens".
     Tabela sugerida no Supabase:*
     create table public.device_tokens (
     id uuid default gen_random_uuid() primary key,
     token text unique,
     created_at timestamp with time zone default now()
     );*
     (garante token único por aparelho)*/
    public static void saveTokenToSupabase(Context ctx, String token) {
        if (token == null || token.isEmpty()) {
            return;}

        new Thread(() -> {
            try {
                SupabaseClient api = new SupabaseClient(ctx);

                // Monta JSON
                JSONObject bodyJson = new JSONObject();
                bodyJson.put("token", token);

                // Tipo de retorno: se você não liga pro retorno,
                // pode usar Object.class só pra compilar feliz.
                Type returnType = Object.class;

                api.postSingle(
                        "device_tokens",           // tabela
                        bodyJson.toString(),       // JSON string
                        returnType                 // tipo esperado
                );

                Log.d(TAG, "Token FCM enviado para Supabase com sucesso");

            } catch (Exception e) {
                Log.e(TAG, "Falha ao enviar token FCM", e);
            }
        }).start();
    }
}