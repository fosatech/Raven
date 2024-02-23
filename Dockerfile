FROM tiangolo/uwsgi-nginx-flask:python3.11-2024-01-01

WORKDIR /app

COPY . .

RUN pip3 install --no-cache-dir -r requirements.txt