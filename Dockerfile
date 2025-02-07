# Use Bun as the base image
FROM oven/bun:1.2.2

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json file
COPY package.json ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of the application
COPY . .

# Command to run the bot
CMD ["bun", "run", "start"]
