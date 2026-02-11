package com.example.aplicativocomedoriadatia;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.card.MaterialCardView;

public class ProfileActivity extends AppCompatActivity {

    private SessionManager session;
    private ImageView profileImage;
    private TextView tvUserName, tvUserEmail;

    private ActivityResultLauncher<Intent> imagePickerLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        session = new SessionManager(this);

        NavbarHelper.setup(this);

        initViews();

        setupImagePicker();

        loadUserData();

        setupClickListeners();
    }

    private void initViews() {
        profileImage = findViewById(R.id.profile_image);
        tvUserName = findViewById(R.id.etName);
        tvUserEmail = findViewById(R.id.etEmail);

        findViewById(R.id.ilName).setVisibility(View.GONE);
        findViewById(R.id.ilEmail).setVisibility(View.GONE);
    }

    private void setupImagePicker() {
        imagePickerLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Uri imageUri = result.getData().getData();
                        if (imageUri != null) {
                            profileImage.setImageURI(imageUri);
                            Toast.makeText(this, "Foto alterada com sucesso!", Toast.LENGTH_SHORT).show();
                        }
                    }
                }
        );
    }

    private void loadUserData() {
        String userName = session.getName();
        String userEmail = session.getEmail();

        if (userName != null && !userName.isEmpty()) {
            tvUserName.setText(userName);
        } else {
            tvUserName.setText("Usuário");
        }

        if (userEmail != null) {
            tvUserEmail.setText(userEmail);
        }

        loadProfileImage();
    }

    private void loadProfileImage() {
        String avatarUrl = session.getAvatarUrl();
        if (avatarUrl != null && !avatarUrl.isEmpty()) {
        }
    }

    private void setupClickListeners() {
        View profileImageContainer = findViewById(R.id.profileImageContainer);
        if (profileImageContainer != null) {
            profileImageContainer.setOnClickListener(v -> openImagePicker());
        }

        View tvChangePhoto = findViewById(R.id.tvChangePhoto);
        if (tvChangePhoto != null) {
            tvChangePhoto.setOnClickListener(v -> openImagePicker());
        }

        MaterialCardView cardFavorites = findViewById(R.id.card_favorites);
        if (cardFavorites != null) {
            cardFavorites.setOnClickListener(v -> openFavoritesActivity());
        }

        View btnDeleteAccount = findViewById(R.id.btnDeleteAccount);
        if (btnDeleteAccount != null) {
            btnDeleteAccount.setOnClickListener(v -> confirmDeleteAccount());
        }
    }

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("image/*");
        imagePickerLauncher.launch(intent);
    }

    private void openFavoritesActivity() {
        if (!session.isLoggedIn() || session.getUserId() == null) {
            Toast.makeText(this, "Faça login para ver seus favoritos", Toast.LENGTH_SHORT).show();
            return;
        }

        Intent intent = new Intent(this, FavoritesActivity.class);
        startActivity(intent);
    }

    private void confirmDeleteAccount() {
        androidx.appcompat.app.AlertDialog.Builder builder = new androidx.appcompat.app.AlertDialog.Builder(this);
        builder.setTitle("Excluir Conta");
        builder.setMessage("Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados serão perdidos.");

        builder.setPositiveButton("Excluir", (dialog, which) -> deleteAccount());
        builder.setNegativeButton("Cancelar", (dialog, which) -> dialog.dismiss());

        builder.create().show();
    }

    private void deleteAccount() {
        Toast.makeText(this, "Excluindo conta...", Toast.LENGTH_SHORT).show();

        session.clear();
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }
}