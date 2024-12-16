FROM node:22 AS builder
WORKDIR /usr/app
COPY package.json .
COPY yarn.lock .
RUN yarn
COPY . .
RUN yarn run build

FROM nginx
COPY --from=builder /usr/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]