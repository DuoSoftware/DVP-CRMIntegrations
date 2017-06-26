#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm nodejs-legacy
#RUN git clone git://github.com/DuoSoftware/DVP-CRMIntegrations.git /usr/local/src/crmintegrations
#RUN cd /usr/local/src/crmintegrations; npm install
#CMD ["nodejs", "/usr/local/src/crmintegrations/app.js"]

#EXPOSE 8894

FROM node:5.10.0
ARG VERSION_TAG
RUN git clone -b $VERSION_TAG https://github.com/DuoSoftware/DVP-CRMIntegrations.git /usr/local/src/crmintegrations
RUN cd /usr/local/src/crmintegrations
RUN apt-get update -y
WORKDIR /usr/local/src/crmintegrations
RUN npm install
EXPOSE 8894
CMD [ "node", "/usr/local/src/crmintegrations/app.js" ]
