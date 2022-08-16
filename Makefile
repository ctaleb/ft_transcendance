all:
	docker-compose up -d --build

stop:
	docker-compose down

back:
	docker exec -it back bash

front:
	docker exec -it front bash

database:
	docker exec -it database bash

adminer:
	docker exec -it adminer bash

ps:
	docker-compose ps

clean:
	docker-compose down --rmi all

fclean:
	docker-compose down --rmi all -v

.PHONY: all stop back front database adminer ps clean