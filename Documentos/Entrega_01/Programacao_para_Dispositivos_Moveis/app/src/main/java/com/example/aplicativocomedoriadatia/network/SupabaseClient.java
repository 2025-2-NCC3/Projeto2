package com.example.aplicativocomedoriadatia.network;

import android.content.Context;

import com.example.aplicativocomedoriadatia.R;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.List;

import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Cliente mínimo pro Supabase REST (PostgREST).
 * Já suporta GET (lista) e POST (inserir 1 registro e devolver o registro inserido).
 */
public class SupabaseClient {

    private final OkHttpClient client = new OkHttpClient();
    private final Gson gson = new Gson();

    private final String baseUrl;
    private final String anonKey;

    private static final MediaType JSON
            = MediaType.parse("application/json; charset=utf-8");

    public SupabaseClient(Context ctx) {
        baseUrl = ctx.getString(R.string.supabase_url);
        anonKey = ctx.getString(R.string.supabase_anon_key);
    }

    // -------------------------------------------------
    // GET LISTA
    // -------------------------------------------------
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
            if (!response.isSuccessful()) {
                throw new IOException("HTTP " + response.code() + " ao GET " + path);
            }
            String body = response.body() != null ? response.body().string() : "[]";
            return gson.fromJson(body, listType);
        }
    }

    // -------------------------------------------------
    // POST (inserir 1 registro e devolver o que o Supabase retornou)
    //
    // Uso:
    //   JSONObject body = new JSONObject();
    //   body.put("token", "abc");
    //   DeviceTokenRow row = api.postSingle(
    //         "device_tokens",
    //         body.toString(),
    //         new TypeToken<DeviceTokenRow>(){}.getType()
    //   );
    //
    // OBS:
    // - "endpoint" = nome da tabela ou RPC, ex: "device_tokens"
    // - jsonBody   = JSON do registro (1 linha só)
    // - returnType = tipo do retorno. Supabase retorna array JSON,
    //                então a gente pega sempre o primeiro elemento.
    // -------------------------------------------------
    public <T> T postSingle(String endpoint, String jsonBody, Type returnType) throws IOException {
        HttpUrl url = HttpUrl.parse(baseUrl + "/rest/v1/" + endpoint);

        RequestBody body = RequestBody.create(jsonBody, JSON);

        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("apikey", anonKey)
                .addHeader("Authorization", "Bearer " + anonKey)
                .addHeader("Content-Type", "application/json")
                .addHeader("Prefer", "return=representation") // faz o Supabase devolver a linha inserida
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errBody = response.body() != null ? response.body().string() : "";
                throw new IOException("HTTP " + response.code() + " ao POST " + endpoint + ": " + errBody);
            }

            // Supabase normalmente retorna um array JSON com o(s) registro(s) inseridos
            String respBody = response.body() != null ? response.body().string() : "[]";

            // exemplo de respBody: [{"id":"...","token":"123","created_at":"..."}]
            // vamos desserializar como List<T> e pegar o primeiro
            Type listOfT = TypeToken.getParameterized(List.class, returnType instanceof Class ? (Class<?>) returnType : Object.class).getType();
            List<T> list;
            try {
                list = gson.fromJson(respBody, listOfT);
            } catch (Exception e) {
                // fallback: tentar direto (caso o Supabase retorne objeto e não array)
                return gson.fromJson(respBody, returnType);
            }
            if (list != null && !list.isEmpty()) {
                return list.get(0);
            }
            return null;
        }
    }
}
