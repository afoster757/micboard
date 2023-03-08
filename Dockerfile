FROM python:3

MAINTAINER Karl Swanson <karlcswanson@gmail.com>

WORKDIR /usr/src/app

ENV TZ=America/Chicago
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get clean && apt-get update
RUN apt-get install nodejs npm -y

COPY . .

RUN python3 -m pip install -r py/requirements.txt
RUN npm config set pyhton=python3

RUN npm install --only=prod
RUN npm run build

EXPOSE 8058

CMD ["python3", "py/micboard.py"]
