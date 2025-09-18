package com.example.aplicativocomedoriadatia.network;

import android.content.Context;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.List;

import okhttp3.*;

public class SupabaseClient {

    private final OkHttpClient client = new OkHttpClient();

    private final String baseUrl;
    private final String anonKey;

    public SupabaseClient(Context ctx) {
        baseUrl = ctx.getString(com.example.aplicativocomedoriadatia.R.string.supabase_url);
        anonKey = ctx.getString(com.example.aplicativocomedoriadatia.R.string.supabase_anon_key);
    }

    public <T> List<T> getList(String path, Type listType) throws IOException {
        HttpUrl url = HttpUrl.parse(baseUrl + "/rest/v1/" + path);
        Request request = new Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer " + anonKey)
                .addHeader("Accept", "application/json")
                .addHeader("Accept-Profile", "public")
                .addHeader("Prefer", "return=representation")
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            String body = response.body().string();
            return new Gson().fromJson(body, listType);
        }
    }
}
