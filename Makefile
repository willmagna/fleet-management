start-dev:
	make back-start-dev & make front-start-dev

back-start-dev:
	cd backend && npm run start:dev

front-start-dev:
	cd frontend && npm run start