/**
 * Created by Sukitha on 3/18/2017.
 */

var util = require('util');
var config = require('config');
var request = require('request');
var Zoho = require('dvp-mongomodels/model/Zoho').Zoho;
var ZohoUser = require('dvp-mongomodels/model/Zoho').ZohoUser;
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var q = require("q");
var redis = require("redis");
var validator = require("validator");
var uuid = require('node-uuid');
var jwt = require('jsonwebtoken');
var moment = require('moment');

var _accessToken = config.Services.accessToken;
var callcontrolerHost = config.Services.callcontrolHost;
var callcontrolerPort = config.Services.callcontrolPort;
var callcontrolerVersion = config.Services.callcontrolVersion;

var zoho_id = config.Integrations.zoho.id;
var zoho_redirect = config.Integrations.zoho.redirect;
var zoho_secret = config.Integrations.zoho.secret;

var callControllerURL = util.format("http://%s/DVP/API/%s/MonitorRestAPI/Direct", callcontrolerHost,callcontrolerVersion);


if(validator.isIP(callcontrolerHost))
    callControllerURL = format("http://{0}:{1}/DVP/API/{2}/MonitorRestAPI/Direct", callcontrolerHost,callcontrolerPort,callcontrolerVersion);


if(config.Host.callControllerurl)
    callControllerURL = config.Host.callControllerurl;


var redisip = config.Security.ip;
var redisport = config.Security.port;
var redisuser = config.Security.user;
var redispass = config.Security.password;


//[redis:]//[user][:password@][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]
//redis://user:secret@localhost:6379


var redisClient = redis.createClient(redisport, redisip);

redisClient.on('error', function (err) {
    console.log('Error ' + err);
});

redisClient.auth(redispass, function (error) {

    if(error != null) {
        console.log("Error Redis : " + error);
    }
});




function CreateZohoAccount(req, res) {

    var accessTokenUrl = util.format("https://accounts.zoho.com/oauth/v2/token?code=%s&client_id=%s&client_secret=%s&redirect_uri=%s&grant_type=authorization_code",req.params.code,zoho_id,zoho_secret,zoho_redirect);

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    // Step 3. Exchange oauth token and oauth verifier for access token.
    request.post(accessTokenUrl, function (err, response, accessToken) {

        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
            res.end(jsonString);
        }
        else {

            if (response.statusCode == 200 && response.body) {

                response.body = JSON.parse(response.body);

                if(response.body.refresh_token &&response.body.access_token ) {

                    var zoho = Zoho({
                        company: company,
                        tenant: tenant,
                        created_at: Date.now(),
                        updated_at: Date.now(),
                        status: false,
                        refresh_token: response.body.refresh_token,
                        access_token: response.body.access_token,
                        expires_in: response.body.expires_in,
                        token_type: response.body.token_type
                    });

                    zoho.save(function (err, _zoho) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Zoho save failed", false, undefined);
                            res.end(jsonString);
                        } else {

                            jsonString = messageFormatter.FormatMessage(undefined, "Zoho account saved successfully.", true, undefined);
                            res.end(jsonString);

                        }
                    });
                }else{

                    jsonString = messageFormatter.FormatMessage(undefined, "Zoho access token is invalid", false, undefined);
                    res.end(jsonString);
                }


            }else{


                jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function DeleteZohoAccount(req, res){

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    Zoho.findOneAndRemove({company:company, tenant:tenant}, function(err, doc){

        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Delete Zoho account failed", false, undefined);
            res.end(jsonString);
        }
        else {

            ZohoUser.remove({company:company, tenant:tenant}, function(_err, doc){
                if(_err){

                    jsonString = messageFormatter.FormatMessage(_err, "Delete Zoho account successful but user delete failed", false, undefined);


                }else{

                    jsonString = messageFormatter.FormatMessage(undefined, "Delete Zoho account successful", true, undefined);

                }

                res.end(jsonString);
            });
        }
    });
}

function DisableZohoIntegration(req, res){

    //https://api.zoho.com/crm/v2/phonebridge/integrate
    //Zoho-oauthtoken 1000.fbc3819a5543716110fe911afe5c9c1d.2489961c4478e661015757f657d4cebb

    var jsonString;
    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    GetAccessToken(tenant,company).then(function(data){

        var options = {
            method: 'DELETE',
            uri: "https://api.zoho.com/crm/v2/phonebridge/integrate",
            headers: {
                'Authorization': util.format("Zoho-oauthtoken %s", data),
            }
        };

        request(options, function (error, response, body) {

            if (error) {
                jsonString = messageFormatter.FormatMessage(error, "Disable Zoho phone bridge failed", false, undefined);
                res.end(jsonString);
            }
            else {

                if (response.statusCode == 200) {
                    Zoho.findOneAndUpdate({company:company, tenant:tenant},{status:false}, function(err, doc){
                        if(err){
                            jsonString = messageFormatter.FormatMessage(err, "Zoho phone bridged", false, undefined);
                            res.end(jsonString);

                        }else{
                            jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridged", true, undefined);
                            res.end(jsonString);
                        }
                    });
                }
                else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Disable Zoho phone bridge failed", false, undefined);
                    res.end(jsonString);
                }
            }
        });

    }).catch(function(err){

        jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
        res.end(jsonString);
    });
};

