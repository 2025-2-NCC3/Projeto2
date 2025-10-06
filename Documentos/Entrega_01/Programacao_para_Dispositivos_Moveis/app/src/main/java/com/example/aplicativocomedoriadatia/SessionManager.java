package com.example.aplicativocomedoriadatia;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.annotation.Nullable;

public class SessionManager {
    private static final String PREF = "supabase_session";
    private static final String K_ACCESS = "access_token";
    private static final String K_REFRESH = "refresh_token";
    private static final String K_EMAIL = "email";

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

    @Nullable public String getAccess()  { return sp.getString(K_ACCESS, null); }
    @Nullable public String getRefresh() { return sp.getString(K_REFRESH, null); }
    @Nullable public String getEmail()   { return sp.getString(K_EMAIL, null); }

    public void clear() { sp.edit().clear().apply(); }

    /** Considera logado se tiver refresh OU access salvo. Ajuste se quiser ser mais restrito. */
    public boolean isLoggedIn() {
        String refresh = getRefresh();
        String access  = getAccess();
        return (refresh != null && !refresh.isEmpty()) || (access != null && !access.isEmpty());
    }
}
