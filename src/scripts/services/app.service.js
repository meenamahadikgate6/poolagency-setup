'use strict';

/**
 *
 * @ngdoc service
 * @name Angular.service:service
 * @description Data provider to provide caching.
 */

angular
  .module("POOLAGENCY")

  .factory("service", function() {
    //Private objects
    var serviceObj = {};

    serviceObj.jobDetails = [];
    serviceObj.jobDetails2 = [];

    return serviceObj;
  })
  .factory("companyService", function() {
    //Private objects
    var selectedCompanyObj = {};

    selectedCompanyObj.selectedCompany = 0;
    

    return selectedCompanyObj;
  })
  .service("socketService", function() {})
  .factory("socket", function($rootScope, auth, config) {
    var userId = 0;
    if (auth.getSession()) {
      if (auth.getSession().id) {
        userId = auth.getSession().id;
      }
    }
    var socketServer = config.currentEnvironment.socketServer;

    var socket = io.connect(socketServer + "?userId=" + userId);
    // var socket = io.connect();

    return {
      on: function(eventName, callback) {
        socket.on(eventName, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        });
      },
      emit: function(eventName, data, callback) {
        socket.emit(eventName, data, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        });
      },
      disconnect: function() {
        socket.disconnect();
      }
    };
  })  
  .factory("commonService", function() {
    let ASCToHex = function(asc) {
      var hex = '';
      for (var i = 0; i < asc.length; i++) {
      hex += ('0' + asc.charCodeAt(i).toString(16)).slice(-2);
      }
      return hex;
    }  
    return {ASCToHex};
  })
  .service('DecryptionService', function() {
    this.decrypt = function(ciphertextStr) {
        var key = CryptoJS.enc.Utf8.parse('6bc1bee22e409f96e93d7e117393172a');
        if (ciphertextStr == '' || ciphertextStr == null) {
            return '';
        }
        var ciphertext = CryptoJS.enc.Base64.parse(ciphertextStr);
        var iv = ciphertext.clone();
        iv.sigBytes = 16;
        iv.clamp();
        ciphertext.words.splice(0, 4);
        ciphertext.sigBytes -= 16;
        var decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, {
            iv: iv
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    };
})
  .service('BroadcastService', function($rootScope) {
    const channel = new BroadcastChannel('pb_channel_service');
    this.sendMessage = function(data) {
      channel.postMessage(data);
    };
    this.onMessage = function(callback) {
      channel.onmessage = (event) => {
        $rootScope.$apply(() => {
          callback(event.data);
        });
      };
    };
  })
  .service('getPaymentConfig', function(apiGateWay, $q, DecryptionService, $rootScope){  
    $rootScope.cachedPaymentConfigData = {};     
    let getData = function(companyId){   
      let deferred = $q.defer();      
      // Check if data is already cached
      if ($rootScope.cachedPaymentConfigData[companyId]) {
        deferred.resolve($rootScope.cachedPaymentConfigData[companyId]);
      } else {
        apiGateWay.get("/config",  {companyId: companyId}).then(function(response) {
          if (response.data.status == 200) {
            let configData = null;            
            if (response.data.data && response.data.data.hasOwnProperty("paya")) {
              configData = {
                "developer-id": DecryptionService.decrypt(response.data.data.paya['developer-id'], 'developer-id'),              
                "location-id": DecryptionService.decrypt(response.data.data.paya['location-id'], 'location-id'), 
                "url": response.data.data.paya['url'], 
                "user-api-key": DecryptionService.decrypt(response.data.data.paya['user-api-key'], 'user-api-key'), 
                "user-hash-key": DecryptionService.decrypt(response.data.data.paya['user-hash-key'], 'user-hash-key'), 
                "user-id": DecryptionService.decrypt(response.data.data.paya['user-id'], 'user-id'),
                "paymentGateway": response.data.data.paya['paymentGateway'],
              }   
              response.data.data.paya = configData; 
            } else if (response.data.data && response.data.data.hasOwnProperty("nuvei")) {
              configData = {
                "clientRequestId": DecryptionService.decrypt(response.data.data.nuvei['clientRequestId'], 'clientRequestId'),              
                "merchantId": DecryptionService.decrypt(response.data.data.nuvei['merchantId'], 'merchantId'),
                "url": response.data.data.nuvei['url'],  
                "merchantSecretKey": DecryptionService.decrypt(response.data.data.nuvei['merchantSecretKey'], 'merchantSecretKey'), 
                "merchantSiteId": DecryptionService.decrypt(response.data.data.nuvei['merchantSiteId'], 'merchantSiteId'), 
                "paymentGateway": response.data.data.nuvei['paymentGateway'],
                "currency": response.data.data.nuvei['currency'] || "USD",
                "country": response.data.data.nuvei['country'] || "US",
              }   
              response.data.data.nuvei = configData; 
            } else if (response.data.data && response.data.data.hasOwnProperty("ab")) {
              configData = {
                "merchantId": DecryptionService.decrypt(response.data.data.ab['merchantId'], 'merchantId'), 
                "merchantKeyId": DecryptionService.decrypt(response.data.data.ab['merchantKeyId'], 'merchantKeyId'),              
                "merchantSecretKey": DecryptionService.decrypt(response.data.data.ab['merchantSecretKey'], 'merchantSecretKey'),
                "paymentGateway": response.data.data.ab['paymentGateway'],
                "currency": response.data.data.ab['currency'] || "USD",
                "country": response.data.data.ab['country'] || "US",
              }                             
              response.data.data.ab = configData; 
            }             
            if (configData) {
              $rootScope.cachedPaymentConfigData[companyId] = configData;
              deferred.resolve(configData);
            } else {
              deferred.reject(response.data);              
            }            
          } else {
            deferred.reject(response.data);
          }      
        }, function(error){
          deferred.reject(error);
        });
      }      
      return deferred.promise;
    }
    return {
      get: getData
    }
  })
  .service('getDromoConfig', function(apiGateWay, $q, DecryptionService, $rootScope){
    $rootScope.cachedDromoData = null;    
    let getData = function(companyId){   
      let deferred = $q.defer(); 
      // if ($rootScope.cachedDromoData) {
      //   deferred.resolve($rootScope.cachedDromoData);
      //   return deferred.promise
      // }
      apiGateWay.get("/config",  {companyId: companyId}).then(function(response) {
          if (response.data.status == 200) {
           let dromo = {              
              "dromo_access_key": DecryptionService.decrypt(response.data.data.dromo.dromo_access_key, 'dromo_access_key'),
            }   
            response.data.data.dromo = dromo;
            $rootScope.cachedDromoData = dromo;             
            deferred.resolve(response.data.data.dromo);
          } else {
             deferred.reject(response.data);
          }      
      }, function(error){
        return deferred.reject(error)
      })
      return deferred.promise
    }  
    return {
      get: getData
    }
  })  
  .factory('AwsConfigService', function ($rootScope, apiGateWay, DecryptionService, configConstant, auth, $q) {
    var awsConfigPromise = null;
    var awsConfig;
    var maxRetries = 3;

    function fetchConfig(attempt) {
      let selectedEnv = configConstant.currEnvironment;
      let companyId = auth.getSession().companyId;
      return apiGateWay.get("/config?awsKeyAccessCode=" + configConstant[selectedEnv].awsKeyAccessCode, { companyId: companyId })
        .then(function (response) {
          if (response.data.status == 200) {
            awsConfig = {
              bucket: DecryptionService.decrypt(response.data.data.aws.appS3bucket),
              access_key: DecryptionService.decrypt(response.data.data.aws.awsAccessKey),
              secret_key: DecryptionService.decrypt(response.data.data.aws.awsSecretKey),
              region: DecryptionService.decrypt(response.data.data.aws.awsRegion),
              domain: DecryptionService.decrypt(response.data.data.aws.s3ImgUrl),
              publicDomain: DecryptionService.decrypt(response.data.data.aws.publicDomain),
              companyId: companyId
            };
            if ($rootScope.isLocalServer || $rootScope.isTestServer) {
              awsConfig.domain = awsConfig.domain.replace('/test', '/');
            } else {
              if (awsConfig.domain && !awsConfig.domain.endsWith('/')) {
                awsConfig.domain = awsConfig.domain + '/';
              }
            }
            return awsConfig;
          } else {
            return $q.reject("Invalid response status");
          }
        })
        .catch(function (error) {
          if (attempt < maxRetries) {
            return fetchConfig(attempt + 1);
          } else {
            return $q.reject("Max retries reached: " + error);
          }
        });
    }

    return {
      fetchAwsConfig: function () {
        if (!awsConfigPromise) {
          awsConfigPromise = fetchConfig(1);
        }
        return awsConfigPromise;
      },
      getAwsConfig: function () {
        return awsConfig;
      },
      resetAwsConfigPromise: function () {
        awsConfigPromise = null;
      }
    };
  })
  .factory('AwsS3Service', function(AwsConfigService, auth) {
    var awsConfig;  
    AwsConfigService.fetchAwsConfig().then(function(config) {      
      awsConfig = config;      
      AWS.config.update({
        accessKeyId: awsConfig.access_key,
        secretAccessKey: awsConfig.secret_key,
        region: awsConfig.region
      });
    });
  
    return {
      getAwsConfig: function() {
        return awsConfig;
      },
      getAwsS3Instance: function() {
        return new AWS.S3();
      }
    };
  })
  .factory('AwsS3Utility', function(AwsS3Service, AwsConfigService, $q) {
    var awsS3Service = AwsS3Service;  
    function fetchAwsConfigAndPerformOperation(operationFunction, ...args) {
      return AwsConfigService.fetchAwsConfig().then(function(config) {
        awsS3Service.getAwsS3Instance().config.update({
          accessKeyId: config.access_key,
          secretAccessKey: config.secret_key,
          region: config.region
        });
        return operationFunction(...args);
      });
    }  
    return {
      upload: function(key, body) {
        return fetchAwsConfigAndPerformOperation(function() {
          var params = {
            Bucket: awsS3Service.getAwsConfig().bucket,
            Key: key,
            Body: body,
            ServerSideEncryption: 'AES256'
          };
          return awsS3Service.getAwsS3Instance().putObject(params).promise();
        });
      },
      copy: function(sourceKey, destinationKey) {
        return fetchAwsConfigAndPerformOperation(function() {
          var params = {
            Bucket: awsS3Service.getAwsConfig().bucket,
            CopySource: `/${awsS3Service.getAwsConfig().bucket}/${sourceKey}`,
            Key: destinationKey
          };
          return awsS3Service.getAwsS3Instance().copyObject(params).promise();
        });
      },
      get: function(key) {
        return fetchAwsConfigAndPerformOperation(function() {
          var params = {
            Bucket: awsS3Service.getAwsConfig().bucket,
            Key: key
          };
          return awsS3Service.getAwsS3Instance().getObject(params).promise();
        });
      },
      list: function(prefixes) {
        return fetchAwsConfigAndPerformOperation(function() {
          var bucket = awsS3Service.getAwsConfig().bucket;
          var promises = prefixes.map(function(prefix) {
            var params = {
              Bucket: bucket,
              Prefix: prefix
            };
            return awsS3Service.getAwsS3Instance().listObjects(params).promise();
          });
          return Promise.all(promises);
        });
      },
      uploadFiles: function(keys) {
        var uploadPromises = keys.map(function(key) {
          return this.upload(key);
        }, this);
        return $q.all(uploadPromises);
      },
      deleteFiles: function(keys) {
        var params = {
          Bucket: awsS3Service.getAwsConfig().bucket,
          Delete: {
            Objects: keys.map(function(key) {
              return { Key: key };
            })            
          }
        };        
        return fetchAwsConfigAndPerformOperation(function() {
          return awsS3Service.getAwsS3Instance().deleteObjects(params).promise();
        });
      },
      copyFiles: function(items) {
        var copyPromises = items.map(function(item) {
          return this.copy(item.sourceKey, item.destinationKey);
        }, this);
        return $q.all(copyPromises);
      },
    }  
  })
  .service('getFroalaConfig', function(apiGateWay, $q, DecryptionService, $rootScope, auth){
    $rootScope.cachedFroalaData = null;    
    let getData = function(){   
      let deferred = $q.defer(); 
      if ($rootScope.cachedFroalaData) {
        deferred.resolve($rootScope.cachedFroalaData);
        return deferred.promise
      }
      apiGateWay.get("/config?froala=true",  { companyId: auth.getSession().companyId }).then(function(response) {
          if (response.data.status == 200) {       
            var froalaConfig = {
              key: DecryptionService.decrypt(response.data.data.froala.activation_key, 'activation_key'),        
              height: 300,
              toolbarSticky: false,
              emoticonsUseImage: false,
              imageUploadRemoteUrls: false,  
              imageDefaultAlign: 'left',
              attribution: false, 
              imageUploadURL: apiGateWay.dataUrl + '/insert_image_to_AWS',    
              useClasses: false,          
              fontSize: ["8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "100"],               
              toolbarButtons: {
                  'moreText': {                    
                    'buttons': ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', 'textColor', 'backgroundColor']
                  },
                  'moreParagraph': {
                    'buttons': ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'formatOLSimple', 'formatOL', 'formatUL', 'paragraphFormat', 'paragraphStyle', 'lineHeight']
                  },
                  'customButtons': {
                    'buttons': ['insertLink', 'insertImage', 'insertVideo', 'emoticons', 'insertHR', 'insertTable', 'specialCharacters'],
                    'buttonsVisible': 7
                  },
                  'moreMisc': {
                    'buttons': ['undo', 'redo', 'fullscreen', 'print','html']
                  },
                  'customButtons2': {
                    'buttons': ['insert_email_variables']
                  }
              }
            }; 
            response.data.data.froala = froalaConfig;
            $rootScope.cachedFroalaData = froalaConfig;                       
            deferred.resolve(response.data.data.froala);
          } else {
             deferred.reject(response.data);
          }      
      }, function(error){
        return deferred.reject(error)
      })
      return deferred.promise
    }  
    return {
      get: getData
    }
  });
  