function EnableZohoIntegration(req, res){

    //https://api.zoho.com/crm/v2/phonebridge/integrate
    //Zoho-oauthtoken 1000.fbc3819a5543716110fe911afe5c9c1d.2489961c4478e661015757f657d4cebb

    var jsonString;
    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    GetAccessToken(tenant,company).then(function(data){

        var options = {
            method: 'POST',
            uri: "https://api.zoho.com/crm/v2/phonebridge/integrate",
            headers: {
                'Authorization': util.format("Zoho-oauthtoken %s", data),
            }
        };

        request(options, function (error, response, body) {

            if (error) {
                jsonString = messageFormatter.FormatMessage(error, "Zoho phone bridge failed", false, undefined);
                res.end(jsonString);
            }
            else {

                if (response.statusCode == 200) {
                    Zoho.findOneAndUpdate({company:company, tenant:tenant},{status:true}, function(err, doc){
                        if(err){
                            jsonString = messageFormatter.FormatMessage(err, "Zoho phone bridged", false, undefined);
                            res.end(jsonString);

                        }else{
                            jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridged", true, undefined);
                            res.end(jsonString);
                        }
                    });

                }
                else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridge failed", false, undefined);
                    res.end(jsonString);
                }
            }
        });

    }).catch(function(err){

        jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
        res.end(jsonString);
    });
};

function EnableZohoCallControl(req, res){

    //https://api.zoho.com/crm/v2/phonebridge/integrate
    //Zoho-oauthtoken 1000.fbc3819a5543716110fe911afe5c9c1d.2489961c4478e661015757f657d4cebb

    //https://api.zoho.com/crm/v2/phonebridge/clicktocallandcallcontrol?clicktocallurl=https://api.pbx.com/zoho/clicktocall&answerurl=https://api.pbx.com/zoho/answerurl&

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    GetAccessToken(tenant,company).then(function(data){

        GetActiveUserArray(tenant,company).then(function(data){


            var propertiesObject = {
                clicktocallurl: util.format("%s/clicktocall",callControllerURL),
                answerurl: util.format("%s/answer",callControllerURL),
                hungupurl: util.format("%s/hungup",callControllerURL),
                muteurl: util.format("%s/mute/true",callControllerURL),
                unmuteurl: util.format("%s/mute/false",callControllerURL),
                holdurl: util.format("%s/hold/true",callControllerURL),
                unholdurl: util.format("%s/hold/false",callControllerURL),
                keypressurl: util.format("%s/dtmf",callControllerURL),
                authorizationparam: util.format("{name:Authorization,value:%s}",GetServerToken(req.user.iss,tenant,company)),
                userid:data

            };

            var options = {
                method: 'POST',
                uri: "https://api.zoho.com/crm/v2/phonebridge/clicktocallandcallcontrol",
                qs: propertiesObject,
                headers: {
                    'Authorization': util.format("Zoho-oauthtoken %s", data),
                }
            };

            request(options, function (error, response, body) {

                if (error) {
                    jsonString = messageFormatter.FormatMessage(err, "Zoho phone bridge failed", false, undefined);
                    res.end(jsonString);
                }
                else {

                    if (response.statusCode == 200) {
                        jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridged", true, undefined);
                        res.end(jsonString);
                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridge failed", false, undefined);
                        res.end(jsonString);
                    }
                }
            });

        }).catch(function(err){

            jsonString = messageFormatter.FormatMessage(err, "get active userlist failed", false, undefined);
            res.end(jsonString);
        });

    }).catch(function(err){

        jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
        res.end(jsonString);
    });
}

