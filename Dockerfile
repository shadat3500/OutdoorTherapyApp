# Step 1: Base Image
FROM node:20-alpine

# Step 2: System dependencies install kora (Prisma-r jonno lagbe)
RUN apk add --no-cache openssl libc6-compat
# Step 2: Working Directory set kora
WORKDIR /app

# Step 3: Package files copy kora
COPY package*.json ./
COPY prisma ./prisma/

# Step 4: Dependencies install kora
# Note: Docker build-er shomoy amra sob install korchi
RUN npm install

# Step 5: Prisma client generate kora
# Eita image build-er shomoy-i types ar query engine ready kore rakhbe
RUN npx prisma generate

# Step 6: Bakita full code copy kora
COPY . .

# Step 7: Port expose kora (amader app 8000 port-e chole)
# EXPOSE 8001

# Step 8: App run kora
CMD ["npm", "run", "dev"]
