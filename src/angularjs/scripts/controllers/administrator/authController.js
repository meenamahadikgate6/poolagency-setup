angular.module('POOLAGENCY')
.controller('plAdminAuthController', function($scope, $rootScope,companyService, $state, auth, apiGateWay, $cookies, $intercom, configConstant) {
    $scope.loginModel = {
        email: '',
        password: '',
        remember_me: false
    };
    try{
      var CookieData = auth.getStorage("adminLoginFormData");
      if (CookieData) {
          $scope.loginModel = JSON.parse(CookieData);
      }
    }catch(error){}

    $scope.isProcessing = false;
    $scope.success = '';
    $scope.error = '';
    let currEnvironment = configConstant.currEnvironment;
    //scope login function to perform super admin login
    $scope.doLogin = function() {
        if ($scope.loginForm.$valid) {
            $scope.isProcessing = true;
            auth.login($scope.loginModel, 'admin').then(function(response) {
                $rootScope.activeSocket();
                $scope.success = response.data.message;
                $scope.error = '';

                var userData = JSON.stringify(response.data.data);
                userId = response.data.data.id;
                $rootScope.selectedCompany = response.data.data.companyId;
                var chatUser = {
                  name: response.data.data.firstName,
                  email: response.data.data.email,  
                  user_id: $rootScope.getIntercomUserID(userId)
                }        
                $intercom.update(chatUser);
                if (auth.getSession()) {
                  if (auth.getSession().userType == "administrator") {
                    $rootScope.getCompanyList();
                  }
                  companyService.selectedCompany = $rootScope.selectedCompany = auth.getSession().selectedCompany;
                  $rootScope.preventDefaultAction = auth.getSession().companyId == auth.getSession().selectedCompany ? false : true;
                }
                $rootScope.getdefaultRouteFilterTemplate(true);                
                $rootScope.openAlertDashboard();
            }, function(error) {
                var msg = 'Unable to login.';
                if(error && error.data && error.data.message) {
                  msg = error.data.message;
                }
                $scope.isProcessing = false;
                $scope.success = '';
                $scope.error = msg;
                setTimeout(function() {
                    $scope.error = '';
                }, 2000);
            });
        }
    };

});
