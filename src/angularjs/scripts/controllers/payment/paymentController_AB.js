angular.module('POOLAGENCY').controller('paymentController_AB', function($rootScope,$q, $scope, $state, $stateParams, apiGateWay, $filter, $window, ngDialog, $http, getPaymentConfig, commonService, configConstant, auth, config, pendingRequests, $timeout, $location, DecryptionService, DecryptionService) {
    $scope.abPayment = false;
    $scope.isAbErrors = [];	
    $scope.isAbSuccess = [];	
    $scope.initAbForm = function() {
		$scope.abFormData = {			
			expirationMonth: '',
			expirationYear: '',
		}
	}	
    $scope.initAbForm();
    $scope.flex = null;
    $scope.microform = null;
    $scope.initiateAB = function() {
        $scope.abGatewayInitiating = true;
        $scope.loadABSDK().then(() => { 
            $scope.isAbErrors = [];	
            apiGateWay.get("/payment_open_order", { 
				companyId : $scope.widgetData.companyId, 
				amount: $scope.widgetData.amount, 
				customerId: $scope.widgetData.userTokenId
			}).then(function(response) {
				if (response && response.data.data.sessionToken) {
					$scope.widgetData.captureContext = DecryptionService.decrypt(response.data.data.sessionToken);
                    console.log($scope.widgetData.captureContext)	
                    var form = document.querySelector('#abPaymentFormWrapper');
                    if (form) {
                        form.style.display = 'block';
                    }
                    var myStyles = {  
                        'input': {    
                            'font-size': '14px',    
                            'font-family': 'helvetica, tahoma, calibri, sans-serif',    
                            'color': '#555'  
                        },  
                        ':focus': { 'color': 'blue' },  
                        ':disabled': { 'cursor': 'not-allowed' },  
                        'valid': { 'color': '#3c763d' },  
                        'invalid': { 'color': '#a94442' }
                    };
                    $scope.flex = new Flex($scope.widgetData.captureContext);
                    $scope.microform = $scope.flex.microform({ styles: myStyles });
                    try {
                        var number = $scope.microform.createField('number', { placeholder: 'Enter card number' });
                        var securityCode = $scope.microform.createField('securityCode', { placeholder: '•••' });
                        console.log('here')
                        number.load('#number-container')
                        securityCode.load('#securityCode-container')
                    } catch (error) {
                        console.log('here')
                        $scope.isAbErrors.push('Something went wrong. Please try again.');  
                        $scope.abGatewayInitiating = false;
                        return;
                    }	
                } else {
                    $scope.isAbErrors.push('Something went wrong. Please try again.');                   
                }
                $scope.abGatewayInitiating = false;
                },
                function(error) {			
                    $scope.abGatewayInitiating = false;
                }
                );            
            })		
	}
    $scope.createJwToken = function() {
        $scope.isAbErrors = [];
        $scope.abGatewayInitiating = true; 
        var options = {    
            expirationMonth: $scope.abFormData.expirationMonth,  
            expirationYear: $scope.abFormData.expirationYear,
        };              
        $scope.microform.createToken(options, function (err, token) {                            
            if (err) {
                $scope.isAbErrors.push(err.message);
                $scope.abGatewayInitiating = false;
            } else {
                $scope.widgetData.jwt = JSON.stringify(token);
                $scope.makePayment();
            }
        });
    }
    $scope.makePayment = function() {
        $scope.isAbErrors = [];
        $scope.abGatewayInitiating = true; 
        let payload = {
            companyId : $scope.widgetData.companyId, 
            amount: $scope.widgetData.amount, 
            customerId: $scope.widgetData.userTokenId,
            transactionTyp: "Payment",            
            payment_method: $scope.widgetData.type,
            paymentToken: $scope.widgetData.jwt
        }
        if ($scope.widgetData.section == 'invoice_page') {
            payload.invoiceId = $scope.widgetData.prefix_transaction_id
        }
        if ($scope.widgetData.section == 'payment_listing_area') {
            payload.notes = $scope.widgetData.notes,
            payload.applyOnNextInvoice = $scope.widgetData.applyOnNextInvoice,
            payload.addressId = $scope.widgetData.prefix_transaction_id
        }
        apiGateWay.send("/take_payment_token", payload).then(function(response) {            
            if (response && response.data.status == 200) {
                if ($scope.widgetData.section == 'invoice_page') {
                    response.paymentMethod = $rootScope.paymentGateWayNames.ab;
                    $scope.root_takePayment_invoice_page(response);   
                }
                if ($scope.widgetData.section == 'payment_listing_area') {
                    response.paymentMethod = $rootScope.paymentGateWayNames.ab;
                    $scope.root_takePayment_payment_listing_area(response);   
                }
                $scope.closePaymentDialog();
                $scope.abGatewayInitiating = false;
            } else {
                $scope.abGatewayInitiating = false;
            }
        }, function(error){
            $scope.abGatewayInitiating = false;
        })
    }
	$scope.loadABSDK = function(type='') {
		let deferred = $q.defer();
        if ($scope.abPayment) {
            deferred.resolve();
        } else {
            let script = document.createElement("script");
            script.src = "https://testflex.cybersource.com/microform/bundle/v1/flex-microform.min.js";
            script.onload = function () {
                deferred.resolve();
            };
            script.onerror = function () {
                console.error("Failed to load "+type+" SDK");
                deferred.reject("Error loading "+type+" SDK");
            };
            document.body.appendChild(script);
        }
        return deferred.promise;
	}
    function getAbYears() {
		const currentYear = new Date().getFullYear();
		const years = [];
		for (let i = 0; i <= 16; i++) {
			years.push({
				val: currentYear + i,
				label: currentYear + i
			});
		}
		return years;
	}
	$scope.abYears = getAbYears();
    $scope.$on("$destroy", function () {
        var form = document.querySelector('#abPaymentFormWrapper');
        if (form) {
            form.style.display = 'none';
        }
		$scope.initAbForm();
        $scope.flex = null;
        $scope.microform = null;
		$scope.isAbErrors = [];	
        $scope.isAbSuccess = [];	
    });
})