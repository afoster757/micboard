FROM python:3

MAINTAINER Karl Swanson <karlcswanson@gmail.com>

WORKDIR /usr/src/app

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install nodejs

COPY . .

RUN pip3 install -r requirements.txt
RUN npm install

EXPOSE 8058

CMD ["python3", "tornado_server.py"]
