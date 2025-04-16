'use strict';

/**
 *
 * @ngdoc service
 * @name Angular.provider:apiGateWay
 * @description Data provider to provide caching.
 */

angular.module('ngApiGateWay', ['ng'])
.provider('apiGateWay', function () {
  //Private objects
  var config = {};

  /**
   * @ngdoc
   * @methodOf Angular.provider:apiGateWay
   * @name Angular.provider:apiGateWay#setConfig
   * @description This allows you to set up at app startup whether certain `{string} endpoints` contain critical data that
   * should not be returned if invalid through the `{bool} returnExpiredData` key.
   */

  this.setConfig = function(environmentObj) {
        config = {currentEnvironment: environmentObj};
  };

  this.$get = function($rootScope, $http, $q, $log, $state, pendingRequests,config,auth,companyService) {

    var injector = angular.injector(['ng']);
    var $q = $q || injector.get('$q');

    var setToken = function(token){
      config.currentEnvironment.serverToken = token;
      return config.currentEnvironment.serverToken;
    };

    var getToken = function(){
      return config.currentEnvironment.serverToken;
    };

    //@private method to get server url
    var rootUrl = function() {

      return config.currentEnvironment.server + '/';

    };

    //@private method to get api server url
    var dataUrl = function () {
        // return config.currentEnvironment.server + '/api/';
        return config.currentEnvironment.server;
    };


     //Write log at server for error
      var logData = function(message, type){

        var now = new Date();
        var curr_date = now.getDate();
        var curr_month = now.getMonth();
        var curr_year = now.getFullYear();
        var curr_hour = now.getHours();
        var curr_mins = now.getMinutes();
        var curr_sec = now.getSeconds();
        type = type || 'debug';
        if (angular.isObject(message) || angular.isArray(message)) {
          message = JSON.stringify(message);
        }
        var messageWithDate = curr_date +'/'+ curr_month +'/'+curr_year +' '+ curr_hour +':'+ curr_mins +':'+ curr_sec +' : ' + message;

        if (config.writeLogData) {
            if (type == 'error') {
              $log.error(messageWithDate);
            }else if(type == 'warn'){
              $log.warn(messageWithDate);
            }else{
              $log.debug(messageWithDate);
            }
        }
    };

    //What to do for errors.
    var parseError = function(status, data, deferral) {
        let modErrors = [205, 206, 207, 208];
        if (data && data.data && data.data.message) {
            deferral.reject(data.data.message);
            return false;
        }
        if(status == -1){
          deferral.reject("There is an network issue. Please try later.");
        }else if(status === 0){
          deferral.reject("Please wait..");
        }else if(modErrors.includes(status)) {
          var msg = (data.message) ? data.message : 'Seems like API have some errors to solve. Please try later.';
          deferral.reject(msg);
          return false;
        }else if((Math.floor(Number(status) / 100) === 5)) {
          var msg = (data.message) ? data.message : 'Seems like API have some errors to solve. Please try later.';
          deferral.reject(msg);
          return false;
        } else if(status === 400) {
          deferral.reject('Something went wrong. Please try again.');
          return false;
        }else if(status === 401) {
          deferral.reject('Request failed. Please try again.');
          return false;
        }else if(status === 403) {
          deferral.reject('Either you are logged in with another device or your session has been expired.');
          return false;
        }else if(status === 404) {
          deferral.reject('Request failed. Please try again.');
          return false;
        }else if(status === 207) {
          deferral.reject('Request failed due to server unavailability. Please try again.');
          return false;
        }else {
          deferral.reject('Something went wrong. Please try again.');
          return false;
        }
    };

    /**
     * @ngdoc
     * @name Angular.provider:apiGateWay#sendData
     * @methodOf Angular.provider:apiGateWay
     * @private
     * @param {SendObject} sendObject Object to send. Should be constructed via SendObject.
     * @description Sends an object of type SendObject. Internal only.
     */

    function sendData (sendObject) {

      logData('Send Request - ' + JSON.stringify(sendObject));
      var deferred = sendObject.deferral;
      var endpoint = sendObject.endpoint;
      var headers = sendObject.options.headers || {};
      var verb;
      var sessionData = auth.getSession();
      var authToken = sessionData && sessionData.token ? sessionData.token : false;
      if(!authToken){
          authToken = auth.getStorage('authToken');
      }
      headers['Content-Type'] = 'application/json;charset=utf-8';
      headers['X-AUTH-TOKEN'] = authToken;
      headers["X-API-KEY"] = config.currentEnvironment.xApiKey;
      headers["requestCompanyId"] = 0;
      if (sessionData && sessionData.userId) {
        headers["userid"] = sessionData.userId;
      }
      if (sessionData && sessionData.canAccessMultiCompany && sessionData.userType != 'administrator') {
        headers["canAccessMultiCompany"] = true;
        headers["parentCompanyId"] = sessionData.parentCompanyId;
      }
      if (companyService.selectedCompany && companyService.selectedCompany != "0") {
        headers["requestCompanyId"] = companyService.selectedCompany;
      }
      let _webVersion = config.currentEnvironment.webVersion;
      headers["webVersion"] = _webVersion;
      if(sendObject.options.method) {
        verb = sendObject.options.method;
      } else if(sendObject.data._id) {
        verb = 'put';
        endpoint += '/' + sendObject.data._id;
      } else {
        verb = 'post';
      }

      var canceller = $q.defer();
       pendingRequests.add({
         url: endpoint,
         canceller: canceller
       });

      var sendConfig = {
        method : verb,
        url: endpoint,
        data: sendObject.data,
	      headers : headers,
        timeout: canceller.promise
      };


      $http(sendConfig).then(function(response) {
        pendingRequests.remove(endpoint);
        	//Data logging
          if (response.status=='success') {
              logData('Get Response - ' + JSON.stringify(response));
        	}else{
              logData('Error in Response - ' + JSON.stringify(response), 'warn');
        	}
      	deferred.resolve(response);

      },function(data, status, headers, httpConfig) {

          pendingRequests.remove(endpoint);

          if ((data.status==403 || data.status == 401)) {
              var showLogoutModal = endpoint.indexOf('logout') == -1 ? true : false;
              $rootScope.doLogoutBrowser(showLogoutModal);
          }
          parseError(status, data, deferred);
      });


      return deferred.promise;
    }


    /**
     * @ngdoc
     * @name Angular.provider:apiGateWay#sendData
     * @methodOf Angular.provider:apiGateWay
     * @private
     * @param {SendObject} sendObject Object to send. Should be constructed via SendObject.
     * @description Sends an object of type SendObject. Internal only.
     */

    function postData (sendObject) {

      logData('Send Request - ' + JSON.stringify(sendObject));
      var deferred = sendObject.deferral;
      var endpoint = sendObject.endpoint;
      var headers = sendObject.options.headers || {};
      var verb;

      var sessionData = auth.getSession();

      var authToken = sessionData && sessionData.token ? sessionData.token : '';
      //var authToken = 'SyOhGccxpmDZnSzG000qoRuL5Lf1GZ6SpXTtSSWvH6w3P73ZRXJoXjo2zQpRULy4';
      
      headers['Content-Type'] = undefined;
      headers['X-AUTH-TOKEN'] = authToken;
      headers["X-API-KEY"] = config.currentEnvironment.xApiKey;
      headers["requestCompanyId"] = 0;
      if (sessionData && sessionData.userId) {
        headers["userid"] = sessionData.userId;
      }
      if (sessionData && sessionData.canAccessMultiCompany && sessionData.userType != 'administrator') {
        headers["canAccessMultiCompany"] = true;
        headers["parentCompanyId"] = sessionData.parentCompanyId;
      }
      if (companyService.selectedCompany && companyService.selectedCompany != "0") {
        headers["requestCompanyId"] = companyService.selectedCompany;
      }
      let _webVersion = config.currentEnvironment.webVersion;
      headers["webVersion"] = _webVersion;
      if(sendObject.options.method) {
        verb = sendObject.options.method;
      } else if(sendObject.data._id) {
        verb = 'put';
        endpoint += '/' + sendObject.data._id;
      } else {
        verb = 'post';
      }

      var canceller = $q.defer();
       pendingRequests.add({
         url: endpoint,
         canceller: canceller
       });

      var sendConfig = {
        method : verb,
        url: endpoint,
        data: sendObject.data,
	      headers : headers,
        timeout: canceller.promise
      };

      sendConfig['transformRequest'] = angular.identity;

      $http(sendConfig).then(function(response) {
        pendingRequests.remove(endpoint);
        	//Data logging
          if (response.status=='success') {
              logData('Get Response - ' + JSON.stringify(response));
        	}else{
              logData('Error in Response - ' + JSON.stringify(response), 'warn');
        	}
      	deferred.resolve(response);

      },function(data, status, headers, httpConfig) {

          pendingRequests.remove(endpoint);

          if ((data.status==403 || data.status == 401)) {
              $rootScope.doLogoutBrowser(true);
          }
          parseError(status, data, deferred);
      });


      return deferred.promise;
    }


    /**
     * @ngdoc
     * @methodOf Angular.provider:apiGateWay
     * @name Angular.provider:apiGateWay#getData
     * @public
     * @param {string} key The key off the data to retrieve
     * @param {map} query A map of key-value pairs with which to filter data
     * @param {object} options The options for getting the data
     *
     * #Allowable options:
     *
     * @description
     *
     * Gets an optionally filtered dataset.
     *
     * @returns {Promise} $q promise
     */

    var getData = function getData(key, query, options) {
      logData('Get Data - Key :' + JSON.stringify(key) + ' Query : ' + JSON.stringify(query) + 'Options :' + JSON.stringify(options));
      var data;
      var authToken = auth.getStorage('authToken');

      var sessionData = auth.getSession();
      //var authToken = sessionData && sessionData.token ? sessionData.token : '';


      //var authToken = 'SyOhGccxpmDZnSzG000qoRuL5Lf1GZ6SpXTtSSWvH6w3P73ZRXJoXjo2zQpRULy4';
      options = options || {};
      var deferred = $q.defer();
      var promise = deferred.promise;
      var url = dataUrl() + key;
      var headers = options.headers || {};
      headers['X-AUTH-TOKEN'] = authToken;
      headers["X-API-KEY"] = config.currentEnvironment.xApiKey;      
      // PB useragent add
      let allowedEndpoints = ['/config'];      
      if (allowedEndpoints.includes(key.split('?')[0])) {
        headers["PB-UserAgent"] = config.currentEnvironment.pbUserAgent; 
      }
      // PB useragent add      
      headers["requestCompanyId"] = 0;
      if (sessionData && sessionData.userId) {
        headers["userid"] = sessionData.userId;
      }
      if (sessionData && sessionData.canAccessMultiCompany && sessionData.userType != 'administrator') {
        headers["canAccessMultiCompany"] = true;
        headers["parentCompanyId"] = sessionData.parentCompanyId;
      }
      if (companyService.selectedCompany && companyService.selectedCompany != "0") {
        headers["requestCompanyId"] = companyService.selectedCompany;
      }
      let _webVersion = config.currentEnvironment.webVersion;
      headers["webVersion"] = _webVersion;
      headers['Content-Type'] = 'application/json;charset=utf-8';


      var canceller = $q.defer();
        pendingRequests.add({
          url: url,
          canceller: canceller
        });

      var requestConfig = {
      	method: 'GET',
      	url: url,
      	headers : headers,
        timeout: canceller.promise
      };

      if(query) {
      	requestConfig.params = query;
      }

      $http(requestConfig).then(function(response) {

      pendingRequests.remove(url);
    	//Data logging
      	if (response.status == 'success') {
        	 logData('Get Response - ' + JSON.stringify(response));
      	}else{
        	 logData('Error in Response - ' + JSON.stringify(response), 'warn');
      	}
        deferred.resolve(response);


      },function(data, status, headers, httpConfig){

          pendingRequests.remove(url)
          if ((data.status==403 || data.status == 401)) {
              $rootScope.doLogoutBrowser(true);
          }
          parseError(status, data, deferred);
      });

      return promise;
    };

    function putData (sendObject) {
        logData('put Request - ' + JSON.stringify(sendObject));
        var deferred = sendObject.deferral;
        var endpoint = sendObject.endpoint;
        var headers = sendObject.options.headers || {};
        var verb;
        var sessionData = auth.getSession();
        var authToken = sessionData && sessionData.token ? sessionData.token : false;
        if(!authToken){
            authToken = auth.getStorage('authToken');
        }
        headers['Content-Type'] = 'application/json;charset=utf-8';
        headers['X-AUTH-TOKEN'] = authToken;
        headers["X-API-KEY"] = config.currentEnvironment.xApiKey;
        headers["requestCompanyId"] = 0;
        if (sessionData && sessionData.userId) {
          headers["userid"] = sessionData.userId;
        }
        if (sessionData && sessionData.canAccessMultiCompany && sessionData.userType != 'administrator') {
          headers["canAccessMultiCompany"] = true;
          headers["parentCompanyId"] = sessionData.parentCompanyId;
        }
        if (companyService.selectedCompany && companyService.selectedCompany != "0") {
          headers["requestCompanyId"] = companyService.selectedCompany;
        }
        let _webVersion = config.currentEnvironment.webVersion;
        headers["webVersion"] = _webVersion;
        if(sendObject.options.method) {
          verb = sendObject.options.method;
        } else if(sendObject.data._id) {
          verb = 'put';
          endpoint += '/' + sendObject.data._id;
        } else {
          verb = 'put';
        }
  
        var canceller = $q.defer();
         pendingRequests.add({
           url: endpoint,
           canceller: canceller
         });
  
        var sendConfig = {
          method : verb,
          url: endpoint,
          data: sendObject.data,
          headers : headers,
          timeout: canceller.promise
        };
  
  
        $http(sendConfig).then(function(response) {
          pendingRequests.remove(endpoint);
            //Data logging
            if (response.status=='success') {
                logData('Get Response - ' + JSON.stringify(response));
            }else{
                logData('Error in Response - ' + JSON.stringify(response), 'warn');
            }
          deferred.resolve(response);
  
        },function(data, status, headers, httpConfig) {
  
            pendingRequests.remove(endpoint);
  
            if ((data.status==403 || data.status == 401)) {
                var showLogoutModal = endpoint.indexOf('logout') == -1 ? true : false;
                $rootScope.doLogoutBrowser(showLogoutModal);
            }
            parseError(status, data, deferred);
        });
        return deferred.promise;
    }
    
    function deleteData (sendObject) {
        logData('delete Request - ' + JSON.stringify(sendObject));
        var deferred = sendObject.deferral;
        var endpoint = sendObject.endpoint;
        var headers = sendObject.options.headers || {};
        var verb;
        var sessionData = auth.getSession();
        var authToken = sessionData && sessionData.token ? sessionData.token : false;
        if(!authToken){
            authToken = auth.getStorage('authToken');
        }
        headers['Content-Type'] = 'application/json;charset=utf-8';
        headers['X-AUTH-TOKEN'] = authToken;
        headers["X-API-KEY"] = config.currentEnvironment.xApiKey;
        headers["requestCompanyId"] = 0;
        if (sessionData && sessionData.userId) {
          headers["userid"] = sessionData.userId;
        }
        if (sessionData && sessionData.canAccessMultiCompany && sessionData.userType != 'administrator') {
          headers["canAccessMultiCompany"] = true;
          headers["parentCompanyId"] = sessionData.parentCompanyId;
        }
        if (companyService.selectedCompany && companyService.selectedCompany != "0") {
          headers["requestCompanyId"] = companyService.selectedCompany;
        }
        let _webVersion = config.currentEnvironment.webVersion;
        headers["webVersion"] = _webVersion;
        if(sendObject.options.method) {
          verb = sendObject.options.method;
        } else {
          verb = 'delete';
        }
        var canceller = $q.defer();
        pendingRequests.add({
          url: endpoint,
          canceller: canceller
        });
        var sendConfig = {
          method : verb,
          url: endpoint,
          data: sendObject.data,
          headers : headers,
          timeout: canceller.promise
        };
        $http(sendConfig).then(function(response) {
          pendingRequests.remove(endpoint);
            //Data logging
            if (response.status=='success') {
                logData('Get Response - ' + JSON.stringify(response));
            }else{
                logData('Error in Response - ' + JSON.stringify(response), 'warn');
            }
          deferred.resolve(response);
        },function(data, status, headers, httpConfig) {
            pendingRequests.remove(endpoint);
            if ((data.status==403 || data.status == 401)) {
                var showLogoutModal = endpoint.indexOf('logout') == -1 ? true : false;
                $rootScope.doLogoutBrowser(showLogoutModal);
            }
            parseError(status, data, deferred);
        });
        return deferred.promise;
    }     

    var SendObject = function(endpoint, data, options) {
      logData('Send object prepared');
      this.deferral = $q.defer();
      this.endpoint = endpoint;
      this.name = endpoint.split('/').pop();
      this.data = data;
      this.options = options;
    };


    /**
     * @ngdoc
     * @name Angular.provider:apiGateWay#send
     * @methodOf Angular.provider:apiGateWay
     * @public
     * @param {string} endpoint The name of the table/collection to save the document under.
     * @param {object} data The data to send.
     * @param {options} options The optional options object.
     * @returns {$q.promise} The promise that will be resolved upon completion.
     *
     * @description Sends data to an endpoint
     */

    var send = function send(endpoint, data, options) {
      if(!endpoint) {
        throw 'Must use an endpoint to send.';
      }
      options = options || {};

      //Tag API Event
      try{
        Localytics.tagEvent(endpoint, data, 0);
      }catch(err){

      }

      //Handle the root option.
      endpoint = options.root ? rootUrl() + endpoint : dataUrl() + endpoint;

      var sendObject = new SendObject(endpoint, data, options);
      sendData(sendObject);
      return sendObject.deferral.promise;
    };

    var post = function post(endpoint, data, options) {
      if (!endpoint) {
        throw "Must use an endpoint to send.";
      }
      options = options || {};

      //Tag API Event
      try {
        Localytics.tagEvent(endpoint, data, 0);
      } catch (err) {

      }

      //Handle the root option.
      endpoint = options.root ? rootUrl() + endpoint : dataUrl() + endpoint;

      var sendObject = new SendObject(endpoint, data, options);
      postData(sendObject);
      return sendObject.deferral.promise;
    };
    
    var put = function put(endpoint, data, options) {
      if(!endpoint) {
        throw 'Must use an endpoint to send.';
      }
      options = options || {};

      //Tag API Event
      try{
        Localytics.tagEvent(endpoint, data, 0);
      }catch(err){

      }

      //Handle the root option.
      endpoint = options.root ? rootUrl() + endpoint : dataUrl() + endpoint;

      var sendObject = new SendObject(endpoint, data, options);
      putData(sendObject);
      return sendObject.deferral.promise;
    };
    
    var deleteItem = function deleteItem(endpoint, data, options) {
      if(!endpoint) {
        throw 'Must use an endpoint to send.';
      }
      options = options || {};
      // Tag API Event
      try {
        Localytics.tagEvent(endpoint, data, 0);
      } catch (err) {
      }
      // Handle the root option.
      endpoint = options.root ? rootUrl() + endpoint : dataUrl() + endpoint;
      var sendObject = new SendObject(endpoint, data, options);
      deleteData(sendObject);
      return sendObject.deferral.promise;
    };
    
    function payaAPI(endpoint, method, data, options) {
      let sendObject = {
        endpoint, 
        method, 
        data, 
        options
      }
      
      logData('Send Request - ' + JSON.stringify(sendObject));  
      let deferred = $q.defer();
      //let endpoint = sendObject.endpoint;
      let headers = {};
      
      headers['Content-Type'] = 'application/json';
      headers['user-id'] = options.headers['user-id'];
      headers['user-api-key'] = options.headers['user-api-key'];
      headers['developer-id'] = options.headers['developer-id'];

      var sendConfig = {
        method : sendObject.method,
        url: sendObject.endpoint,
        data: sendObject.data,
	      headers : headers
      };

      sendConfig['transformRequest'] = angular.identity;

      $http(sendConfig).then(function(response) {
        pendingRequests.remove(endpoint);
          if (response.status=='success') {
              logData('Get Response - ' + JSON.stringify(response));
        	}else{
              logData('Error in Response - ' + JSON.stringify(response), 'warn');
          }
      	deferred.resolve(response);
      },function(data, status, headers, httpConfig) {  
        deferred.reject(data);
      });
      return deferred.promise;
    };

    function thirdPartyAPI(endpoint, method, data, options) {
      let sendObject = {
        endpoint, 
        method, 
        data, 
        options
      }
      
      logData('Send Request - ' + JSON.stringify(sendObject));  
      let deferred = $q.defer();      
      let headers = {};      
      headers['Content-Type'] = 'application/json';
      
      var sendConfig = {
        method : sendObject.method,
        url: sendObject.endpoint,
        data: sendObject.data,
	      headers : headers
      };

      sendConfig['transformRequest'] = angular.identity;

      $http(sendConfig).then(function(response) {
        pendingRequests.remove(endpoint);
          if (response.status=='success') {
              logData('Get Response - ' + JSON.stringify(response));
        	}else{
              logData('Error in Response - ' + JSON.stringify(response), 'warn');
          }
      	deferred.resolve(response);
      },function(data, status, headers, httpConfig) {  
        deferred.reject(data);
      });
      return deferred.promise;
    };

    return {
      send: send,
      post:post,
      get: getData,
      put: put,
      delete: deleteItem,
      logData : logData,
      config: config,
      dataUrl : dataUrl(),
      rootUrl : rootUrl(),
      setToken : setToken,
      getToken : getToken,
      payaAPI : payaAPI,
      thirdPartyAPI : thirdPartyAPI

    };
  };
})

// This service keeps track of pending requests
.service('pendingRequests', function(configConstant) {
  var pending = [];

  this.get = function() {
    return pending;
  };
  this.add = function(request) {
    pending.push(request);
  };

  this.remove = function(request) {
    var deletePending = function (p){
      return p.url !== request;
    }

    if (pending.length > 0) {
      pending = pending.filter(deletePending);
    }
  };

  this.cancelAll = function() {
    let currEnvironment = configConstant.currEnvironment;
    let _domain = configConstant[currEnvironment].server;     
    let _skippedEndPoints = [ '/department_list', '/group_company_list', '/route_filter_template?getDefaultTemplate=true', '/administrator/logout', '/logout', '/administrator/company_list_superadmin', '/get_default_serviceLevel_data', '/company/crm_status', '/manage_add_schedule', '/job_alerts_filter?getDefaultTemplate=true'];
    let _skippedAPIs = [];
    angular.forEach(_skippedEndPoints, function(endpoint){
      _skippedAPIs.push(_domain + endpoint)
    })
    angular.forEach(pending, function(p) {
      if(!_skippedAPIs.includes(p.url)) {
        p.canceller.resolve();
      }
    });
    pending.length = 0;
  };
})
