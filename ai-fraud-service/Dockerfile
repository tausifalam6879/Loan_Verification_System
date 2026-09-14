FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir --retries 10 --timeout 60 --upgrade pip \
    && python -m pip install --no-cache-dir --retries 10 --timeout 60 -r requirements.txt

COPY . ./
RUN useradd --create-home --uid 10001 fintrack \
    && mkdir -p /app/models \
    && chown -R fintrack:fintrack /app

USER 10001
EXPOSE 8080

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
