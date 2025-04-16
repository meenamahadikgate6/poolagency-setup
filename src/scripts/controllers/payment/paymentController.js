angular.module('POOLAGENCY').controller('paymentController', function($rootScope,$q, $scope, $state, $stateParams, apiGateWay, $filter, $window, ngDialog, $http, getPaymentConfig, commonService, configConstant, auth, config, pendingRequests, $timeout, $location, DecryptionService, DecryptionService) {
	$rootScope.isPaymentControllerLoaded = true;
	$scope.widgetData = '';	 
	$rootScope.initiatePaymentFormEvent = function(data) {
		if (!$scope.isFromEventTriggered) {
			$scope.isFromEventTriggered = true;
			$scope.widgetData = data;
			$scope.initiatePaymentForm();
		}
	};
	$scope.initiatePaymentForm = function() {       
		getPaymentConfig.get($scope.widgetData.companyId).then(function(res) {
			$scope.paymentConfig = res;
			$scope.openPaymentPopup();			
		})
	}
	$scope.paymentGateways = [
		{ 
			name: $rootScope.paymentGateWayNames.paya, 
			template: 'templates/payment/payment_Paya.html?ver=' + $rootScope.PB_WEB_VERSION, 
		},
		{ 
			name: $rootScope.paymentGateWayNames.nuvei, 
			template: 'templates/payment/payment_Nuvei.html?ver=' + $rootScope.PB_WEB_VERSION,
		},
		{ 
			name: $rootScope.paymentGateWayNames.ab, 
			template: 'templates/payment/payment_AB.html?ver=' + $rootScope.PB_WEB_VERSION, 
		}
	];	
	$scope.openPaymentPopup = function() {
		$scope.payaPopup = ngDialog.open({
			id: 10,
			template: "paymentPopup.html",
			className: 'ngdialog-theme-default v-center' + ' ngdialog-theme-default-'+$scope.widgetData.section,
			overlay: $scope.widgetData.section != 'payment_profile_area',
			closeByNavigation: true,
			closeByDocument: false,
			scope: $scope,
			preCloseCallback: function() {
				$scope.isFromEventTriggered = false;
				if ($scope.widgetData.section == 'payment_profile_area') {
					$rootScope.isInitiatePaymentFormClosed_billing_tab();
				}				
			}
		});
	}
	$scope.closePaymentDialog = function() {
		$scope.payaPopup.close();
		if ($scope.widgetData.section == 'payment_profile_area') {
			ngDialog.closeAll()
		}
	}
	$scope.$on("$destroy", function () {
        $scope.isFromEventTriggered = false;
    });	
})