FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# El nginx.conf lleva los 301 del WordPress anterior. Sin esta linea el
# contenedor usa el de por defecto y las redirecciones no existen: la web
# funciona igual, asi que el fallo no se nota hasta mirar Search Console.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
