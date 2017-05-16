/**
 * Created by Sukitha on 3/18/2017.
 */

var restify = require('restify');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var config = require('config');
var jwt = require('restify-jwt');
var mongoose = require('mongoose');
var secret = require('dvp-common/Authentication/Secret.js');
var authorization = require('dvp-common/Authentication/Authorization.js');
var zohoService = require("./Services/zoho");
var OrganisationConfig = require('dvp-mongomodels/model/OrganisationConfig');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');

var util = require('util');
var port = config.Host.port || 3000;
var host = config.Host.vdomain || 'localhost';


var server = restify.createServer({
    name: "DVP CRM Integration Service"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.queryParser());
server.use(restify.bodyParser({mapParams: false}));

restify.CORS.ALLOW_HEADERS.push('authorization');
restify.CORS.ALLOW_HEADERS.push('companyinfo');
server.use(restify.CORS());
server.use(restify.fullResponse());

server.use(jwt({secret: secret.Secret}));


var mongoip = config.Mongo.ip;
var mongoport = config.Mongo.port;
var mongodb = config.Mongo.dbname;
var mongouser = config.Mongo.user;
var mongopass = config.Mongo.password;
var mongoreplicaset = config.Mongo.replicaset;


var connectionstring = '';
mongoip = mongoip.split(',');
if (util.isArray(mongoip)) {

     if(mongoip.length > 1){ 
    mongoip.forEach(function (item) {
        connectionstring += util.format('%s:%d,', item, mongoport)
    });

    connectionstring = connectionstring.substring(0, connectionstring.length - 1);
    connectionstring = util.format('mongodb://%s:%s@%s/%s', mongouser, mongopass, connectionstring, mongodb);

    if (mongoreplicaset) {
        connectionstring = util.format('%s?replicaSet=%s', connectionstring, mongoreplicaset);
    }
     }
    else
    {
        connectionstring = util.format('mongodb://%s:%s@%s:%d/%s', mongouser, mongopass, mongoip[0], mongoport, mongodb);
    }
} else {

    connectionstring = util.format('mongodb://%s:%s@%s:%d/%s', mongouser, mongopass, mongoip, mongoport, mongodb);
}


mongoose.connect(connectionstring, {server: {auto_reconnect: true}});


mongoose.connection.on('error', function (err) {
    console.error(new Error(err));
    mongoose.disconnect();

});

mongoose.connection.on('opening', function () {
    console.log("reconnecting... %d", mongoose.connection.readyState);
});


mongoose.connection.on('disconnected', function () {
    console.error(new Error('Could not connect to database'));
    mongoose.connect(connectionstring, {server: {auto_reconnect: true}});
});

mongoose.connection.once('open', function () {
    console.log("Connected to db");

});


mongoose.connection.on('reconnected', function () {
    console.log('MongoDB reconnected!');
});


process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});


server.post('/DVP/API/:version/Zoho/Account/:code',
    authorization({resource: "campaign", action: "write"}), zohoService.CreateZohoAccount);
server.put('/DVP/API/:version/Zoho/Integration/Event',
    authorization({resource: "campaign", action: "write"}), zohoService.EnableZohoIntegration);
server.del('/DVP/API/:version/Zoho/Integration/Event',
    authorization({resource: "campaign", action: "delete"}), zohoService.DisableZohoIntegration);
server.get('/DVP/API/:version/Zoho/Integration/Account',
    authorization({resource: "campaign", action: "read"}), zohoService.GetZohoAccount);
server.put('/DVP/API/:version/Zoho/Integration/CallController',
    authorization({resource: "campaign", action: "write"}), zohoService.EnableZohoCallControl);
server.get('/DVP/API/:version/Zoho/Integration/Users',
    authorization({resource: "campaign", action: "read"}), zohoService.GetZohoUsers);
server.get('/DVP/API/:version/Zoho/Raw/Users',
    authorization({resource: "campaign", action: "read"}), zohoService.LoadZohoUsers);
server.post('/DVP/API/:version/Zoho/Integration/User',
    authorization({resource: "campaign", action: "write"}), zohoService.SaveZohoUser);
server.put('/DVP/API/:version/Zoho/Integration/Users/Import',
    authorization({resource: "campaign", action: "write"}), zohoService.ImportZohoUsers);
server.put('/DVP/API/:version/Zoho/Integration/User/:userid/CallController',
    authorization({resource: "campaign", action: "write"}), zohoService.EnableZohoUserCallControl);
server.del('/DVP/API/:version/Zoho/Integration/User/:userid/CallController',
    authorization({resource: "campaign", action: "delete"}), zohoService.DisableZohoUserCallControl);
server.post('/DVP/API/:version/Zoho/Integration/Emit',
    authorization({resource: "crmevents", action: "write"}), function (req, res) {

        var tenant = parseInt(req.user.tenant);
        var company = parseInt(req.user.company);
        var jsonString;
        OrganisationConfig.findOne({tenant: tenant, company: company}, function (err, doc) {

            if (!err && doc) {


                if (doc.active_crm && doc.active_crm == 'zoho') {
                    zohoService.ZohoEventEmitter(req, res);
                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No active CRM Integration found", false, undefined);
                    res.end(jsonString);
                }


            } else {

                jsonString = messageFormatter.FormatMessage(err, "Organization config is not available", false, undefined);
                res.end(jsonString);
            }

        })

    });
server.put('/DVP/API/:version/CRM/Integration/Users/CallController',
    authorization({resource: "campaign", action: "write"}), zohoService.EnableZohoUsersCallControl);
server.post('/DVP/API/:version/CRM/:crm/Integration/Activate',
    authorization({resource: "campaign", action: "write"}), function (req, res) {

        var tenant = parseInt(req.user.tenant);
        var company = parseInt(req.user.company);
        var jsonString;
        OrganisationConfig.findOneAndUpdate({
            tenant: tenant,
            company: company
        }, {active_crm: req.params.crm}, function (err, doc) {

            if (!err && doc) {

                jsonString = messageFormatter.FormatMessage(err, "Organization config is not available or crm integration is not available", false, undefined);
                res.end(jsonString);

            } else {

                jsonString = messageFormatter.FormatMessage(undefined, "CRM activated " + req.params.crm, true, undefined);
                res.end(jsonString);
            }

        })

    });


server.listen(port, function () {
    console.log('%s listening at %s', server.name, server.url);
});
