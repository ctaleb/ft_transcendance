all:
	docker-compose up -d --build

stop:
	docker-compose down

ps:
	docker-compose ps

clean:
	docker-compose down --rmi all