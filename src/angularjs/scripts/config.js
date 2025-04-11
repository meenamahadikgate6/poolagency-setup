// This file will run only on local server 
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
angular.module("POOLAGENCY").constant("configConstant", {  
  dev: {
    text: "Testing",
    webVersion: Date.now(),
    server: localStorage.getItem('pbApi') || "https://testapi.poolbrain.com",
    portalUrl: "https://test.poolbrain.com",
    socketServer: "https://testsapi.poolbrain.com",
    authorizeApiLoginId: "7FfaP2r5V",
    authorizeClientKey: "99kzR6YCX74Tkg2j3UuRzmV93y8Jd5682U6Vg8w6wU3YJm5vUrNEs8a2HqnhJFhK",
    googleAnalyticKey: "UA-97703495-1",
    quickBookClientId: "ABF1u0eoA5fQFzcvAXupthqiusEzAjjnSwAxg3Zec8XRp6E167",
    quickBookSecret: "irgY0u6Y44zLlqPLWyZoJLXNQY7ro2SCwoOky9nh",
    redirectUrl: "/quickbook-auth",
    INTERCOM_APPID: "ahzyswie",
    INTERCOM_USERID_SUFFIX: "00001",
    INTERCOM_COOKIE: "intercom-pb-session-localhost",
    INTERCOM_COOKIE_DOMAIN: "localhost",
    REPORT_SECTION: 1,
    isServiceSchedule: true,
    isPropertyInformation: true,
    isRoutingSection: true,
    awsKeyAccessCode: "P0O!BrN@2%26^9$u5%237t%I",
    awsAssetsPrefix: 'test/',
    awsAssetsPathQuotes: "quote_lineitem_assets/",
    awsAssetsPathProducts: "product_services_assets/",
    awsAssetsPathQuoteTemplates: "quote_template_assets/",
    awsAssetsPathInventoryTrucks: "inventory_truck_assets/",
    awsAssetsPathInventoryTools: "inventory_tools_assets/",
    awsAssetsPathInventoryLocation: "inventory_location_assets/",
    awsAssetsPathInventoryItems: "inventory_items_assets/",
    xApiKey: '2d1f05f134e341fb83a539a37aebeed0',
    nppCompanies: ['531', '564', '595', '598', '678', '695', '722', '811', '848', '928', '939'],
    poolbrainProdDomain: 'dashboard.poolbrain.com',
    nppProdDomain: 'npp.poolbrain.com',
    serverTitle: 'local',
    isDromoProduction: false,
    dromoCustomerImportChunkSize: 20,
    homeUrl: 'https://www.poolbrain.com',
    pbUserAgent: "G$8vX!pQz7@WmT2#dL9^KbYf",
  },
  currEnvironment: "dev"
}); 


angular.module('POOLAGENCY').service('config', function(configConstant) {
    /**
     * @ngdoc
     * @propertyOf POOLAGENCY.service:config
     * @name POOLAGENCY.service:config#environments
     * @description
     * A list of all the environments that can be accessed
     */

    var environments = this.environments = configConstant;
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
    var currEnvironment = configConstant.currEnvironment;
    var currentEnvironment = this.currentEnvironment = this.defaultEnvironment = configConstant[currEnvironment];
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
// This file will run only on local server 
