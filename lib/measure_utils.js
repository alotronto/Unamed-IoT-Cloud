/*
Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

Copyright (c) 2014 2015 Francesco Longo
*/
var db_utils = require('./mysql_db_utils');
var db = new db_utils;

var nconf = require('nconf');
nconf.file ({file: process.cwd()+'/lib/settings.json'});

var commandTopic     = nconf.get('config:wamp:topic_command');
var connectionTopic  = nconf.get('config:wamp:topic_connection');

var session_wamp;

measure_utils = function(session){
  session_wamp = session;
};

measure_utils.prototype.manageMeasures = function(board, measurename, measureoperation, res){
    
    switch(measureoperation){
    
        case 'start':
            var response = {
                message : 'Start Measure',
                result: {}
            }
            
            session_wamp.call(board+'.command.rpc.measure.start', [measurename]).then(
                function(result){
                    response.result = result;
                    res.send(JSON.stringify(response));
                } , session_wamp.log);
            
            break
            
        case 'stop':
            var response = {
                message : 'Stop Measure',
                result: {}
            }
            
            session_wamp.call(board+'.command.rpc.measure.stop', [measurename]).then(
                function(result){
                    response.result = result;
                    res.send(JSON.stringify(response));
                } , session_wamp.log);
            
            break

        case 'startallmeasures':
            var response = {
                message : 'Start All Measures',
                result: {}
            }
            
            session_wamp.call(board+'.command.rpc.measure.startallmeasures', []).then(
                function(result){
                    response.result = result;
                    res.send(JSON.stringify(response));
                } , session_wamp.log);
            
            break

        case 'restartallactivemeasures':
            var response = {
                message : 'Stop All Active Measures',
                result: {}
            }
            
            session_wamp.call(board+'.command.rpc.measure.restartallactivemeasures', []).then(
                function(result){
                    response.result = result;
                    res.send(JSON.stringify(response));
                } , session_wamp.log);
            
            break
        
        case 'stopallmeasures':
            var response = {
                message : 'Stop All Measures',
                result: {}
            }
            
            session_wamp.call(board+'.command.rpc.measure.stopallmeasures', []).then(
                function(result){
                    response.result = result;
                    res.send(JSON.stringify(response));
                } , session_wamp.log);
            
            break
            
        default:
            
    }
    
}

measure_utils.prototype.createPlugin = function(pluginname, plugincategory, pluginjsonschema, plugincode, res){
    
    var fs = require('fs');
    
    var response = {
        message : 'Create Plugin',
        result: {}
    }
    
    console.log("pluginname = " + pluginname + " plugincategory = " + plugincategory + " pluginjsonschema = " + pluginjsonschema + " plugincode = " + plugincode);
    
    var fileNamePlugin = './plugins/' + pluginname + '.js';
    fs.writeFile(fileNamePlugin, plugincode, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Plugin " + fileNamePlugin + " injected successfully");
        }
    });
    
    fileNameSchema = './schemas/' + pluginname + '.json';
    fs.writeFile(fileNameSchema, pluginjsonschema, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Schema " + fileNameSchema + " injected successfully");
        }
    });
    
    db.insertCreatedPlugin (pluginname, plugincategory, fileNameSchema, fileNamePlugin, function(result){
        console.log("DB written successfully"); 
        response.result = result;
        res.send(JSON.stringify(response));
    });
    
}
measure_utils.prototype.createMeasure = function(measurename, readplugin, elaborateplugin, res){
    
    var response = {
        message : 'Create Measures',
        result: {}
    }
    
    var readpluginId;
    var elaboratepluginId;
    
    db.getPluginId(readplugin, function(data){
        readpluginId = data[0].id;
        db.getPluginId(elaborateplugin, function(data){
            elaboratepluginId = data[0].id;
            
            db.insertCreatedMeasure (measurename, readpluginId, elaboratepluginId, function(result){
                console.log("DB written successfully"); 
                response.result = result;
                res.send(JSON.stringify(response));
            });
        });
    });
}


