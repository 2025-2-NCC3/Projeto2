package com.example.aplicativocomedoriadatia;

import android.content.Context;
import android.content.SharedPreferences;

class SessionManager {
    private static final String PREF = "supabase_session";
    private static final String K_ACCESS = "access_token";
    private static final String K_REFRESH = "refresh_token";
    private static final String K_EMAIL = "email";
    private final SharedPreferences sp;

    SessionManager(Context ctx) {
        sp = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }

    void save(String access, String refresh, String email) {
        sp.edit().putString(K_ACCESS, access)
                .putString(K_REFRESH, refresh)
                .putString(K_EMAIL, email)
                .apply();
    }

    String getAccess() { return sp.getString(K_ACCESS, null); }
    String getRefresh() { return sp.getString(K_REFRESH, null); }
    String getEmail() { return sp.getString(K_EMAIL, null); }
    void clear() { sp.edit().clear().apply(); }
}
