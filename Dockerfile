FROM python:3.12-slim
WORKDIR /app

# Instalar dependencias del backend
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente del backend
COPY backend/ .
RUN mkdir -p /app/data

EXPOSE 8000

# Usar el puerto asignado por Render dinámicamente ($PORT) o 8000 por defecto
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
