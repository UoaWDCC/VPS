# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=18.19.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Vite"

# Vite app lives here
WORKDIR /app

ARG YARN_VERSION=1.22.21
RUN npm install -g yarn@$YARN_VERSION --force

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY --link package.json yarn.lock ./ 
RUN yarn install --frozen-lockfile --production=false

# Copy application code
COPY --link . .

# Set environment variables for Firebase and Clerk
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_REACT_APP_API_KEY
ARG VITE_REACT_APP_AUTH_DOMAIN
ARG VITE_REACT_APP_STORAGE_BUCKET
ARG VITE_REACT_APP_MESSAGING_SENDER_ID
ARG VITE_REACT_APP_APP_ID
ARG VITE_REACT_APP_MEASUREMENT_ID
ARG VITE_REACT_APP_SERVER_URL

ENV VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
ENV VITE_REACT_APP_API_KEY=${VITE_REACT_APP_API_KEY}
ENV VITE_REACT_APP_AUTH_DOMAIN=${VITE_REACT_APP_AUTH_DOMAIN}
ENV VITE_REACT_APP_STORAGE_BUCKET=${VITE_REACT_APP_STORAGE_BUCKET}
ENV VITE_REACT_APP_MESSAGING_SENDER_ID=${VITE_REACT_APP_MESSAGING_SENDER_ID}
ENV VITE_REACT_APP_APP_ID=${VITE_REACT_APP_APP_ID}
ENV VITE_REACT_APP_MEASUREMENT_ID=${VITE_REACT_APP_MEASUREMENT_ID}
ENV VITE_REACT_APP_SERVER_URL=${VITE_REACT_APP_SERVER_URL}

# Build the app with environment variables
RUN yarn run build

# Remove development dependencies
RUN yarn install --production=true

# Final stage for app image
FROM nginx

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html
COPY --link _redirects /usr/share/nginx/html/_redirects
COPY nginx.conf /etc/nginx/nginx.conf

# Start the server by default, this can be overwritten at runtime
EXPOSE 80
CMD [ "/usr/sbin/nginx", "-g", "daemon off;" ]
