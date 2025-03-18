# Use Node.js base image
FROM node:18-alpine

# Set the current working directory inside the container
WORKDIR /app

# Copy package files from local machine
# (the directory where the Dockerfile is)
# into the current working directory (./) in the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code from local machine into the container
COPY src/ ./src/

# Create directory for persistent volume
RUN mkdir -p /huidong_PV_dir

# Expose the port the app runs on
EXPOSE 6000

# Command to run the application
CMD ["node", "src/app.js"]