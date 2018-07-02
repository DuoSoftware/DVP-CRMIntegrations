module.exports = {
  "DB": {
    "Type": "postgres",
    "User": "",
    "Password": "DuoS123",
    "Port": 5432,
    "Host": "localhost",
    "Database": ""
  },


  "Redis":
  {
    "mode":"sentinel",//instance, cluster, sentinel
    "ip": "",
    "port": 6389,
    "user": "",
    "password": "",
    "sentinels":{
      "hosts": "",
      "port":16389,
      "name":"redis-cluster"
    }

  },


  "Security":
  {

    "ip" : "",
    "port": 6389,
    "user": "",
    "password": "",
    "mode":"sentinel",//instance, cluster, sentinel
    "sentinels":{
      "hosts": "",
      "port":16389,
      "name":"redis-cluster"
    }
  },


  "Host": {
    "resource": "cluster",
    "vdomain": "localhost",
    "domain": "localhost",
    "port": "3637",
    "version": "1.0.0.0"
    //"callControllerurl": "http://6f15d43f.ngrok.io/DVP/API/1.0.0.0/MonitorRestAPI/Direct"
  },

  "LBServer": {

    "ip": "localhost",
    "port": "3434"

  },


  "Mongo": {
    "ip": "",
    "port": "27017",
    "dbname": "",
    "password": "",
    "user": ""
  },

  "Services": {
    "accessToken": "",
    "callcontrolHost": "",
    "callcontrolPort": "8831",
    "callcontrolVersion": "1.0.0.0",

    "fileserviceurl": '',
    "fileserviceport": '8081',
    "fileserviceVersion": "1.0.0.0"
  },

  "Integrations":{

    "zoho":{
      "id": "",
      "secret": "",
      "redirect": ""
    }

  }


};
