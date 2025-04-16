angular.module('POOLAGENCY').controller('paymentController_Nuvei', function($rootScope,$q, $scope, $state, $stateParams, apiGateWay, $filter, $window, ngDialog, $http, getPaymentConfig, commonService, configConstant, auth, config, pendingRequests, $timeout, $location, DecryptionService, DecryptionService) {
	$scope.nuveiSession = {};  
	$scope.nuveiPaymentProcessing = false;
	$rootScope.nuveiInititateError = '';
	$scope.nuveiFormData = null;
	$scope.isNuveiSuccess = [];
	$scope.isNuveiErrors = [];
	$scope.initNuveiForm = function() {
		$scope.nuveiFormData = {
			cardHolderName: '',
			cardNumber: '',
			expirationMonth: '',
			expirationYear: '',
			AccountNumber: '',
			RoutingNumber: '',
			address: '',
			zip: ''			
		}
	}	
	$scope.initNuveiForm();
    $scope.initNuvei = function(data) {
		$scope.sfc = SafeCharge({
			merchantId: data.merchantId,
			merchantSiteId: data.merchantSiteId,
			env: 'int'
		});
	}
	$scope.initiateNuvei = function() {	
		$scope.nuveiGatewayInitiating = true;
		$scope.loadNuveiSDK().then(() => { 
			$scope.initNuvei($scope.paymentConfig);
			$scope.isNuveiErrors = [];				
			apiGateWay.get("/payment_open_order", { 
				companyId : $scope.widgetData.companyId, 
				amount: $scope.widgetData.amount, 
				customerId: $scope.widgetData.userTokenId
			}).then(function(response) {
				if (response && response.data.data.sessionToken) {
					$scope.widgetData.sessionToken = DecryptionService.decrypt(response.data.data.sessionToken);
					document.getElementById('paymentNuveiContainer').style.display = "block";
					if ($scope.widgetData.type == 'cc') {
						document.getElementById('nuvei_card_area').style.display = "block";
						if ($scope.widgetData.section == 'payment_profile_area') {
							$scope.nuveiFormData.cardHolderName = $scope.getFullName();
						}
					}
					if ($scope.widgetData.type == 'ach') {
						document.getElementById('nuvei_ach_area').style.display = "block";
						if ($scope.widgetData.section == 'payment_profile_area') {
							$scope.nuveiFormData.accountHolderName = $scope.getFullName();						
						}
					}
					$scope.nuveiGatewayInitiating = false;
				} else {
					$scope.isNuveiErrors.push(response.data.message);
					$scope.nuveiGatewayInitiating = false;
				}	
			},
			function(error) {
				$scope.isNuveiErrors.push(response.data.reason);					
				$scope.nuveiGatewayInitiating = false;
			}
			);
		})		
	}
	$scope.processNuveiPayment = function() {	
		let isProfile = $scope.widgetData.section == 'payment_profile_area';
		$scope.isNuveiErrors = [];		
		let paymentInfo = {
			sessionToken: $scope.widgetData.sessionToken,
		};	
		if (!isProfile) {
			paymentInfo.transaction_api_id = `${$scope.widgetData.prefix_transaction_id}_${$scope.getJSTimeStamp()}`;
			paymentInfo.userTokenId = $scope.widgetData.userTokenId;
		}	
		const setError = (message) => {
			$scope.isNuveiErrors.push(message);
			if (!$scope.$$phase) $scope.$apply();
			return false;
		};	
		paymentInfo.billingAddress = {
			email: $scope.widgetData.billingAddress.email || '',			
			country: $scope.paymentConfig.country,
		}
		if ($scope.widgetData.type === 'cc') {
			const cardHolderName = $scope.nuveiFormData.cardHolderName;
			const cardNumber = $scope.nuveiFormData.cardNumber;
			const expirationMonth = $scope.nuveiFormData.expirationMonth;
			const expirationYear = $scope.nuveiFormData.expirationYear;		
			const zip = $scope.nuveiFormData.zip;	
			const address = $scope.nuveiFormData.address;		
			let hasError = false;
			if (!cardHolderName) {
				setError('Account Holder Name cannot be blank');
				hasError = true;
			}
			if (!cardNumber) {
				setError('Account Number cannot be blank');
				hasError = true;
			}
			if (!expirationMonth) {
				setError('Expiration Month cannot be blank');
				hasError = true;
			}
			if (!expirationYear) {
				setError('Expiration Year cannot be blank');
				hasError = true;
			}
			if (!zip) {
				setError('Billing Zip Code cannot be blank');
				hasError = true;
			}	
			if (!address) {
				setError('Billing Street Address cannot be blank');
				hasError = true;
			}	
			if (hasError) return;
			if (isProfile) {
				paymentInfo = {
					...paymentInfo,
					cardHolderName,
					cardNumber,
					expMonth: expirationMonth,
					expYear: expirationYear,
				};
			} else {
				paymentInfo.paymentOption = {
					card: {
						cardHolderName,
						cardNumber,
						expirationMonth,
						expirationYear,
					}
				};				
			}		
			paymentInfo.billingAddress.address = $scope.nuveiFormData.address;
			paymentInfo.billingAddress.zip = $scope.nuveiFormData.zip;	
		} else if ($scope.widgetData.type === 'ach') {
			const AccountHolderName = $scope.nuveiFormData.accountHolderName;
			const AccountNumber = $scope.nuveiFormData.accountNumber;
			const RoutingNumber = $scope.nuveiFormData.routingNumber;				
			let hasError = false;
			if (!AccountHolderName) {
				setError('Account Holder Name cannot be blank');
				hasError = true;
			}
			if (!AccountNumber) {
				setError('Account Number cannot be blank');
				hasError = true;
			}
			if (!RoutingNumber) {
				setError('Routing Number cannot be blank');
				hasError = true;
			}
			if (hasError) return; 
			const paymentMethod = "apmgw_ACH";
			const SECCode = isProfile ? "CCD" : "WEB";	
			if (isProfile) {
				paymentInfo = {
					...paymentInfo,
					AccountHolderName,
					AccountNumber,
					RoutingNumber,
					paymentMethod,
					SECCode,
					paymentMethodName: 'apmgw_ACH'
				};
			} else {
				paymentInfo.paymentOption = {
					alternativePaymentMethod: {
						AccountHolderName,
						AccountNumber,
						RoutingNumber,
						paymentMethod,
						SECCode,
					}
				};
			}
		}	
		$scope.nuveiPaymentProcessing = true;
		const paymentMethods = {
			cc: $scope.sfc.addCardUpo,
			ach: $scope.sfc.addApmUpo
		};	
		if (isProfile) {
			const processProfile = paymentMethods[$scope.widgetData.type];
			if (processProfile) {
				processProfile(paymentInfo, function(res) {
					if (paymentInfo?.AccountNumber && $scope.widgetData.type == 'ach') {
						const accountNumber = String(paymentInfo.AccountNumber); 
    					res.last4Digits = accountNumber.slice(-4);
					}
					if (paymentInfo?.cardHolderName) {
						res.account_holder_name = paymentInfo.cardHolderName;
					} else if (paymentInfo?.AccountHolderName) {
						res.account_holder_name = paymentInfo.AccountHolderName;
					}
					if ($scope.widgetData.type == 'cc') {
						res.billing_address = paymentInfo.billingAddress.address || '';
						res.billing_zip = paymentInfo.billingAddress.zip || '';
					}
					$scope.handleCreateProfileResponse(res);
				});
			}
		} else {
			$scope.sfc.createPayment(paymentInfo, function(res) {
				$scope.handleCreatePaymentResponse(res);
			});
		}
	};	
	$scope.handleCreatePaymentResponse = function(res) {		
		const result = res.result || "";
		let isSuccess = ($scope.widgetData.type === "cc") ? (result === "APPROVED") : (result === "PENDING");		
		if (isSuccess) $scope.handleCreatePaymentSuccess(res);
		if (!isSuccess) $scope.showNuveiErrorMessage(res);
	}
	$scope.handleCreatePaymentSuccess = function(res) {
		$scope.payaPopup.close();
		$scope.nuveiPaymentProcessing = false;
		if (!$scope.$$phase) $scope.$apply();
		res.reason_code_id = 1000;
		if ($scope.widgetData.section == 'payment_listing_area') {
			res.paymentMethod = $rootScope.paymentGateWayNames.nuvei;
			$scope.root_takePayment_payment_listing_area(res);
		}
		if ($scope.widgetData.section == 'invoice_page') {
			$scope.root_takePayment_invoice_page(res);
		}
	}
	$scope.handleCreateProfileResponse = function(res) {
		const result = res.result || "";
		let isSuccess = false;
		let isFailed = false;		
		if (result === "ADDED" && res.userPaymentOptionId) {
			isSuccess = true;
		} else {			
			isFailed = true;
		}
		if (isSuccess) $scope.handleCreateProfileSuccess(res);
		if (isFailed) $scope.showNuveiErrorMessage(res);
	}	
	$scope.handleCreateProfileSuccess = function(res) {				
		$scope.nuveiPaymentProcessing = false;
		document.getElementById('paymentNuveiContainer').style.display = "none";		
		$scope.isNuveiSuccess.push('Account Vault successfully added');	
		$timeout(function(){
			$scope.payaPopup.close();
		}, 2000)			
		if (!$scope.$$phase) $scope.$apply();	
		$rootScope.root_addPaymentProfile({
			responseText: res,
			paymentGateway: $rootScope.paymentGateWayNames.nuvei, 
			paymentMethod: $scope.widgetData.type,			
		});
	}
    $scope.nuveiMonths = [
        { val: "01", label: "01 - January" },
		{ val: "02", label: "02 - February" },
		{ val: "03", label: "03 - March" },
		{ val: "04", label: "04 - April" },
		{ val: "05", label: "05 - May" },
		{ val: "06", label: "06 - June" },
		{ val: "07", label: "07 - July" },
		{ val: "08", label: "08 - August" },
		{ val: "09", label: "09 - September" },
		{ val: "10", label: "10 - October" },
		{ val: "11", label: "11 - November" },
		{ val: "12", label: "12 - December" }
	]
	function getNuveiyears() {
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
	$scope.nuveiYears = getNuveiyears();
    $scope.showNuveiErrorMessage = function(errorMsg) {
		$scope.isNuveiErrors.push(errorMsg.errorDescription || errorMsg.reason || 'Something went wrong. Please try again.');
		$scope.nuveiPaymentProcessing = false;	
		if (!$scope.$$phase) $scope.$apply();
		$timeout(function() {
			$scope.isNuveiErrors = []
		}, 2000);
	}
    $scope.getJSTimeStamp = function() {
		return Math.floor((Math.floor(Date.now()) - (1 * 60000)) / 1000)
	}
    $scope.getFullName = function() {
		if (!$scope.widgetData || !$scope.widgetData.billingAddress) {
			return ''; 
		}		
		const fullName = $scope.widgetData.billingAddress.displayName?.trim() || '';				
		return fullName.length > 32 ? fullName.slice(0, 32) : fullName;
	};
    $scope.loadNuveiSDK = function(type='') {
		let deferred = $q.defer();
        if ($scope.sfc) {
            deferred.resolve();
        } else {
            let script = document.createElement("script");
            script.src = "https://cdn.safecharge.com/safecharge_resources/v1/websdk/safecharge.js";
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
	$scope.$on("$destroy", function () {
        if (document.getElementById('paymentNuveiContainer')) {
			document.getElementById('paymentNuveiContainer').style.display = "none";
		}
		$scope.nuveiSession = {};
		$scope.initNuveiForm();
		$scope.isNuveiSuccess = [];
		$scope.isNuveiErrors = [];
    });	
})