//TO BE MODIFIED TO ADAPT IT TO THE FACT THAT THE CODE IS NOW STORED IN THE FILESYSTEM
measure_utils.prototype.injectMeasure = function(board, measurename, measurepin, measureperiod, res){
    
    var response = {
        message : 'Inject Measure',
        result: {}
    }
    
    var readPluginId;
    var elaboratePluginId;
    var readPluginName;
    var elaboratePluginName;
    var readPluginCode;
    var elaboratePluginCode;
    
    //I need to read the composition of the measure from the DB
    db.getReadPluginId(measurename, function(data){
        
        readPluginId = data[0].read_plugin;
        
        db.getReadPlugin(readPluginId, function(data){
            readPluginName = data[0].name;
            readPluginFileName = data[0].code;
            
            var fs = require('fs');
            
            fs.readFile(readPluginFileName, 'utf8', function(err, data) {
                if(err) {
                    console.log(err);
                } else {
                    //console.log("Plugin " + readPluginFileName + " read successfully");
                    
                    readPluginCode = data;
                    
                    db.getElaboratePluginId(measurename, function(data){
                        
                        elaboratePluginId = data[0].elaborate_plugin;
                        
                        db.getElaboratePlugin(elaboratePluginId, function(data){
                            elaboratePluginName = data[0].name;
                            elaboratePluginFileName = data[0].code;
                            
                            var fs = require('fs');
                            
                            fs.readFile(elaboratePluginFileName, 'utf8', function(err, data) {
                                if(err) {
                                    console.log(err);
                                } else {
                                    //console.log("Plugin " + readPluginFileName + " read successfully");
                                    
                                    elaboratePluginCode = data;
                                    
                                    //Now I can call the RPC
                                    
                                    console.log("Calling RPC with measure_name = " + measurename + ", pin = " + measurepin + ", period = " + measureperiod + ", read_plugin_name = " + readPluginName + ", elaborate_plugin_name = " + elaboratePluginName + ", read_plugin_code = " + readPluginCode + ", elaborate_plugin_code = " + elaboratePluginCode);
                                    
                                    session_wamp.call(board+'.command.rpc.injectmeasure', [measurename, measurepin, measureperiod, readPluginName, elaboratePluginName, readPluginCode, elaboratePluginCode]).then(
                                        function(result){
                                            response.result = result;
                                            res.send(JSON.stringify(response));
                                            //Now I can write to the DB that the measure has been injected
                                            db.insertInjectedMeasure (board, measurename, measurepin, measureperiod, function(){
                                                console.log("Measure injected successfully"); 
                                            });
                                        } , session_wamp.log);
                                }
                            });
                        });
                    });
                }
            });
        });
   });
}
        
measure_utils.prototype.injectPlugin = function(board, pluginname, res){
    
    var response = {
        message : 'Inject Plugin',
        result: {}
    }
    
    var pluginId;
    var pluginName;
    var pluginFileName;
    
    //I need to read the name of the plugin from the DB
    db.getPluginId(pluginname, function(data){
        
        pluginId = data[0].id;
        
        //Then I can read the path of the code of the plugin from the DB
        db.getPlugin(pluginId, function(data){
            
            pluginName = data[0].name;
            pluginFileName = data[0].code;
            
            var fs = require('fs');
            
            fs.readFile(pluginFileName, 'utf8', function(err, data) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("Plugin " + pluginFileName + " read successfully");
                    
                    var pluginCode = data;
                    
                    console.log('calling injectplugin with name = ' + pluginName + " code = " + pluginCode);
                    
                    //Now I can perform the RPC call
                    session_wamp.call(board+'.command.rpc.injectplugin', [pluginName, pluginCode]).then(
                        function(result){
                            response.result = result;
                            res.send(JSON.stringify(response));
                            //Now I can write to the DB that the plugin has been injected
                            db.insertInjectedPlugin (board, pluginName, function(){
                                console.log("Plugin injected successfully"); 
                            });
                        } , session_wamp.log);
                }
            });
        });
    });
}

module.exports = measure_utils;
