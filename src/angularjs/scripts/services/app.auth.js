'use strict';
/**
 *
 * @ngdoc service
 * @name Angular.provider:ngAuth
 * @description Auth service to provide all authentication related functionality.
 */
angular.module('ngAuth', ['ng']).provider('auth', function() {
    //Private objects
    var authUrl = '';
    var adminAuthUrl = '';
    var authHeaders = {};
    this.setAuthData = function(authData) {
        authUrl = authData.authUrl;
        adminAuthUrl = authData.adminAuthUrl;
        authHeaders = authData.headers ? authData.headers : {};
    }
    this.$get = ['$q', '$http', '$cookies', function($q, $http, $cookies) {

        /**
         * @ngdoc
         * @name Angular.provider:ngAuth#setStorage
         * @methodOf Angular.provider:ngAuth
         * @public
         * @param {key, value} key and value to set as storage.
         * @description Set storage of logged in user.
         */
        var setStorage = function(key, value) {
                if (angular.isObject(value)) {
                    value = JSON.stringify(value);
                }
                //localStorage.setItem(key, value);
                $cookies.remove(key);
                $cookies.remove(key, {domain: '34.209.203.148', path : '/admin'});
                $cookies.put(key, value);
            }
            /**
             * @ngdoc
             * @name Angular.provider:ngAuth#getStorage
             * @methodOf Angular.provider:ngAuth
             * @public
             * @param {key} key to get storage value.
             * @description get storage of logged in user.
             */
        var getStorage = function(key) {
                //var data = localStorage.getItem(key);
                var data = $cookies.get(key);
                if (data) {
                    data = angular.isObject(data)?JSON.parse(data):data;
                    return data;
                }
                return false;
            }
            /**
             * @ngdoc
             * @name Angular.provider:ngAuth#deleteStorage
             * @methodOf Angular.provider:ngAuth
             * @public
             * @param {key} key to remove storage value.
             * @description remove storage of logged in user.
             */
        var deleteStorage = function(key) {
            if (key) {
                //localStorage.removeItem(key);
                $cookies.remove(key);
                $cookies.remove(key, {path : '/admin'});
                var d = new Date(); //Create an date object
                d.setTime(d.getTime() - (1000*60*60*24)); //Set the time to the past. 1000 milliseonds = 1 second
                var expires = "expires=" + d.toGMTString(); //Compose the expirartion date
                window.document.cookie = key+"="+"; "+expires;//Set the cookie with name and the expiration date
            }
        };
            //Create a fresh or reintialized last created session.
        var session = (getStorage('session')) ? getStorage('session') : {};
        /**
         * @ngdoc
         * @name Angular.provider:ngAuth#setSession
         * @methodOf Angular.provider:ngAuth
         * @public
         * @param {userData} userData Object to set as session.
         * @description Set session of logged in user.
         */
        var setSession = function(userData) {
            session = {};
            if (userData) {
                session = userData;
                setStorage('session', JSON.stringify(session));
            }
            return session;
        };
        /**
         * @ngdoc
         * @name Angular.provider:ngAuth#getSession
         * @public
         * @methodOf Angular.provider:ngAuth
         * @description Return logged in user session.
         */
        var getSession = function() {
            session = (getStorage('session')) ? getStorage('session') : {};
            if (!angular.isObject(session) && session.length > 0) {
                session = JSON.parse(session)
                return session;
            } else {
                return session;
            }
        };
        /**
         * @ngdoc
         * @name Angular.provider:ngAuth#isAuthenticated
         * @public
         * @methodOf Angular.provider:ngAuth
         * @description Return logged status true or false.
         */
        var isAuthenticated = function() {
            return (getSession()) ? true : false;
        };
        /**
         * @ngdoc
         * @name Angular.provider:ngAuth#loggedInRole
         * @public
         * @methodOf Angular.provider:ngAuth
         * @description Return loggedIn user role(customer or hauler).
         */
        var loggedInRole = function() {
            var session = getSession();

            if(session.roles && session.roles[0] && session.roles[0].value){
                return session.roles[0].key;
            }else if(session.userType){
                return session.userType;
            }
            return false;
        };
        /**
         * @ngdoc
         * @name Angular.provider:ngAuth#loggedInRole
         * @public
         * @methodOf Angular.provider:ngAuth
         * @description Return loggedIn user role(customer or hauler).
         */
        var userId = function() {
            var session = getSession();
            return session.id;
        };
        /**
         * @ngdoc
         * @name Angular.provider:ngAuth#ssoToken
         * @public
         * @methodOf Angular.provider:ngAuth
         * @description Return ssoToken token.
         */
        var ssoToken = function() {
            var session = getSession();
            return session.ssoToken;
        };
        /**
         * @ngdoc
         * @name Angular.provider:ngAuth#destroySession
         * @public
         * @methodOf Angular.provider:ngAuth
         * @description Reset lodded in user session.
         */
        var destroySession = function() {
            session = {};
            deleteStorage('session');
            return session;
        };
        /**
         * @ngdoc
         * @name Angular.provider:ngAuth#setAuthUrl
         * @public
         * @methodOf Angular.provider:ngAuth
         * @description Reset lodded in user session.
         */
        var setAuthUrl = function(url) {
            authUrl = url;
        };
        /**
         * @ngdoc
         * @methodOf Angular.provider:ngAuth
         * @name Angular.provider:Auth#login
         * @public
         * @param {obj} credentials obj for login
         *
         * #Allowable options:
         *
         * @description
         *
         * Validate user on basis of eenterd credential and create a session of unique data, get from token server.
         *
         * @returns {Promise} $q promise
         */
        var login = function(dataObj, type) {
            type = type || 'company'
            var deferred = $q.defer();
            var promise = deferred.promise;

            var loginFormData = 'loginFormData';
            if(type == 'admin'){
                authUrl = adminAuthUrl;
                loginFormData = 'adminLoginFormData';
            }

            if (!authUrl) {
                return deferred.reject({
                    data: 'Please set auth url!'
                });
            }
            if (!dataObj) {
                return deferred.reject({
                    data: 'Please enter username & password'
                });
            }
            var sendConfig = {
                method: 'POST',
                url: authUrl,
                data: dataObj,
                headers: authHeaders
            };
            deleteStorage('authToken');
            deleteStorage('session');
            deleteStorage('storedMapDate');
            deleteStorage('defaultRouteFilterTemplateSession');
            deleteStorage('defaultAlertFilterTemplateSession');
            $http(sendConfig).then(function(response, status) {
                if (response.status === 200) {
                    var existingSession = getSession('session');
                    if(existingSession){
                        deleteStorage('authToken');
                        deleteStorage('session');
                        deleteStorage('storedMapDate');
                        deleteStorage('defaultRouteFilterTemplateSession');
                        deleteStorage('defaultAlertFilterTemplateSession');
                    }
                    var responseData = response.data.data;
                    responseData.selectedCompany = responseData.companyId;
                    if (responseData.canAccessMultiCompany && responseData.userType != 'administrator') {
                      responseData.parentCompanyId = responseData.companyId;
                    }
                    responseData.loggedInUserId = responseData.userId;
                    responseData.loggedInTime = Date.now();

                    setSession(responseData);

                    var token = response.headers("X-AUTH-TOKEN")
                    if(!token){
                        token = response.data.data.token
                    }
                    setStorage('authToken', token);
                    if (dataObj.remember_me == true) {
                        deleteStorage('loginFormData');
                        deleteStorage('adminLoginFormData');
                        setStorage(loginFormData, dataObj);
                    } else {
                        deleteStorage(loginFormData);
                    }
                }
                deferred.resolve(response);
            }, function(error) {
                deferred.reject(error);
            });
            return promise;
        };
        // @private Auto login user from last saved storage
        var autoLogin = function() {
            setSession(getSession('session'));
            return session;
        };
        // @private Check whther user is logged in or not
        var isAuthenticated = function() {
            var session = this.getSession();
            if (!angular.equals({}, session)) {
                return !!session;
            } else {
                return false;
            }
        };
        var logout = function() {
            session = {};
            deleteStorage('authToken');
            deleteStorage('session');
            deleteStorage('storedMapDate');
            deleteStorage('defaultRouteFilterTemplateSession');
            deleteStorage('defaultAlertFilterTemplateSession');
            return session;
        };
        return {
            userId: userId,
            getSession: getSession,
            setSession: setSession,
            setAuthUrl: setAuthUrl,
            destroySession:destroySession,
            ssoToken: ssoToken,
            loggedInRole: loggedInRole,
            isAuthenticated: isAuthenticated,
            login: login,
            logout: logout,
            getStorage:getStorage,
            setStorage:setStorage,
            deleteStorage:deleteStorage
        };
    }];
});