function GetZohoAccount(req, res) {
    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    Zoho.findOne({company: company, tenant: tenant}, function(err, data){
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Zoho", false, undefined);
            res.end(jsonString);
        }
        else {

            jsonString = messageFormatter.FormatMessage(undefined, "Zoho ", true, data);
            res.end(jsonString);
        }
    });
}

function GetAccessToken(tenant, company){

    var defer = q.defer();
    Zoho.findOne({company: company, tenant: tenant}, function(err, data){

        if (err) {

            return defer.reject("Error in finding zoho access token");
        }

        if (data && data.refresh_token && data.access_token && data.expires_in && data.updated_at) {


            var expireDate = new Date(data.updated_at.getTime() + data.expires_in);

            if(expireDate < new Date(new Date().getTime() + 600000 )) {
                //3600000

                var refreshTokenUrl = util.format("https://accounts.zoho.com/oauth/v2/token?refresh_token=%s&client_id=%s&client_secret=%s&redirect_uri=%s&grant_type=refresh_token", data.refresh_token, zoho_id, zoho_secret, zoho_redirect);

                request.post(refreshTokenUrl, function (err, response, accessToken) {

                    if (err) {

                        return defer.reject("Error in finding zoho access token");
                    }
                    else {

                        if (response.statusCode == 200 && response.body) {

                            response.body = JSON.parse(response.body);

                            Zoho.findOneAndUpdate({company:company, tenant:tenant},{access_token:response.body.access_token, updated_at: new Date()},
                                function(error,_doc){

                                    if(error){

                                        console.log("Error i saving ", error);

                                    }else{

                                         console.log("No Error found token released");
                                    }

                                    return defer.resolve(response.body.access_token);

                                });

                        } else {

                            return defer.reject("Error in finding zoho access token");
                        }
                    }
                });
            }else{

                return defer.resolve(data.access_token);
            }
        }
        else {

            return defer.reject("No zoho Access Token found");
        }

    });

    return defer.promise;
};

function GetActiveUserArray(tenant, company){

    var defer = q.defer();
    ZohoUser.find({company: company, tenant: tenant, status: true}, function(err, data){


        if (err) {

            return defer.reject("Error in finding zoho userlist");
        }

        if (data) {
            if(Array.isArray(data) && data.length > 0){

                var userids = vardata.map(function(item){

                    return item._id;
                });

                defer.resolve(userids.join());


            }else{

                return defer.resolve(data._id);
            }

        }else{

            return defer.reject("Error in finding zoho userlist");
        }
    });

};

function GetServerToken(iss, tenant, company){



    var jti = uuid.v4();
    var secret = uuid.v4();
    var expin  = moment().add(7, 'years').unix();
    var redisKey = "token:iss:"+iss+":"+jti;
    redisClient.set(redisKey, secret, redis.print);
    redisClient.expireat(redisKey, expin);

    var payload = {};
    payload.iss = iss;
    payload.jti = jti;
    payload.sub = "Access client";
    payload.exp = expin;
    payload.tenant = tenant;
    payload.company = company;
    payload.aud = "crm event integrations";

    //payload.scope = scope;

    var scopes = [
        {
            "resource": "Dispatch",
            "actions": [
                "write"
            ]
        }
    ];

    payload.scope = scopes;
    var token = jwt.sign(payload, secret);

    return token;

};

function GetUserByEmail(tenant, company, email) {

    var defer = q.defer();
    ZohoUser.findOne({company: company, tenant: tenant, status: true, email: email}, function (err, data) {

        if (err) {

            return defer.reject("Error in finding zoho user");
        }

        if (data) {

            return defer.resolve(data);

        } else {

            return defer.reject("Error in finding zoho user");
        }
    });

    return defer.promise;

};

