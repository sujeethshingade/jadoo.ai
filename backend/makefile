install:
	pip install --upgrade pip &&\
	pip install -r requirements.txt
	python -m spacy download en_core_web_sm

format:
	black *.py

lint:
	pylint --disable=R,C,W0718,E1101,W0612 *.py

test:
	pytest -v --cov=app test_app.py

deploy:
	#deploy

all: install format lint test deploy 