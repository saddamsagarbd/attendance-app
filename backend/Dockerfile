# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy files
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose backend port (example: 5000)
EXPOSE 5000

# Start backend
CMD ["npm", "run", "start"]