function ZohoEventEmitter(req, res) {

    //https://api.zoho.com/crm/v2/phonebridge/integrate
    //Zoho-oauthtoken 1000.fbc3819a5543716110fe911afe5c9c1d.2489961c4478e661015757f657d4cebb

    var jsonString;
    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);

    var url = "https://api.zoho.com/crm/v2/phonebridge";

    var queryParams = {};

    //callstarttime
    //direction
    //duration
    //voiceurl
    //desc
    //callresult
    //callpurpose
    //isbillable
    //
    //callmissedtime
    //voicemailurl
    //sequential

    if (req.body && req.body.action && req.body.session && req.body.from && req.body.to && req.body.profile) {

        url = util.format("https://api.zoho.com/crm/v2/phonebridge/call%s", req.body.action);
        queryParams = {
            callrefid: req.body.session,
            fromnumber: req.body.from,
            tonumber: req.body.to,
            userid: req.body.profile
        };

        if (req.body.action == 'hungup') {

            if (req.body.starttime) {

                queryParams.callstarttime = req.body.starttime;
            }
            if (req.body.direction) {

                queryParams.direction = req.body.direction;
            }
            if (req.body.duration) {

                queryParams.duration = req.body.duration;
            }
            if (req.body.result) {

                queryParams.result = req.body.result;
            }
            if (req.body.purpose) {

                queryParams.purpose = req.body.purpose;
            }
            if (req.body.description) {

                queryParams.desc = req.body.description;
            }

            if (config.Services.fileserviceurl && config.Services.fileserviceVersion) {

                queryParams.voiceurl = util.format("http://%s/DVP/API/%s/InternalFileService/File/DownloadLatest/%s/%s/%s.mp3", config.Services.fileserviceurl, config.Services.fileserviceVersion, tenant, company, queryParams.callrefid);


            }

        } else if (req.body.action == 'missed') {

            if (req.body.missedtime) {

                queryParams.callmissedtime = req.body.missedtime;
            }
            if (req.body.sequential) {

                queryParams.sequential = req.body.sequential;
            }
        }

    } else {

        jsonString = messageFormatter.FormatMessage(undefined, "Event emitter failed no enough data found", false, undefined);
        res.end(jsonString);
        return;
    }


    GetUserByEmail(tenant, company, req.body.profile).then(function (data) {

        console.log(data);
        if(data && data._id) {
            queryParams.userid = data._id;
            GetAccessToken(tenant, company).then(function (data) {

                var options = {
                    method: 'POST',
                    uri: url,
                    qs: queryParams,
                    headers: {
                        'Authorization': util.format("Zoho-oauthtoken %s", data),
                    }
                };

                //console.log(options);

                request(options, function (error, response, body) {

                    console.log(options);
                    //console.log(response);

                    if (error) {
                        jsonString = messageFormatter.FormatMessage(err, "Zoho event emitter failed", false, undefined);
                        res.end(jsonString);
                    }
                    else {

                        if (response.statusCode < 200 || response.statusCode > 299) {

                            jsonString = messageFormatter.FormatMessage(undefined, "Zoho event emitter failed", false, undefined);
                            res.end(jsonString);
                        }
                        else {


                            jsonString = messageFormatter.FormatMessage(undefined, "Zoho event emits", true, undefined);
                            res.end(jsonString);
                        }
                    }
                });

            }).catch(function (err) {

                jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
                res.end(jsonString);
            });
        }else{

            jsonString = messageFormatter.FormatMessage(false, "get Zoho user by email failed", false, undefined);
            res.end(jsonString);
        }

    }).catch(function (err) {

        jsonString = messageFormatter.FormatMessage(err, "get Zoho user by email failed", false, undefined);
        res.end(jsonString);
    });
};

function ImportZohoUsers(req, res) {

    var getUserUrl = util.format("https://api.zoho.com/crm/v2/phonebridge/users");

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    // Step 3. Exchange oauth token and oauth verifier for access token.

    GetAccessToken(tenant,company).then(function(data){

        var options = {
            method: 'POST',
            uri: getUserUrl,
            headers: {
                'Authorization': util.format("Zoho-oauthtoken %s", data),
            }
        };
        request.post(options, function (err, response, accessToken) {

            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "get Zoho users failed", false, undefined);
                res.end(jsonString);
            }
            else {

                if (response.statusCode == 200 && response.body && response.body) {

                    response.body = JSON.parse(response.body);

                    if(response.body.users) {
                        var userArray = response.body.users.map(function (item) {

                            return ZohoUser({

                                company: company,
                                tenant: tenant,
                                created_at: Date.now(),
                                updated_at: Date.now(),
                                status: true,
                                _id: item.userid,
                                username: item.username,
                                email: item.email

                            });
                        });

                        ZohoUser.insertMany(userArray,{ordered : false}, function (err, mongooseDocuments) {

                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Zoho accounts save failed", false, undefined);
                                res.end(jsonString);
                            } else {

                                jsonString = messageFormatter.FormatMessage(undefined, "Zoho accounts saved successfully.", true, undefined);
                                res.end(jsonString);
                            }
                        });
                    }else{

                        jsonString = messageFormatter.FormatMessage(undefined, "get Zoho users failed", false, undefined);
                        res.end(jsonString);
                    }

                }else{

                    jsonString = messageFormatter.FormatMessage(undefined, "get Zoho users failed", false, undefined);
                    res.end(jsonString);
                }
            }
        });




    }).catch(function(err){

        jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
        res.end(jsonString);
    });

};

