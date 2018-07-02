module.exports = {
  "DB": {
    "Type": "postgres",
    "User": "duo",
    "Password": "",
    "Port": 5432,
    "Host": "localhost",
    "Database": "dvpdb"
  },


  "Redis":
  {
    "mode":"sentinel",//instance, cluster, sentinel
    "ip": "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123",
    "sentinels":{
      "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
      "port":16389,
      "name":"redis-cluster"
    }

  },


  "Security":
  {

    "ip" : "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123",
    "mode":"sentinel",//instance, cluster, sentinel
    "sentinels":{
      "hosts": "138.197.90.92,45.55.205.92,138.197.90.92",
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
    "ip": "104.236.231.11",
    "port": "27017",
    "dbname": "dvpdb",
    "password": "DuoS123",
    "user": "duo"
  },

  "Services": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdWtpdGhhIiwianRpIjoiMTdmZTE4M2QtM2QyNC00NjQwLTg1NTgtNWFkNGQ5YzVlMzE1Iiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjE4OTMzMDI3NTMsInRlbmFudCI6LTEsImNvbXBhbnkiOi0xLCJzY29wZSI6W3sicmVzb3VyY2UiOiJhbGwiLCJhY3Rpb25zIjoiYWxsIn1dLCJpYXQiOjE0NjEyOTkxNTN9.YiocvxO_cVDzH5r67-ulcDdBkjjJJDir2AeSe3jGYeA",
    "callcontrolHost": "resourceservice.app.veery.cloud",
    "callcontrolPort": "8831",
    "callcontrolVersion": "1.0.0.0",

    "fileserviceurl": 'fileservice.app.veery.cloud',
    "fileserviceport": '8081',
    "fileserviceVersion": "1.0.0.0"
  },

  "Integrations":{

    "zoho":{
      "id": "1000.9CA76T07V09456782NDROVGLVH8D16",
      "secret": "0f3c7e2abc3bd20434dfd876fd5f53aca6439374a9",
      "redirect": "console.veery.cloud/zoho/crm"
    }

  }


};
