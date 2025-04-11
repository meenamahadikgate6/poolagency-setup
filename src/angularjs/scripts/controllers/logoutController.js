angular.module('POOLAGENCY').controller('logoutController', function ($intercom, apiGateWay, auth, configConstant) {    
    document.documentElement.classList.add('hide-all-elements'); 
    var currEnvironment = configConstant.currEnvironment;            
    var chargebeeInstance = window.Chargebee.getInstance();
    chargebeeInstance.logout();    
    var userData = auth.getSession();
    var userRole = JSON.parse(JSON.stringify(auth.loggedInRole()));
    var logoutUrl = userRole == "administrator" ? "/administrator/logout" : "/logout";
    var userId = userData.id;
    apiGateWay
        .send(logoutUrl, {
            userId: userId
        })
        .then(function(response) {
        if (response.data.status == 200) {

        }
        });        
    auth.logout();
    $intercom.shutdown();    
    window.location.href = configConstant[currEnvironment].homeUrl;
});
