module.exports = {
  "DB": {
    "Type": "postgres",
    "User": "duo",
    "Password": "DuoS123",
    "Port": 5432,
    "Host": "localhost",
    "Database": "dvpdb"
  },


  "Redis": {
    "ip": "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123"

  },


  "Security": {
    "ip": "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123"
  },


  "Host": {
    "resource": "cluster",
    "vdomain": "localhost",
    "domain": "localhost",
    "port": "3637",
    "version": "1.0.0.0"
  },

  "LBServer": {

    "ip": "localhost",
    "port": "3434"

  },


  "Mongo": {
    "ip": "45.55.142.207",
    "port": "27017",
    "dbname": "dvpdb",
    "password": "DuoS123",
    "user": "duo"
  },

  "Services": {
    "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdWtpdGhhIiwianRpIjoiMTdmZTE4M2QtM2QyNC00NjQwLTg1NTgtNWFkNGQ5YzVlMzE1Iiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjE4OTMzMDI3NTMsInRlbmFudCI6LTEsImNvbXBhbnkiOi0xLCJzY29wZSI6W3sicmVzb3VyY2UiOiJhbGwiLCJhY3Rpb25zIjoiYWxsIn1dLCJpYXQiOjE0NjEyOTkxNTN9.YiocvxO_cVDzH5r67-ulcDdBkjjJJDir2AeSe3jGYeA",
    "callcontrolHost": "resourceservice.104.131.67.21.xip.io",
    "callcontrolPort": "8831",
    "callcontrolVersion": "1.0.0.0"
  },

  "Integrations":{

    "zoho":{
      "id": "1000.9CA76T07V09456782NDROVGLVH8D16",
      "secret": "0f3c7e2abc3bd20434dfd876fd5f53aca6439374a9",
      "redirect": "console.veery.cloud/zoho/crm"
    }

  }


};