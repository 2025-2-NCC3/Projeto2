package com.example.aplicativocomedoriadatia;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.annotation.Nullable;

public class SessionManager {
    private static final String PREF = "supabase_session";
    private static final String K_ACCESS = "access_token";
    private static final String K_REFRESH = "refresh_token";
    private static final String K_EMAIL = "email";
    private static final String K_NAME = "name";
    private static final String K_USER_ID = "user_id";
    private static final String K_AVATAR_URL = "avatar_url";

    private final SharedPreferences sp;

    public SessionManager(Context ctx) {
        sp = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    public void save(@Nullable String access, @Nullable String refresh, @Nullable String email) {
        sp.edit()
                .putString(K_ACCESS, access)
                .putString(K_REFRESH, refresh)
                .putString(K_EMAIL, email)
                .apply();
    }

    public void saveUserSession(@Nullable String access, @Nullable String refresh,
                                @Nullable String email, @Nullable String name,
                                @Nullable String userId, @Nullable String avatarUrl) {
        SharedPreferences.Editor editor = sp.edit();

        if (access != null) editor.putString(K_ACCESS, access);
        if (refresh != null) editor.putString(K_REFRESH, refresh);
        if (email != null) editor.putString(K_EMAIL, email);
        if (name != null) editor.putString(K_NAME, name);
        if (userId != null) editor.putString(K_USER_ID, userId);
        if (avatarUrl != null) editor.putString(K_AVATAR_URL, avatarUrl);

        editor.apply();
    }

    // GETTERS ORIGINAIS
    @Nullable public String getAccess()  { return sp.getString(K_ACCESS, null); }
    @Nullable public String getRefresh() { return sp.getString(K_REFRESH, null); }
    @Nullable public String getEmail()   { return sp.getString(K_EMAIL, null); }

    // NOVOS GETTERS
    @Nullable public String getName() { return sp.getString(K_NAME, null); }
    @Nullable public String getUserId() { return sp.getString(K_USER_ID, null); }
    @Nullable public String getAvatarUrl() { return sp.getString(K_AVATAR_URL, null); }

    public void updateAvatarUrl(String avatarUrl) {
        sp.edit().putString(K_AVATAR_URL, avatarUrl).apply();
    }

    public void clear() {
        sp.edit().clear().apply();
    }

    public boolean isLoggedIn() {
        String refresh = getRefresh();
        String access  = getAccess();
        return (refresh != null && !refresh.isEmpty()) || (access != null && !access.isEmpty());
    }
}