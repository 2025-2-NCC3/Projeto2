# 📱🍴 Comedoria da Tia - Aplicativo e Sistema Web

Projeto acadêmico desenvolvido para a disciplina de **Programação para Dispositivos Móveis** e **Projeto Interdisciplinar** da FECAP.  
O sistema consiste em um **aplicativo mobile Android** integrado a um **painel web em React Vite+** que se conecta ao **banco de dados Supabase**.  

O objetivo do sistema é **cadastrar, gerenciar e disponibilizar produtos da Comedoria da Tia** (cantina universitária fictícia), permitindo a administração via API.

---
## 👩‍💻 Integrantes  

- **Breno Costa Nascimento** — [GitHub](https://github.com/brenocosta19) | [LinkedIn](https://www.linkedin.com/in/breno-costa-28a401264/)  
- **Bruno Souza Lima** — [GitHub](https://github.com/BrunoSouza06) | [LinkedIn](https://www.linkedin.com/in/bruno-souza-lima-448850263/)  
- **Felipe Toshio Yamaschita** — [GitHub](https://github.com/Yamaschita) | [LinkedIn](https://www.linkedin.com/in/felipe-yamaschita-96232b329/)  
- **Vinicius Nishimura Reis** — [GitHub](https://github.com/Vinishireis) | [LinkedIn](https://www.linkedin.com/in/vinicius-nishimura-reis/)  
- **Nicolly Silva Soares** — [GitHub](https://github.com/nicollysoarez) | [LinkedIn](https://www.linkedin.com/in/nicolly-silva-soares-10b627171/)  

## 📚 Professores Orientadores  

- <a href="https://www.linkedin.com/in/marco-aurelio-lima-barbosa/" target="_blank" rel="noopener noreferrer"> Marco Aurélio Lima Barbosa</a> 
- <a href="https://www.linkedin.com/in/rodrigo-da-rosa-phd/" target="_blank" rel="noopener noreferrer"> Rodrigo Rosa </a> 
- <a href="https://www.linkedin.com/in/katia-bossi/" target="_blank" rel="noopener noreferrer"> Kátia Bossi </a>
- <a href="https://www.linkedin.com/in/victorbarq/" target="_blank" rel="noopener noreferrer"> Victor Bruno Alexander Rosetti de Quiroz </a>  
---


## 🏗️ Arquitetura do Projeto

O projeto está dividido em **duas partes principais**:

### 1. **Aplicativo Mobile (Android Studio - Java)**
- Desenvolvido no **Android Studio Narwhal 3 Feature Drop | 2025.1.3**
- Linguagem: **Java** (compatível com Kotlin via plugin K2)
- Framework: **Android SDK**
- Funções principais:
  - Autenticação de usuários (clientes/professores/alunos)
  - Consulta e exibição dos produtos cadastrados
  - Integração via API com Supabase
  - Layout responsivo em **Material Design 3**

### 2. **Sistema Web (React Vite+)**
- Framework: **React Vite**
- Gerenciador de pacotes: **npm**
- Banco de dados: **Supabase (PostgreSQL)**
- Funções principais:
  - Painel administrativo para cadastro e edição de produtos
  - Consumo e exposição da API Supabase
  - Deploy pronto para plataformas como Vercel/Netlify
  - Configuração com **TailwindCSS**

---

## 📂 Estrutura de Pastas

### **Raiz do projeto**
- `.gradle/`, `gradle/`, `build/` → Pastas internas de build do Android Studio  
- `.idea/` → Configurações do projeto no IntelliJ/Android Studio  
- `app/` → Código-fonte do aplicativo Android (Java)  
- `assets/` → Recursos estáticos (imagens, ícones, fontes do app)  
- `Imagens/` → Pasta extra para armazenar imagens usadas no projeto  
- `gradlew`, `gradlew.bat`, `gradle.properties`, `settings.gradle`, `build.gradle` → Scripts e configs do Gradle (build system do Android)  

---

### **Web/comedoria_da_tia_web/**
Aqui fica a aplicação **React Vite** que faz a parte administrativa e integração via API com Supabase.

- `.vscode/` → Configurações do VS Code  
- `dist/` → Arquivos gerados no build do Vite  
- `node_modules/` → Dependências instaladas pelo npm  
- `public/` → Arquivos estáticos do projeto web  
- `src/` → Código-fonte principal da aplicação React  
  - Componentes React, hooks e lógica de integração com Supabase
- `.env` → Variáveis de ambiente (ex: URL e API Key do Supabase)  
- `.gitignore` → Ignora arquivos desnecessários no versionamento  
- `index.html` → Entrada principal do Vite/React  
- `package.json` / `package-lock.json` → Dependências do projeto web  
- `postcss.config.js` / `tailwind.config.js` → Configurações do TailwindCSS  
- `vite.config.js` → Configuração do bundler Vite  
- `vercel.json` → Configuração de deploy no Vercel  

---

## 🔧 Tecnologias Utilizadas

- **Android Studio Narwhal 3 (2025.1.3)**  
  - Linguagem: **Java** (com suporte Kotlin K2)  
  - Build system: **Gradle 8.x**  
  - Tema: **Material 3 (DayNight Theme)**  

- **React Vite+**
  - Linguagem: **JavaScript/JSX**  
  - Estilização: **TailwindCSS**  
  - Bundler: **Vite**  
  - Deploy: **Vercel**  

- **Banco de Dados**
  - **Supabase (PostgreSQL + RLS)**  
  - API REST pronta para integração  
  - Armazena informações de **produtos, usuários e pedidos**  

---

## 🚀 Como Executar

### Mobile (Android)
```bash
# Abrir no Android Studio
File > Open > app/
# Sincronizar Gradle e rodar em um emulador ou dispositivo físico
````

### Web (React Vite)

```bash
cd Web/comedoria_da_tia_web
npm install
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173`.

---

## 📌 Status Atual

* ✅ Estrutura de pastas organizada
* ✅ Aplicativo Android configurado
* ✅ Sistema Web integrado com Supabase
* 🚧 Implementação de novas telas em andamento
