'use strict';
/**
 * @ngdoc service
 * @name POOLAGENCY.service:config
 * @description
 *
 * Provides the main configuration interface and information for the app.
 *
 * Environment, in this context, means the server endpoint as well as endpoints behind the server that will be used (SAP, SQL db's, etc.)
 */
angular.module('POOLAGENCY').service('config', function() {
    /**
     * @ngdoc
     * @propertyOf POOLAGENCY.service:config
     * @name POOLAGENCY.service:config#environments
     * @description
     * A list of all the environments that can be accessed
     */
    var environments = this.environments = {
        prd: {
            text: 'Production',
            server: 'http://34.209.203.148:5000',
            socketServer: 'http://34.209.203.148:5000',
            serverKeyName: '',
            serverKey: '',
            serverTokenName: '',
            serverToken: '',
            authUrl: 'http://34.209.203.148:5000/login',
            googleAnalyticKey: 'UA-57524711-2'
        },
        staging: {
            text: 'Production',
            server: 'http://localhost:5000',
            serverKeyName: '',
            serverKey: '',
            serverTokenName: '',
            authUrl: 'http://34.209.203.148:5000/login',
            serverToken: ''
        },
        test: {
            text: 'Testing',
            server: 'https://poolagency.test.gate6.com:5001',
            socketServer: 'https://10.0.0.21:5001/',
            serverKeyName: '',
            serverKey: '',
            serverTokenName: '',
            serverToken: '',
            authUrl: 'https://poolagency.test.gate6.com:5001/login',
            googleAnalyticKey: 'UA-97703495-1'
        },
        dev: {
            text: 'Development',
            server: 'http://poolagency.dev.gate6.com:5000',
            socketServer: 'http://10.1.0.22:5000',
            serverKeyName: '',
            serverKey: '',
            serverTokenName: '',
            serverToken: '',
            authUrl: 'http://poolagency.dev.gate6.com:5000/login',
            googleAnalyticKey: 'UA-97703495-1'
        },
        localhost: {
            text: 'Localhost',
            server: 'http://poolagency.local.gate6.com:8080',
            socketServer: 'http://localhost:8080',
            serverKeyName: '',
            serverKey: '',
            serverTokenName: '',
            serverToken: '',
            authUrl: 'http://poolagency.local.gate6.com:8080/login',
            googleAnalyticKey: 'UA-97703495-1'
        },
        currEnvironment: 'localhost'
    };
    /**
     * @ngdoc
     * @propertyOf POOLAGENCY.service:config
     * @name POOLAGENCY.service:config#currentEnvironment
     * @description Gives access to the current environment for the app.
     */
    /**
     * @ngdoc
     * @propertyOf POOLAGENCY.service:config
     * @name POOLAGENCY.service:config#defaultEnvironment
     * @description Gives access to what the default environment was for this app version.
     */
    var currentEnvironment = this.currentEnvironment = this.defaultEnvironment = environments.localhost;
    // console.log("currentEnvironment",currentEnvironment);
    if (this.defaultEnvironment.text !== 'Production') {
        delete environments.prd;
    }
    /**
     * @ngdoc
     * @propertyOf POOLAGENCY.service:config
     * @name POOLAGENCY.service:config#version
     * @description Shows the current version number of the app.
     *
     * #This is automatically changed by the build script.
     */
    this.version = '0.0.1' //!!version!!
        /**
         * @ngdoc
         * @propertyOf POOLAGENCY.service:config
         * @name POOLAGENCY.service:config#writeLogData
         * @description log application activity only if it sets true.
         *
         * #set false in case of production.
         */
    this.writeLogData = false;
    /**
     * @ngdoc
     * @methodOf POOLAGENCY.service:config
     * @name POOLAGENCY.service:config#chooseEnvironment
     * @param {string} key The key of the environment to choose.
     * @description Allows the user to pick which environment they'd like to communicate with.
     */
    this.chooseEnvironment = function(name) {
        currentEnvironment = environments[name];
        return currentEnvironment;
    };
    this.setVerificationToken = function(token) {
        this.currentEnvironment.RequestVerificationToken = token;
        return this.currentEnvironment.RequestVerificationToken;
    };
});
/* Configuration Ends*/