FROM python:3.13.1-bookworm
WORKDIR /usr/app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install gunicorn
COPY . .
EXPOSE 5555
CMD ["gunicorn", "-b 0.0.0.0:5555", "--workers=2", "app:app"]