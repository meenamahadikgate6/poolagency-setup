'use strict';
angular.module('POOLAGENCY')

.config(function($provide, AnalyticsProvider) {
    // /*
    //  *  catching application exceptions and error and send it on mail 
    //  **/
    // AnalyticsProvider.setAccount({
    //     tracker: 'UA-97703495-1',
    //     name: "tracker1",
    //     trackEvent: true,
    //     displayFeatures: true,
    //     enhancedLinkAttribution: true,
    //     trackEcommerce: true
    // }); //UU-XXXXXXX-X should be your tracking code.



    $provide.decorator('$exceptionHandler', function($delegate) {
        return function(exception, cause) {
            $delegate(exception, cause);
            var initInjector = angular.injector(['ng']);
            var analyticsDataString = exception.stack;
            var currentDateTime = new Date();
            AnalyticsProvider._trackEvent("Error Exception","Error Exception",analyticsDataString,1,true);
            // $rootScope.storeAnalytics('Login', 'A user login - ' + $scope.loginModel.email + ' - ' + currentDateTime, userData, response.data.data.id, true, customeDim);
        };
    });
    
});