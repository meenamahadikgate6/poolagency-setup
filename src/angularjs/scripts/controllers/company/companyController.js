angular.module('POOLAGENCY').controller('companyController', function($scope, $state, $rootScope, $filter, $sce, $http, apiGateWay, service, ngDialog, Analytics) {
    $scope.currentPage = 1;
    $scope.limit = 10;
    $scope.customerName = '';
    $scope.address = '';
    $scope.isProcessing = false;
    //function to get customer list
    $scope.getCustomerList = function() {
        $scope.isProcessing = true;
        apiGateWay.get("/customers", {
            offset: $scope.currentPage - 1,
            limit: $scope.limit,
            customerNameORAddress: $scope.customerNameORAddress
        }).then(function(response) {
            if (response.data.status == 200) {
                var customerListResponse = response.data.data;
                $scope.totalRecord = customerListResponse.rows;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.customerList = customerListResponse.data;
            } else {
                $scope.customerList = [];
            }
            $scope.isProcessing = false;
        });
    };

    //function to redirect to customer detail page
    $scope.goToDetail = function(addrId) {
        if (addrId) {
            ngDialog.close();
            $state.go("app.customerdetail", {
                addressId: addrId
            });
        }
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
        if (customerName.length > 16) {
            customerName = customerName.substring(0, 16) + "...";
        }
        return customerName;
    };
    $scope.getNumberToArray = function(num) {
        return new Array(num);
    };
    $scope.goToCustomerPage = function(page) {
        $scope.currentPage = page;
        $scope.getCustomerList();
    };
    $scope.showAddressList = function(addressList, selectedCustomerId) {
        ngDialog.open({
            template: 'addressList.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
                /* Do something here*/
                $scope.selectedCustomerId = 0;
                $scope.addressListOnModel = {};
            }
        });
        $scope.addressListOnModel = addressList;
        $scope.selectedCustomerId = selectedCustomerId;
    };
    $scope.doSearchCustomerList = function($event) {
        //if ($event.target.value || $scope.customerList.length ==0) {
        $scope.currentPage = 1;
        $scope.customerNameORAddress = $event.target.value.trim().replace(/,/g, "")
        var analyticsData = {};
        analyticsData.userData = $rootScope.userSession;
        analyticsData.data = {
            "search": $scope.customerNameORAddress
        };
        analyticsData.actionTime = new Date();
        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
        var analyticsDataString = JSON.stringify(analyticsData);
        $rootScope.storeAnalytics('Customers', "Customers - Search Customer - " + $scope.customerNameORAddress + " - " + currentDateTime, analyticsDataString, 0, true);
        $scope.getCustomerList();
        //}
    };

    



});
