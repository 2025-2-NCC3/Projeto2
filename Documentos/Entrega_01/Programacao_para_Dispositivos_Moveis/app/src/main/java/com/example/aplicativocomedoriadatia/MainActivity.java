package com.example.aplicativocomedoriadatia;

import android.content.res.ColorStateList;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.ColorInt;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentTransaction;

/**
 * Container principal com barra inferior (activity_navbar.xml incluída no activity_main.xml).
 * Troca fragments ao clicar nas abas.
 *
 * Requisitos de layout:
 * - res/layout/activity_main.xml contendo:
 *     - <FrameLayout android:id="@+id/fragment_container" .../>
 *     - <include layout="@layout/activity_navbar" android:id="@+id/bottom_nav" .../>
 *
 * - activity_navbar.xml deve expor os seguintes IDs (ajuste aqui se forem diferentes):
 *   nav_inicio, nav_pedidos, nav_ofertas, nav_perfil
 *   icon_inicio, icon_pedidos, icon_ofertas, icon_perfil
 *   text_inicio, text_pedidos, text_ofertas, text_perfil
 */
public class MainActivity extends AppCompatActivity {

    // Raiz dos itens da barra
    private LinearLayout navInicio, navPedidos, navOfertas, navPerfil;
    // Ícones
    private ImageView iconInicio, iconPedidos, iconOfertas, iconPerfil;
    // Rótulos
    private TextView textInicio, textPedidos, textOfertas, textPerfil;

    @ColorInt private int colorSelected;
    @ColorInt private int colorUnselected;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // activity_main.xml deve incluir activity_navbar no rodapé
        setContentView(R.layout.activity_main);

        // Cores (defina em res/values/colors.xml)
        colorSelected   = getColor(R.color.green);
        colorUnselected = getColor(R.color.gray_600);

        // Referências da barra inferior (IDs vindos do seu activity_navbar.xml)
        navInicio  = findViewById(R.id.nav_inicio);
        navPedidos = findViewById(R.id.nav_pedidos);
        navOfertas = findViewById(R.id.nav_ofertas);
        navPerfil  = findViewById(R.id.nav_perfil);

        iconInicio  = findViewById(R.id.icon_inicio);
        iconPedidos = findViewById(R.id.icon_pedidos);
        iconOfertas = findViewById(R.id.icon_ofertas);
        iconPerfil  = findViewById(R.id.icon_perfil);

        textInicio  = findViewById(R.id.text_inicio);
        textPedidos = findViewById(R.id.text_pedidos);
        textOfertas = findViewById(R.id.text_ofertas);
        textPerfil  = findViewById(R.id.text_perfil);

        // Click listeners
        navInicio.setOnClickListener(v -> selectTab(Tab.HOME));
        navPedidos.setOnClickListener(v -> selectTab(Tab.ORDERS));
        navOfertas.setOnClickListener(v -> selectTab(Tab.OFFERS));
        navPerfil.setOnClickListener(v -> selectTab(Tab.PROFILE));

        // Abre a aba inicial
        if (savedInstanceState == null) {
            selectTab(Tab.HOME);
        }
    }

    private enum Tab { HOME, ORDERS, OFFERS, PROFILE }

    private void selectTab(Tab tab) {
        // Troca o fragment
        Fragment fragment;
        switch (tab) {
            case ORDERS:  fragment = new LabelFragment("Pedidos"); break;
            case OFFERS:  fragment = new LabelFragment("Ofertas"); break;
            case PROFILE: fragment = new LabelFragment("Perfil");  break;
            case HOME:
            default:      fragment = new LabelFragment("Início");  break;
        }
        FragmentTransaction ft = getSupportFragmentManager().beginTransaction();
        ft.replace(R.id.fragment_container, fragment, tab.name());
        ft.commit();

        // Atualiza destaque visual na barra
        setSelected(tab == Tab.HOME,   iconInicio,  textInicio);
        setSelected(tab == Tab.ORDERS, iconPedidos, textPedidos);
        setSelected(tab == Tab.OFFERS, iconOfertas, textOfertas);
        setSelected(tab == Tab.PROFILE, iconPerfil, textPerfil);
    }

    private void setSelected(boolean selected, ImageView icon, TextView label) {
        if (icon != null) icon.setImageTintList(ColorStateList.valueOf(selected ? colorSelected : colorUnselected));
        if (label != null) label.setTextColor(selected ? colorSelected : colorUnselected);
    }

    /**
     * Fragment placeholder simples (sem precisar criar XML agora).
     * Depois você pode trocar por HomeFragment/OrdersFragment/etc. com layouts reais.
     */
    public static class LabelFragment extends Fragment {
        private final String title;
        public LabelFragment(String title) {
            super();
            this.title = title;
        }

        @Nullable @Override
        public android.view.View onCreateView(@Nullable android.view.LayoutInflater inflater,
                                              @Nullable ViewGroup container,
                                              @Nullable Bundle savedInstanceState) {
            // Cria uma View simples programaticamente
            TextView tv = new TextView(requireContext());
            tv.setText(title);
            tv.setTextSize(22f);
            tv.setGravity(Gravity.CENTER);
            tv.setLayoutParams(new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            ));
            return tv;
        }
    }
}
