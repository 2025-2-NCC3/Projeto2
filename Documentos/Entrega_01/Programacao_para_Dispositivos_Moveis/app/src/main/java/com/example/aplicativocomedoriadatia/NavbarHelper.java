package com.example.aplicativocomedoriadatia;

import android.app.Activity;
import android.content.Intent;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.Toast;

public class NavbarHelper {

    public static void setup(Activity activity) {
        LinearLayout navInicio = activity.findViewById(R.id.nav_inicio);
        LinearLayout navPedidos = activity.findViewById(R.id.nav_pedidos);
        LinearLayout navOfertas = activity.findViewById(R.id.nav_ofertas);
        LinearLayout navPerfil = activity.findViewById(R.id.nav_perfil);

        if (navInicio == null || navPedidos == null || navOfertas == null || navPerfil == null)
            return;

        View.OnClickListener listener = v -> {
            int id = v.getId();
            if (id == R.id.nav_inicio && !(activity instanceof HomeActivity)) {
                activity.startActivity(new Intent(activity, HomeActivity.class));
            } else if (id == R.id.nav_pedidos) {
                Toast.makeText(activity, "Pedidos (em breve)", Toast.LENGTH_SHORT).show();
            } else if (id == R.id.nav_ofertas && !(activity instanceof OffersActivity)) {
                activity.startActivity(new Intent(activity, OffersActivity.class));
            } else if (id == R.id.nav_perfil) {
                Toast.makeText(activity, "Perfil (em breve)", Toast.LENGTH_SHORT).show();
            }
        };

        navInicio.setOnClickListener(listener);
        navPedidos.setOnClickListener(listener);
        navOfertas.setOnClickListener(listener);
        navPerfil.setOnClickListener(listener);

        setSelectedTab(activity, navInicio, navPedidos, navOfertas, navPerfil);
    }

    private static void setSelectedTab(Activity activity, View... navs) {
        int selectedId = R.id.nav_inicio;

        if (activity instanceof OffersActivity) {
            selectedId = R.id.nav_ofertas;
        }

        for (View nav : navs) {
            nav.setSelected(nav.getId() == selectedId);
        }
    }
}