FROM node:18-bullseye
RUN apt-get update && apt-get upgrade -y
RUN npm install -g npm@9.2
COPY app/ /back/app/
WORKDIR /back/app/
RUN npm i
RUN npm install @nestjs/cli
EXPOSE 3000:3000
CMD ["npx", "nest", "start", "--watch"]
#  CMD ["sleep", "infinity"]