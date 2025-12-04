FROM node:20-bullseye-slim
WORKDIR /app


# Copie uniquement package.json pour installer les dépendances dans le conteneur
COPY package.json ./

# Installe les dépendances, la binaire native Rollup Linux et force un rebuild
RUN npm install --no-audit --no-fund --prefer-offline \
 && npm install @rollup/rollup-linux-x64-gnu --no-save \
 && npm rebuild \
 && npm rebuild esbuild --update-binary || true \
 # Supprime d'éventuels paquets esbuild Windows et installe explicitement le binaire Linux
 && rm -rf node_modules/@esbuild/win32-x64 node_modules/esbuild/node_modules/@esbuild/win32-x64 || true \
 && npm install @esbuild/linux-x64 --no-save || true

# Spécifie explicitement le binaire esbuild Linux pour Vite/rollup
ENV ESBUILD_BINARY_PATH=/app/node_modules/@esbuild/linux-x64/bin/esbuild

# Copie le reste du code (sauf node_modules du host)
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
