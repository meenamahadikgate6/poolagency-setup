angular.module('POOLAGENCY')

.controller('quickbookController', ['$scope','$rootScope', '$location', '$http', 'apiGateWay', 'config', 'auth', function($scope, $rootScope, $location, $http, apiGateWay, config, auth) {
  $rootScope.getQboAccounts();
  var timeIntervalRef = '';
  var environment = config.currentEnvironment;
  var currentLocation = $location.path();
  $scope.quickBookIntegration = function(){
    var cleantId = environment.quickBookClientId;
    var scope = "com.intuit.quickbooks.accounting openid email profile phone address";
    var response_type = "code";
    var state = "security_token"
    var portalUrl = environment.portalUrl;
    var redirect_uri = portalUrl+environment.redirectUrl;
    var queryString = "client_id="+cleantId+"&response_type="+response_type+"&state="+state+"&scope="+scope+"&redirect_uri="+redirect_uri;
    var authUrl = "https://appcenter.intuit.com/connect/oauth2?"+encodeURI(queryString)
    var windowInstance = window.open(authUrl, "", "top=200,left=200,width=500,height=600");
    if (typeof (windowInstance) != 'undefined' && !windowInstance.closed) {
      timeIntervalRef = setInterval(function(){
          checkAuthenticaton(windowInstance);
      }, 1000)
    }
  }

  var checkAuthenticaton = function(windowInstance){
    if(windowInstance){
      var code = getUrlParameter('code', windowInstance);
      var state = getUrlParameter('state', windowInstance);
      if(code){
        setTimeout(function(){
            getAccessToken(windowInstance, code);
        }, 1000);
        clearInterval(timeIntervalRef);
      }
    }
    if(windowInstance.closed){
      clearInterval(timeIntervalRef)
    }
  }

  var getUrlParameter = function(name, windowInstance) {
      name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
      var results = regex.exec(windowInstance.location.search);
      return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  $scope.isQuickBookConnected = false;
  var getAccessToken = function(windowInstance, code){
      $scope.isProcessing = true;
      windowInstance.close()
      apiGateWay.send('/company/quickbook_access_token', {code:code, referrer : currentLocation}).then(function(response){
        var message = response.data.message;
        $scope.isQuickBookConnected = true
        $scope.isQuickBookConnect = true
        if(response.data.status == 200){
            $scope.quick_book_success = message;
            $scope.isQuickBookConnected = true;
            $scope.isQuickBookConnect = true;
            $rootScope.qbConnectedNow = true;
            $scope.getCompanyPreferences();
            setTimeout(function(){
              $rootScope.getCrmStatus();
              $rootScope.getIncomeAccount();
            }, 1000); 
            if (!$scope.$$phase) $scope.$apply();
            
        }else{
            $scope.quick_book_error = message;
        }
        resetMessage();
      }, function(error){
        $scope.quick_book_error = error;
        resetMessage()
      })

  }

  $scope.setIncomeAccount = (id, accountType) => {
    $scope.isQbProcessing = true;
    $rootScope.settingPageLoaders.qboSection.incomeAccountUpdating = true;
    apiGateWay.send('/update_income_account', {"id":id, "accountType": accountType}).then(function(response){
        
      if(response.data.status == 200){
       $scope.isQbProcessing = false;
        angular.forEach( $rootScope.incomeAccountDetails.accountsDataForProduct, function(item){
          if(item.accountId == id){
              $rootScope.currentProductAccount = item.accountName;
          }
        })
      }else{
         
      }
      $rootScope.settingPageLoaders.qboSection.incomeAccountUpdating = false;
    }, function(error){
      $rootScope.settingPageLoaders.qboSection.incomeAccountUpdating = false;
      $scope.quick_book_error = error;
          resetMessage();
    })
  }
  
  
  $scope.setRefundAccount = (id, accountType) => {
    $scope.isQbProcessing = true;
    $rootScope.settingPageLoaders.qboSection.incomeAccountUpdating = true;
    apiGateWay.send('/update_income_account', {"id":id, "accountType": accountType}).then(function(response){
        
      if(response.data.status == 200){
       $scope.isQbProcessing = false;
        angular.forEach( $rootScope.incomeAccountDetails.accountsDataForRefund, function(item){
          if(item.accountId == id){
              $rootScope.currentRefundAccount = item.accountName;
          }
        })
      }else{
         
      }
      $rootScope.settingPageLoaders.qboSection.incomeAccountUpdating = false;
    }, function(error){
      $rootScope.settingPageLoaders.qboSection.incomeAccountUpdating = false;
      $scope.quick_book_error = error;
          resetMessage();
    })
  }
  
  var resetMessage = function(){
      setTimeout(function(){
        $scope.quick_book_success = false;
        $scope.quick_book_error = false;
      }, 2000);
      $scope.isProcessing = false;
  }
  $scope.companyPreferencesData = {
    AutoApplyCredit: null,
    AutoApplyPayments: null
  };
  $scope.companyPreferencesDataLoaded = 0;
  $scope.getCompanyPreferences = function() {
    $rootScope.settingPageLoaders.qboSection.companyPreferences = true;
    $scope.companyPreferencesDataLoaded = 0;
    apiGateWay.get('/company_preferences').then(function(response){
      if (response.data.status == "200") {
        let resData = response.data.data.DATA;
        if (resData && resData.AutoApplyCredit != null && resData.AutoApplyCredit != undefined) {
          $scope.companyPreferencesData.AutoApplyCredit = resData.AutoApplyCredit ? "ON" : "OFF";
          $scope.companyPreferencesDataLoaded++;
        }
        if (resData && resData.AutoApplyPayments != null && resData.AutoApplyPayments != undefined) {          
          $scope.companyPreferencesData.AutoApplyPayments = resData.AutoApplyPayments ? "ON" : "OFF";
          $scope.companyPreferencesDataLoaded++;
        }
      }
      $rootScope.settingPageLoaders.qboSection.companyPreferences = false;
    }, function(error){         
      $rootScope.settingPageLoaders.qboSection.companyPreferences = false;
    })
  };  
  $rootScope.getCompanyPreferencesGlobal = function() {
    $scope.getCompanyPreferences();
  }
  $scope.updateDefaultQboAccount = function(type, account) {
    $rootScope.settingPageLoaders.qboSection.defaultAccount = true;
    let accountId = account ? account.accountId : 0;
    let payload = {
      actionType: type,
      value: accountId
    };
    apiGateWay.send('/update_default_qbo_account', payload).then(function(response){
      if (response.data.status == "200") {
        $rootScope.defaultQboAccounts[type] = accountId;
        $scope.quick_book_success = 'Updated';
      } else {
        $scope.quick_book_error = response.data.message ? response.data.message : 'Something went wrong';
      }
      $rootScope.settingPageLoaders.qboSection.defaultAccount = false;
      resetMessage();
    }, function(error){         
      $scope.quick_book_error = typeof error == 'string' ? error : 'Something went wrong';
      $rootScope.settingPageLoaders.qboSection.defaultAccount = false;
      resetMessage();
    })
  }
}]);
