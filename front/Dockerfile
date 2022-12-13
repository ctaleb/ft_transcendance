FROM node:18-bullseye
RUN apt-get update -y && apt-get upgrade -y
RUN npm install -g npm@9.1.3
COPY app/ /front/app/
WORKDIR /front/app/
RUN npm i
EXPOSE 4000:4000
CMD ["npm", "run", "serve", "--", "--port", "4000"]
# CMD ["sleep", "infinity"]