# Use an official Node.js runtime as a base image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the TypeScript configuration files
COPY tsconfig.json ./

# Copy the rest of the application code to the container
COPY . .

# Build TypeScript files
RUN npm run build

# Expose the port on which your app runs
EXPOSE 3000

# Define the command to run your app
CMD ["npm", "start"]