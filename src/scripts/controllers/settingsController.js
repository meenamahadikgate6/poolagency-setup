angular.module('POOLAGENCY').controller('settingsController', function($scope, $state, $rootScope, $filter, $sce, $http, apiGateWay, service, ngDialog,Analytics) {

    //to get chemical setting data
    $scope.getChemicalsSetting = function() {
        $scope.isProcessing = true;
        apiGateWay.get("/chemicals_setting").then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                    $scope.chemicalsData = response.data.data;
                } else {
                    $scope.chemicalsData = [];
                }
            }
            $scope.isProcessing = false;
        }, function(error) {
            var analyticsData = {};
                analyticsData.requestData = {

                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Get Checmical Setting', "Error on getChemicalsSetting - " + currentDateTime, analyticsDataString, 0, true);
        });
    };

    //to save chemical setting data
    $scope.addEditSetting = function() {
        if ($scope.settingForm.$valid) {
            $scope.isProcessing = true;
            apiGateWay.send("/chemicals_setting", {
                postData: $scope.chemicalsData
            }).then(function(response) {
                if (response.data.status == 201) {
                    $scope.success = response.data.message;
                    $scope.error = '';
                    setTimeout(function() {
                        $scope.success = '';
                    }, 2000);
                    var analyticsData = {};
                    analyticsData.userData = $rootScope.userSession;
                    analyticsData.data = $scope.chemicalsData;
                    analyticsData.actionTime = new Date();
                    var analyticsDataString = JSON.stringify(analyticsData);
                    var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                    $rootScope.storeAnalytics('Chemical Setting', "Update Checmical Setting - "+currentDateTime, analyticsDataString, 0, true);
                } else {
                    $scope.success = '';
                    $scope.error = response.data.message;
                    setTimeout(function() {
                        $scope.error = '';
                    }, 2000);
                }
                $scope.isProcessing = false;
            }, function(error) {
                var msg = 'Unable to update data.';
                if (typeof error == 'object' && error.data && error.data.message) {
                    msg = error.data.message;
                } else {
                    msg = error;
                }
                var analyticsData = {};
                analyticsData.requestData = {
                    postData: $scope.chemicalsData
                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = error;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                $rootScope.storeAnalytics('Error - Update Setting', "Error on addEditSetting - "+msg+" - " + currentDateTime, analyticsDataString, 0, true);
                $scope.success = '';
                $scope.error = msg;
                setTimeout(function() {
                    $scope.error = '';
                    $scope.isProcessing = false;
                }, 2000);
            });
        }
    };
});
