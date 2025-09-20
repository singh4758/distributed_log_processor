# Use official Node.js 24 image
FROM node:24

# Set working directory
WORKDIR /app

COPY . .

# Install dependencies for all workspaces and build
RUN npm ci && npm run build --workspaces

WORKDIR /app/src/services/logger

# Runtime command
CMD ["node", "dist/app.js"]