FROM python:alpine3.19

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
ENV PORT 5000

CMD python stk_sweep.py