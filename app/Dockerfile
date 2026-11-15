# Modern 2048 Game Web Application
FROM nginx:alpine

# Copy web assets to Nginx html directory
COPY . /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
