PYTHON=python3
PIP=pip

.PHONY: venv install run-postgres run-mysql run-mariadb run-duckdb run-sqlite docker-up docker-pipeline

venv:
	$(PYTHON) -m venv .venv
	. .venv/bin/activate && $(PIP) install -r requirements.txt

install:
	$(PIP) install -r requirements.txt

run-postgres:
	DB_USER=postgres DB_PASSWORD=postgres DB_HOST=localhost DB_PORT=5432 DB_NAME=bank \
	$(PYTHON) -m banking_pipeline.pipeline --target postgres --rows 20000 --seed 42 --out artifacts

run-mysql:
	DB_USER=root DB_PASSWORD=password DB_HOST=localhost DB_PORT=3306 DB_NAME=bank \
	$(PYTHON) -m banking_pipeline.pipeline --target mysql --rows 20000 --seed 42 --out artifacts

run-mariadb:
	DB_USER=root DB_PASSWORD=password DB_HOST=localhost DB_PORT=3307 DB_NAME=bank \
	$(PYTHON) -m banking_pipeline.pipeline --target mariadb --rows 20000 --seed 42 --out artifacts

run-duckdb:
	$(PYTHON) -m banking_pipeline.pipeline --target duckdb --rows 20000 --seed 42 --out artifacts

run-sqlite:
	$(PYTHON) -m banking_pipeline.pipeline --target sqlite --rows 20000 --seed 42 --out artifacts

docker-up:
	docker compose up -d postgres mysql mariadb

docker-pipeline:
	docker compose up --build pipeline
