angular.module('POOLAGENCY')

.controller('invalidAddressListController', function($rootScope, $scope, apiGateWay, ngDialog, service, $state, $stateParams,$timeout, auth) {
    $scope.currentPage = 1;
    $scope.limit = 10;
    $scope.totalRecord = 0;
    $scope.totalPage = 0;
    $scope.customerList = [];
    $scope.getInvalidAddress = function() {
        $scope.isProcessing = true;
        $rootScope.settingPageLoaders.invalidAddress = true;
        apiGateWay.get("/invalid_addresses", {
            offset: $scope.currentPage - 1,
            limit: $scope.limit,
            customerNameORAddress: $scope.customerNameORAddress ? $scope.customerNameORAddress.replace('  ', ' ') : ''
        }).then(function(response) {
            if (response.data.status == 200) {
                
                var customerListResponse = response.data.data;
                $scope.totalRecord = response.data.data.rows;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.customerList = customerListResponse.data;
         
                
            } else {
                $scope.customerList = [];
            }
            $scope.isProcessing = false;
            $rootScope.settingPageLoaders.invalidAddress = false;
        });
    };
    $scope.parseCustomerName = function(customer) {
        var customerName = '';
        if (customer.lastName && !customer.firstName) {
            customerName = customer.lastName;
        }
        if (!customer.lastName && customer.firstName) {
            customerName = customer.firstName;
        }
        if (customer.lastName && customer.firstName) {
            customerName = customer.firstName + " " + customer.lastName;
        }
        if (customerName.length > 14) {
            customerName = customerName.substring(0, 14) + "...";
        }
        return customerName;
    };
    $scope.goToCustomerPage = function(page) {
        $scope.currentPage = page;
        $scope.getInvalidAddress();
    };
    $scope.getInvalidAddress();    
});
