angular.module('POOLAGENCY')

.controller('adminPayaController', function($rootScope, $scope, apiGateWay, ngDialog, service, $state, $stateParams,$timeout, $window, auth) {

  $scope.settingDataAvailable = false;
  $scope.payaData = {status:0};
  $scope.credSetting = {achPay: 0, credPay: 0, status: 0};
  
  //get Paya Setting
  $rootScope.getPayaSettings = function(){
    $scope.settingDataAvailable = false;
    $scope.isProcessing = true;
    $rootScope.settingPageLoaders.payaSection = true;
    apiGateWay.get("/company_paya_details").then(function(response) {
      if (response.data.status == 200) {
          if(response.data.data){  
            $scope.payaData = response.data.data;
            $scope.credSetting = {
              credPay: $scope.payaData.credPay,
              achPay: $scope.payaData.achPay,
              status: $scope.payaData.status
            };            
            if($scope.payaData.status==1){
              $scope.settingDataAvailable = true;
              $scope.settingDataAvailableFormOpen = true;
            } else {
              // $scope.credSetting.achPay = 0;
            }
          }
        }
        $scope.isProcessing = false;
        $rootScope.settingPageLoaders.payaSection = false;
    }, function(error){
      $scope.isProcessing = false;
      $rootScope.settingPageLoaders.payaSection = false;
    })
  }  

  $scope.updatePayaSettings = function(){
    $rootScope.cachedPaymentConfigData = {};
    let payaData = $scope.payaData;
    payaData.paymentGateway = $scope.payaData.paymentGateway;
    $rootScope.settingPageLoaders.payaSection = true;
    let url = '/company_paya_details';
    if (payaData.paymentGateway==$rootScope.paymentGateWayNames.nuvei || payaData.paymentGateway==$rootScope.paymentGateWayNames.ab) {
      url = '/company_payment_gateway_details_save';
      payaData.status = 1;
    }
    apiGateWay.send(url, payaData).then(function(response) { 
      if (response.data.status == 200) {
        $scope.settingDataAvailable = true;
        $scope.successPayaSetting = "Payments account is active. You are able to accept credit cards and ACH/Bank payments.";
        setTimeout(function(){
          $scope.successPayaSetting = '';
        }, 2000) 
      } else {
        $scope.errorPayaSetting = error;
        $scope.isProcessing = false;
      }  
      $rootScope.settingPageLoaders.payaSection = false;
    }, function(error) {          
      $scope.errorPayaSetting = error;
      $rootScope.settingPageLoaders.payaSection = false;
    });
    setTimeout(function(){
      $scope.errorPayaSetting = '';   
    }, 2000)  
  }

  $scope.settingDataAvailableFormOpen = false;
  $scope.openPayaSetting = function(){
    $scope.settingDataAvailableFormOpen = true;   
    $scope.payaData.paymentGateway = $rootScope.paymentGateWayNames.nuvei;
    let companyList = [];
    if ($rootScope.adminCompanyList && $rootScope.adminCompanyList.length > 0) {
      companyList = $rootScope.adminCompanyList;
    } else if ($rootScope.groupCompanyList && $rootScope.groupCompanyList.length > 0) {
      companyList = $rootScope.groupCompanyList;
    }
    let _companyInfo = companyList.find(x => x.companyId == auth.getSession().selectedCompany);   
    let _companyName = _companyInfo ? _companyInfo.companyName : '';
    if (_companyName && _companyName.startsWith('Aqua')) {
      $scope.payaData.paymentGateway = $rootScope.paymentGateWayNames.ab;
    }
  }  
  
  $scope.togglePaymentSetting = function(element) {
    if (element == "credit") {
      if ($scope.credSetting.credPay == 0) {
        $scope.credSetting.credPay = 1;
      } else {
        $scope.credSetting.credPay = 0;
      }
    }

    if (element == "ach") {
      if ($scope.credSetting.status == 0) {
        $scope.credSetting.achPay = 0;
        return;
      }
      if ($scope.credSetting.achPay == 0) {
        $scope.credSetting.achPay = 1;
      } else {
        $scope.credSetting.achPay = 0;
      }
    }
    $scope.updatePaymentSettings();
  }
  
  $scope.updatePaymentSettings = function(){
    $rootScope.settingPageLoaders.payaSection = true;
    apiGateWay.send('/cred_ach_pay_toggle', $scope.credSetting).then(function(response) { 
      if (response.data.status == 200) {
        $scope.credSetting = response.data.data;
      } else {
        $scope.errorPayaSetting = error;
        $scope.isProcessing = false;
      }  
      $rootScope.settingPageLoaders.payaSection = false;
    }, function(error) {          
      $scope.errorPayaSetting = error;
      $rootScope.settingPageLoaders.payaSection = false;
    });
    setTimeout(function(){
      $scope.errorPayaSetting = '';   
    }, 2000)  
  }

});
