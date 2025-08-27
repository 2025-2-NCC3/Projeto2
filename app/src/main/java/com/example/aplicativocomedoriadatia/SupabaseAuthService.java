package com.example.aplicativocomedoriadatia;

import android.content.Context;

import androidx.annotation.Nullable;

import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

class SupabaseAuthService {

    private final String baseUrl;      // https://xxxx.supabase.co
    private final String anonKey;      // sua anon key
    private final OkHttpClient client;
    private final Gson gson = new Gson();

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    SupabaseAuthService(Context ctx) {
        baseUrl = ctx.getString(R.string.supabase_url);
        anonKey = ctx.getString(R.string.supabase_anon_key);
        client = new OkHttpClient.Builder()
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(25, TimeUnit.SECONDS)
                .writeTimeout(25, TimeUnit.SECONDS)
                .build();
    }

    /** Login com email/senha via GoTrue */
    @Nullable
    AuthResponse signInWithPassword(String email, String password) throws IOException {
        String url = baseUrl + "/auth/v1/token?grant_type=password";
        String bodyJson = gson.toJson(new PasswordLoginReq(email, password));

        RequestBody body = RequestBody.create(bodyJson, JSON);
        Request req = new Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer " + anonKey)
                .post(body)
                .build();

        try (Response res = client.newCall(req).execute()) {
            if (!res.isSuccessful()) {
                throw new IOException("HTTP " + res.code() + ": " + (res.body() != null ? res.body().string() : ""));
            }
            String json = res.body() != null ? res.body().string() : "{}";
            return gson.fromJson(json, AuthResponse.class);
        }
    }

    /* ===== modelos ===== */

    static class PasswordLoginReq {
        final String email;
        final String password;
        PasswordLoginReq(String e, String p) { this.email = e; this.password = p; }
    }

    static class AuthResponse {
        @SerializedName("access_token") String accessToken;
        @SerializedName("refresh_token") String refreshToken;
        @SerializedName("token_type") String tokenType;
        @SerializedName("expires_in") Integer expiresIn;
        @SerializedName("user") User user;

        static class User {
            @SerializedName("id") String id;
            @SerializedName("email") String email;
        }

        boolean isValid() { return accessToken != null && refreshToken != null; }
    }
    @Nullable
    AuthResponse signUpWithEmail(String email, String password, @Nullable String fullName) throws IOException {
        String url = baseUrl + "/auth/v1/signup";

        // payload
        SignUpReq bodyObj = new SignUpReq(email, password, new Meta(fullName));
        String bodyJson = gson.toJson(bodyObj);

        RequestBody body = RequestBody.create(bodyJson, JSON);
        Request req = new Request.Builder()
                .url(url)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer " + anonKey)
                .post(body)
                .build();

        try (Response res = client.newCall(req).execute()) {
            if (!res.isSuccessful()) {
                throw new IOException("HTTP " + res.code() + ": " + (res.body() != null ? res.body().string() : ""));
            }
            String json = res.body() != null ? res.body().string() : "{}";
            return gson.fromJson(json, AuthResponse.class);
        }
    }

    // modelos para signup
    static class SignUpReq {
        final String email;
        final String password;
        @SerializedName("data") final Meta data;       // user_metadata
        SignUpReq(String e, String p, Meta d) { this.email = e; this.password = p; this.data = d; }
    }
    static class Meta {
        @SerializedName("full_name") final String fullName;
        Meta(String n) { this.fullName = n; }
    }
}