function SaveZohoUser(req, res) {

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var zohoUser = ZohoUser({

        company: company,
        tenant: tenant,
        created_at: Date.now(),
        updated_at: Date.now(),
        status: true,
        _id: req.body.userid,
        username: req.body.username,
        integrated: false,
        email: req.body.email

    });


    zohoUser.save(function (err, mongooseDocuments) {

        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Zoho save failed", false, undefined);
            res.end(jsonString);
        } else {

            jsonString = messageFormatter.FormatMessage(undefined, "Zoho account saved successfully.", true, mongooseDocuments);
            res.end(jsonString);
        }
    });

}

function LoadZohoUsers(req, res) {

    var getUserUrl = util.format("https://api.zoho.com/crm/v2/phonebridge/users");

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    // Step 3. Exchange oauth token and oauth verifier for access token.
    request.post(getUserUrl, function (err, response, accessToken) {

        if (error) {

            jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
            res.end(jsonString);
        }
        else {

            if (response.statusCode == 200 && response.body && response.body.Users) {


                jsonString = messageFormatter.FormatMessage(undefined, "Zoho users load successfully.", true, response.body.Users);
                res.end(jsonString);


            } else {

                jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

function GetZohoUsers(req, res) {

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    ZohoUser.find({company: company, tenant: tenant}, function (err, data) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get Zoho user list failed", false, undefined);
            res.end(jsonString);
        } else {

            jsonString = messageFormatter.FormatMessage(undefined, "Get Zoho user list successfully.", true, data);
            res.end(jsonString);

        }
    });

};

function EnableZohoUserCallControl(req, res) {

    //https://api.zoho.com/crm/v2/phonebridge/integrate
    //Zoho-oauthtoken 1000.fbc3819a5543716110fe911afe5c9c1d.2489961c4478e661015757f657d4cebb

    //https://api.zoho.com/crm/v2/phonebridge/clicktocallandcallcontrol?clicktocallurl=https://api.pbx.com/zoho/clicktocall&answerurl=https://api.pbx.com/zoho/answerurl&

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    GetAccessToken(tenant, company).then(function (data) {


        //var propertiesObject = {
        //    clicktocallurl: util.format("%s/clicktocall", callControllerURL),
        //    answerurl: util.format("%s/answer", callControllerURL),
        //    hungupurl: util.format("%s/hangup", callControllerURL),
        //    muteurl: util.format("%s/mute", callControllerURL),
        //    unmuteurl: util.format("%s/unmute", callControllerURL),
        //    holdurl: util.format("%s/hold", callControllerURL),
        //    unholdurl: util.format("%s/unhold", callControllerURL),
        //    keypressurl: util.format("%s/key", callControllerURL),
        //    userid: req.params.userid,
        //    authorizationparam: {"name":"authorization","value": GetServerToken(req.user.iss,tenant,company)}
        //
        //};


        var propertiesObject = {
            clicktocallurl: util.format("%s/clicktocall",callControllerURL),
            answerurl: util.format("%s/answer",callControllerURL),
            hungupurl: util.format("%s/hungup",callControllerURL),
            muteurl: util.format("%s/mute/true",callControllerURL),
            unmuteurl: util.format("%s/mute/false",callControllerURL),
            holdurl: util.format("%s/hold/true",callControllerURL),
            unholdurl: util.format("%s/hold/false",callControllerURL),
            keypressurl: util.format("%s/dtmf",callControllerURL),
            authorizationparam: util.format("{name:Authorization,value:%s}",GetServerToken(req.user.iss,tenant,company)),
            userid:req.params.userid

        };

        console.log(propertiesObject);

        var options = {
            method: 'POST',
            uri: "https://api.zoho.com/crm/v2/phonebridge/clicktocallandcallcontrol",
            qs: propertiesObject,
            headers: {
                'Authorization': util.format("Zoho-oauthtoken %s", data),
            }
        };

        request(options, function (error, response, body) {

            if (error) {
                jsonString = messageFormatter.FormatMessage(error, "Zoho phone bridge failed", false, undefined);
                res.end(jsonString);
            }
            else {

                if (response.statusCode == 200) {

                    ZohoUser.findOneAndUpdate({_id:req.params.userid},{integrated:true}, function(err, doc){
                        if(err){

                            jsonString = messageFormatter.FormatMessage(err, "Zoho phone bridged but user update failed", false, undefined);
                            res.end(jsonString);

                        }else{

                            jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridged", true, undefined);
                            res.end(jsonString);
                        }

                    });

                }
                else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridge failed", false, undefined);
                    res.end(jsonString);
                }
            }
        });


    }).catch(function (err) {

        jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
        res.end(jsonString);
    });
};

function EnableZohoUsersCallControl(req, res) {

    //https://api.zoho.com/crm/v2/phonebridge/integrate
    //Zoho-oauthtoken 1000.fbc3819a5543716110fe911afe5c9c1d.2489961c4478e661015757f657d4cebb

    //https://api.zoho.com/crm/v2/phonebridge/clicktocallandcallcontrol?clicktocallurl=https://api.pbx.com/zoho/clicktocall&answerurl=https://api.pbx.com/zoho/answerurl&

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    var ids;
    if(req.body && req.body.userids && Array.isArray(req.body.userids)) {
        ids = req.body.userids.join();
    }
    else {
        jsonString = messageFormatter.FormatMessage(undefined, "method expect userids array inbody", false, undefined);
        res.end(jsonString);
        return;
    }


    GetAccessToken(tenant, company).then(function (data) {


        //var propertiesObject = {
        //    clicktocallurl: util.format("%s/clicktocall", callControllerURL),
        //    answerurl: util.format("%s/answer", callControllerURL),
        //    hungupurl: util.format("%s/hangup", callControllerURL),
        //    muteurl: util.format("%s/mute", callControllerURL),
        //    unmuteurl: util.format("%s/unmute", callControllerURL),
        //    holdurl: util.format("%s/hold", callControllerURL),
        //    unholdurl: util.format("%s/unhold", callControllerURL),
        //    keypressurl: util.format("%s/key", callControllerURL),
        //    userid: ids,
        //    authorizationparam: {"name":"authorization","value": GetServerToken(req.user.iss,tenant,company)}
        //
        //};

        var propertiesObject = {
            clicktocallurl: util.format("%s/clicktocall",callControllerURL),
            answerurl: util.format("%s/answer",callControllerURL),
            hungupurl: util.format("%s/hungup",callControllerURL),
            muteurl: util.format("%s/mute/true",callControllerURL),
            unmuteurl: util.format("%s/mute/false",callControllerURL),
            holdurl: util.format("%s/hold/true",callControllerURL),
            unholdurl: util.format("%s/hold/false",callControllerURL),
            keypressurl: util.format("%s/dtmf",callControllerURL),
            authorizationparam: util.format("{name:Authorization,value:%s}",GetServerToken(req.user.iss,tenant,company)),
            userid:ids

        };

        var options = {
            method: 'POST',
            uri: "https://api.zoho.com/crm/v2/phonebridge/clicktocallandcallcontrol",
            qs: propertiesObject,
            headers: {
                'Authorization': util.format("Zoho-oauthtoken %s", data),
            }
        };

        request(options, function (error, response, body) {

            if (error) {
                jsonString = messageFormatter.FormatMessage(error, "Zoho phone bridge failed", false, undefined);
                res.end(jsonString);
            }
            else {

                if (response.statusCode == 200) {


                    ZohoUser.updateMany({_id:{$in :req.body.userids}},{integrated:true}, function(err, doc){
                        if(err){

                            jsonString = messageFormatter.FormatMessage(err, "Zoho phone bridged but user update failed", false, undefined);
                            res.end(jsonString);

                        }else{

                            jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridged", true, undefined);
                            res.end(jsonString);
                        }

                    });

                }
                else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridge failed", false, undefined);
                    res.end(jsonString);
                }
            }
        });


    }).catch(function (err) {

        jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
        res.end(jsonString);
    });
};

function DisableZohoUserCallControl(req, res) {

    //https://api.zoho.com/crm/v2/phonebridge/integrate
    //Zoho-oauthtoken 1000.fbc3819a5543716110fe911afe5c9c1d.2489961c4478e661015757f657d4cebb

    //https://api.zoho.com/crm/v2/phonebridge/clicktocallandcallcontrol?clicktocallurl=https://api.pbx.com/zoho/clicktocall&answerurl=https://api.pbx.com/zoho/answerurl&

    var tenant = parseInt(req.user.tenant);
    var company = parseInt(req.user.company);
    var jsonString;
    GetAccessToken(tenant, company).then(function (data) {


        //var propertiesObject = {
        //    clicktocallurl: util.format("%s/clicktocall", callControllerURL),
        //    answerurl: util.format("%s/answer", callControllerURL),
        //    hungupurl: util.format("%s/hangup", callControllerURL),
        //    muteurl: util.format("%s/mute", callControllerURL),
        //    unmuteurl: util.format("%s/unmute", callControllerURL),
        //    holdurl: util.format("%s/hold", callControllerURL),
        //    unholdurl: util.format("%s/unhold", callControllerURL),
        //    keypressurl: util.format("%s/key", callControllerURL),
        //    userid: req.params.userid,
        //    authorizationparam: {"name":"authorization","value": GetServerToken(req.user.iss,tenant,company)}
        //
        //};

        var propertiesObject = {
            clicktocallurl: util.format("%s/clicktocall",callControllerURL),
            answerurl: util.format("%s/answer",callControllerURL),
            hungupurl: util.format("%s/hungup",callControllerURL),
            muteurl: util.format("%s/mute/true",callControllerURL),
            unmuteurl: util.format("%s/mute/false",callControllerURL),
            holdurl: util.format("%s/hold/true",callControllerURL),
            unholdurl: util.format("%s/hold/false",callControllerURL),
            keypressurl: util.format("%s/dtmf",callControllerURL),
            authorizationparam: util.format("{name:Authorization,value:%s}",GetServerToken(req.user.iss,tenant,company)),
            userid:req.params.userid

        };

        var options = {
            method: 'DELETE',
            uri: "https://api.zoho.com/crm/v2/phonebridge/clicktocallandcallcontrol",
            qs: propertiesObject,
            headers: {
                'Authorization': util.format("Zoho-oauthtoken %s", data),
            }
        };

        request(options, function (error, response, body) {

            if (error) {
                jsonString = messageFormatter.FormatMessage(error, "Zoho phone bridge failed", false, undefined);
                res.end(jsonString);
            }
            else {

                if (response.statusCode == 200) {

                    ZohoUser.findOneAndUpdate({_id:req.params.userid},{integrated:false}, function(err, doc){
                        if(err){

                            jsonString = messageFormatter.FormatMessage(err, "Zoho phone bridged but user update failed", false, undefined);
                            res.end(jsonString);

                        }else{

                            jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridged", true, undefined);
                            res.end(jsonString);
                        }

                    });

                }
                else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Zoho phone bridge failed", false, undefined);
                    res.end(jsonString);
                }
            }
        });


    }).catch(function (err) {

        jsonString = messageFormatter.FormatMessage(err, "get Zoho access token failed", false, undefined);
        res.end(jsonString);
    });
};



module.exports.CreateZohoAccount = CreateZohoAccount;
module.exports.EnableZohoIntegration = EnableZohoIntegration;
module.exports.EnableZohoCallControl = EnableZohoCallControl;
module.exports.DisableZohoIntegration = DisableZohoIntegration;
module.exports.ZohoEventEmitter = ZohoEventEmitter;
module.exports.ImportZohoUsers = ImportZohoUsers;
module.exports.GetZohoUsers = GetZohoUsers;
module.exports.LoadZohoUsers = LoadZohoUsers;
module.exports.SaveZohoUser = SaveZohoUser;
module.exports.EnableZohoUserCallControl = EnableZohoUserCallControl;
module.exports.DisableZohoUserCallControl = DisableZohoUserCallControl;
module.exports.EnableZohoUsersCallControl = EnableZohoUsersCallControl;
module.exports.DeleteZohoAccount = DeleteZohoAccount;
module.exports.GetZohoAccount = GetZohoAccount;

