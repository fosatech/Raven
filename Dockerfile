FROM python:alpine3.19

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt