FROM python:alpine3.19

WORKDIR /app

COPY . .

RUN python -m pip install -r requirements.txt