package com.example.aplicativocomedoriadatia;

import android.content.Context;

import com.example.aplicativocomedoriadatia.model.Product;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class FavoriteService {
    private final String baseUrl;
    private final String anonKey;
    private final OkHttpClient client;
    private final Gson gson = new Gson();

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    public FavoriteService(Context ctx) {
        baseUrl = ctx.getString(R.string.supabase_url);
        anonKey = ctx.getString(R.string.supabase_anon_key);
        client = new OkHttpClient.Builder()
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .build();
    }

    /**
     * Adicionar produto aos favoritos
     */
    public boolean addFavorite(String userId, String productId, String accessToken) {
        try {
            JsonObject favoriteData = new JsonObject();
            favoriteData.addProperty("user_id", userId);
            favoriteData.addProperty("product_id", productId);

            RequestBody body = RequestBody.create(favoriteData.toString(), JSON);

            Request request = new Request.Builder()
                    .url(baseUrl + "/rest/v1/favorites")
                    .addHeader("Authorization", "Bearer " + accessToken)
                    .addHeader("apikey", anonKey)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("Prefer", "return=minimal")
                    .post(body)
                    .build();

            Response response = client.newCall(request).execute();
            return response.isSuccessful();

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Remover produto dos favoritos
     */
    public boolean removeFavorite(String userId, String productId, String accessToken) {
        try {
            String url = baseUrl + "/rest/v1/favorites?user_id=eq." + userId + "&product_id=eq." + productId;

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer " + accessToken)
                    .addHeader("apikey", anonKey)
                    .delete()
                    .build();

            Response response = client.newCall(request).execute();
            return response.isSuccessful();

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Verificar se produto é favorito
     */
    public boolean isFavorite(String userId, String productId, String accessToken) {
        try {
            String url = baseUrl + "/rest/v1/favorites?user_id=eq." + userId + "&product_id=eq." + productId + "&select=id";

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer " + accessToken)
                    .addHeader("apikey", anonKey)
                    .get()
                    .build();

            Response response = client.newCall(request).execute();

            if (response.isSuccessful() && response.body() != null) {
                String json = response.body().string();
                // Se retornar um array não vazio, é favorito
                return !json.equals("[]");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Buscar todos os favoritos do usuário com detalhes dos produtos
     */
    public List<Product> getUserFavoritesWithDetails(String userId, String accessToken) {
        List<Product> favoriteProducts = new ArrayList<>();
        try {
            // Busca favoritos com JOIN nos produtos
            String url = baseUrl + "/rest/v1/favorites?user_id=eq." + userId +
                    "&select=products(id,name,description,cost_estimated,image_url,slug,is_active)";

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer " + accessToken)
                    .addHeader("apikey", anonKey)
                    .get()
                    .build();

            Response response = client.newCall(request).execute();

            if (response.isSuccessful() && response.body() != null) {
                String json = response.body().string();
                JsonArray jsonArray = gson.fromJson(json, JsonArray.class);

                for (int i = 0; i < jsonArray.size(); i++) {
                    JsonObject item = jsonArray.get(i).getAsJsonObject();
                    JsonObject productJson = item.getAsJsonObject("products");

                    if (productJson != null) {
                        Product product = gson.fromJson(productJson, Product.class);
                        favoriteProducts.add(product);
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return favoriteProducts;
    }

    /**
     * Buscar apenas IDs dos favoritos
     */
    public List<String> getUserFavoriteIds(String userId, String accessToken) {
        List<String> favoriteIds = new ArrayList<>();
        try {
            String url = baseUrl + "/rest/v1/favorites?user_id=eq." + userId + "&select=product_id";

            Request request = new Request.Builder()
                    .url(url)
                    .addHeader("Authorization", "Bearer " + accessToken)
                    .addHeader("apikey", anonKey)
                    .get()
                    .build();

            Response response = client.newCall(request).execute();

            if (response.isSuccessful() && response.body() != null) {
                String json = response.body().string();
                JsonArray jsonArray = gson.fromJson(json, JsonArray.class);

                for (int i = 0; i < jsonArray.size(); i++) {
                    JsonObject item = jsonArray.get(i).getAsJsonObject();
                    favoriteIds.add(item.get("product_id").getAsString());
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return favoriteIds;
    }
}