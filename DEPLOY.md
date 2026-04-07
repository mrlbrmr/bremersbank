# Deploy Instructions

## 🚀 Opções de Deploy

### 1. **Vercel** (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

### 2. **Netlify**
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Fazer login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### 3. **GitHub Pages**
```bash
# Instalar gh-pages
npm install --save-dev gh-pages

# Adicionar ao package.json:
"scripts": {
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

### 4. **Surge**
```bash
# Instalar Surge
npm install -g surge

# Deploy
surge dist
```

## 📋 Build Local
```bash
npm run build
```

O projeto será compilado na pasta `dist/` e estará pronto para deploy em qualquer plataforma de hospedagem estática.