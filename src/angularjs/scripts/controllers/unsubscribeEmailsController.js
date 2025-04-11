angular.module('POOLAGENCY')
.controller('unsubscribeEmailsController', function($scope, $state, $timeout, apiGateWay) {  
    $scope.pageLoaded = false;
    $scope.invalidLink = false;
    $scope.isProcessing = false;
    $scope.unsubscribed = false; 
    $scope.unsubscribeData = null;
    $scope.unsubscribeEndpoint = '/unsubscribe_email';
    $scope.getEmailInfo = function(uid) {
        $scope.isProcessing = true;
        apiGateWay.get($scope.unsubscribeEndpoint, { token: uid}).then(function(response){ 
            if (response &&response.data && response.data.status == 200 && response.data.data) {
                $scope.unsubscribeData = response.data.data;
            } else {
                $scope.invalidLink = true;
            }                             
            $scope.isProcessing = false;
        }, function(error){
            $scope.invalidLink = true;
            $scope.isProcessing = false;
        })
    }
    let stateParams = $state.params;
    let uid = stateParams.uid ? stateParams.uid : '';
    if (uid != '') {
        $scope.pageLoaded = true;
        $scope.getEmailInfo(uid);
        document.documentElement.classList.add('unsubscribe-emails-page'); 
    } else {
        $state.go('login');
    }             
    $scope.submitUnsubscribeForm = function(unsubscribeForm) {
        if (!unsubscribeForm.$valid) {            
            return
        }        
        $scope.isProcessing = true;
        apiGateWay.send($scope.unsubscribeEndpoint, $scope.unsubscribeData).then(function(response){ 
            if (response.data.status == 200 || response.data.status == 205) {
                $scope.unsubscribed = true
            }                                 
            $scope.isProcessing = false;
        }, function(error){
            $scope.isProcessing = false;
        })
    }     
});