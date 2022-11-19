FROM node:18-bullseye
RUN apt-get update && apt-get upgrade
RUN npm install -g npm@8.14.0
COPY app/ /back/app/
WORKDIR /back/app/
RUN npm i
RUN npm install @nestjs/cli
EXPOSE 3000:3000
# RUN npm run start:dev&
# RUN npm install -g @nestjs/cli							\
# 	&& npm install --save @nestjs/typeorm typeorm pg	\
# 	&& npm install --save dotenv						\
# 	&& npm i --save-dev nodemon ts-node					\
# 	&& npm run pretypeorm								\
# 	&& npm run typeorm
# ENTRYPOINT ["node"]
# CMD ["dist/main.js"]
CMD ["npx", "nest", "start", "watch"]