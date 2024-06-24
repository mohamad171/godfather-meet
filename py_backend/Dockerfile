FROM python:3.10

WORKDIR /code

COPY . .

RUN pip install -r reqiorements.txt


EXPOSE 8080
CMD [ "python", "server.py" ]