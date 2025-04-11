angular.module('POOLAGENCY').controller('paymentController_Paya', function($rootScope,$q, $scope, $state, $stateParams, apiGateWay, $filter, $window, ngDialog, $http, getPaymentConfig, commonService, configConstant, auth, config, pendingRequests, $timeout, $location, DecryptionService, DecryptionService) {
	$scope.payaErrorMessage = '';	
    $scope.initiatePaya = function() {		
		$scope.isPayaGatewayInitiating = true;	
		apiGateWay.get("/get_current_time_stamp", {
			companyId : $scope.widgetData.companyId
		}).then(function(response) {
			if (response.status == 200) {						
				const timestamp = Number(response.data.data);						        									
				$scope.initiatePayaIframe(timestamp);
			} else {
				$scope.isPayaGatewayInitiating = false;
				console.error(response);
			}
		}, function(error) {
			$scope.isPayaGatewayInitiating = false;
			console.error(error);
		})
	}
	$scope.initiatePayaIframe = function(timeStamp) {
		const transaction_api_id = `${$scope.widgetData.prefix_transaction_id}_${timeStamp}`;		
		let amount = $scope.widgetData.amount;   
		let params = {
			"developer-id": $scope.paymentConfig['developer-id'],
			"hash-key": $scope.paymentConfig['user-hash-key'],
			"user-id": $scope.paymentConfig['user-id'],
			"timestamp": timeStamp,			
		};
		let commonParams = {
			"payment_method": $scope.widgetData.type,
			"location_id": $scope.paymentConfig['location-id'],
			"parent_send_message": 1,
			"display_close_button": false,
			"stylesheet_url": configConstant[$scope.selectedEvn].portalUrl + "/resources/styles/paya.style.css?ver=" + $rootScope.PB_WEB_VERSION,			
		}
		if ($scope.widgetData.type == "cc") {
			commonParams["show_street"] = 1;
			commonParams["show_zip"] = 1;
			commonParams["require_zip"] = 1;
			commonParams["require_street"] = 1;
		}
		if ($scope.widgetData.section == 'invoice_page' || $scope.widgetData.section == 'payment_listing_area') {			
			params.data = {
				"transaction": {
					"action": $scope.widgetData.type == "ach" ? "debit" : "sale",
					"transaction_amount": amount,
					"transaction_api_id": transaction_api_id,
					"show_cvv": "1",
					...commonParams,
				},
			};
			params.ver = Date.now();
			if (($scope.widgetData.type == "ach") && ($rootScope.isLocalServer || $rootScope.isTestServer || $rootScope.isUatServer || $rootScope.isPreprodServer)) {
				params.data.transaction.ach_sec_code = "WEB";
			}
		}
		if ($scope.widgetData.section == 'payment_profile_area') {
			params.data = {
				"accountvault": {
					"show_title":false,
					"account_vault_api_id": $scope.widgetData.userTokenId+'_'+timeStamp,
					"account_holder_name": $scope.getFullName(),
					...commonParams,
				},
			};
			params.ver = Date.now();
		}
		if ($scope.widgetData.section == 'invoice_page') {
			let saveInfo = {
				invoiceId: $scope.widgetData.prefix_transaction_id,
				companyId: $scope.widgetData.companyId,
				transactionId: transaction_api_id,
				transactionData: angular.copy(params)
			};
			apiGateWay.send("/logs_transaction_paya", saveInfo);
		}
		console.log(angular.copy(params))
		params['hash-key'] = CryptoJS.HmacSHA256(params['user-id'] + params['timestamp'], params['hash-key']);
		params['data'] = commonService.ASCToHex(JSON.stringify(params['data']));
		let formName = ''
		if ($scope.widgetData.section == 'invoice_page' || $scope.widgetData.section == 'payment_listing_area') {
			formName = 'payform'
		} else if ($scope.widgetData.section == 'payment_profile_area') {
			formName = 'accountform'
		}
		let url = $scope.paymentConfig['url'] + formName + "?";
		Object.keys(params).forEach(function(key) {
			url += key + '=' + params[key] + '&';
		});		
		$timeout(function() {
			document.getElementById('paymentPayaContainer').style.display = "block";
			let iframe = document.createElement('iframe');
			iframe.id = 'payaPayIframe';
			iframe.src = url;
			if ($scope.widgetData.type == 'cc') {
				iframe.height = 390;
			} else {
				iframe.height = 321;
			}
			iframe.setAttribute('class', 'paya-iframe paya-iframe-method-'+ $scope.widgetData.type + ' paya-iframe-section-'+$scope.widgetData.section);
			document.getElementById($scope.widgetData.type + 'IframeContainer').appendChild(iframe);
			setTimeout(function() {
				$scope.isPayaGatewayInitiating = false;
				if (!$scope.$$phase) $scope.$apply();
			}, 1000)
			window.addEventListener("message", $scope.makePayaPayment, false);
			$rootScope.isPayaMessageListenerAdded[$scope.widgetData.section] = true;			
		}, 250)
	}
	$scope.makePayaPayment = function(event) {
		if (!$rootScope.isPayaMessageListenerAdded[$scope.widgetData.section]) return;
		var transactionData = JSON.parse(event.data);
		var allowed = $scope.paymentConfig['url'].slice(0, -4);
		if (event.origin !== allowed || event.data.type == 'shortCuts') return;

		if ($scope.widgetData.section == 'invoice_page') {					
			$scope.payaErrorMessage = '';			
			if (transactionData && transactionData.message && transactionData.message.errors && transactionData.message.errors.transaction_api_id && transactionData.message.errors.transaction_api_id[0]) {
				return false
			}
			$scope.payaPopup.close();
			if (transactionData && transactionData.reason_code_id == 1000) {
				$rootScope.root_takePayment_invoice_page(transactionData);
			} else {
				$scope.payaErrorCode = transactionData.reason_code_id;
				$scope.payaErrorMessage = $rootScope.getPayaErrorMessageByReasonCode(transactionData.reason_code_id ? transactionData.reason_code_id : 0);
				if ($scope.payaErrorCode) {
					$scope.showPayaErrorPopup();
				}
			}
		}

		if ($scope.widgetData.section == 'payment_listing_area') {			
			$scope.payaPopup.close();
			if (transactionData.reason_code_id == 1000) {
				$rootScope.root_takePayment_payment_listing_area(transactionData);
			} else {
				$scope.payaErrorCode = transactionData.reason_code_id;
				$scope.payaErrorMessage = $rootScope.getPayaErrorMessageByReasonCode(transactionData.reason_code_id ? transactionData.reason_code_id : 0);
				if ($scope.payaErrorCode) {
					$scope.showPayaErrorPopup();
				}

			}
		}

		if ($scope.widgetData.section == 'payment_profile_area') {					
			transactionData.paymentGateway = $rootScope.paymentGateWayNames.paya;
			$timeout(function(){
				$rootScope.root_addPaymentProfile(transactionData);
			}, 1000)
		}
	}	
	$rootScope.getPayaErrorMessageByReasonCode = (code) => {
		code = Number(code)
		let message = '';
		let reasoneCodeData = [      
		  { code: 1000, shortDesc: "Accepted", longDesc: ""},
		  { code: 1001, shortDesc: "AuthCompleted", longDesc: ""},
		  { code: 1002, shortDesc: "Forced", longDesc: ""},
		  { code: 1003, shortDesc: "AuthOnly Declined", longDesc: ""},
		  { code: 1004, shortDesc: "Validation Failure (System Run Trx)", longDesc: ""},
		  { code: 1005, shortDesc: "Processor Response Invalid", longDesc: ""},
		  { code: 1200, shortDesc: "Voided", longDesc: ""},
		  { code: 1201, shortDesc: "Partial Approval", longDesc: ""},
		  { code: 1500, shortDesc: "Generic Decline", longDesc: ""},
		  { code: 1510, shortDesc: "Call", longDesc: ""},
		  { code: 1518, shortDesc: "Transaction Not Permitted - Terminal", longDesc: ""},
		  { code: 1520, shortDesc: "Pickup Card", longDesc: ""},
		  { code: 1530, shortDesc: "Retry Trx", longDesc: ""},
		  { code: 1531, shortDesc: "Communication Error", longDesc: ""},
		  { code: 1540, shortDesc: "Setup Issue, contact Support", longDesc: ""},
		  { code: 1541, shortDesc: "Device is not signature capable", longDesc: ""},
		  { code: 1588, shortDesc: "Data could not be de-tokenized", longDesc: ""},
		  { code: 1599, shortDesc: "Other Reason", longDesc: ""},
		  { code: 1601, shortDesc: "Generic Decline", longDesc: ""},
		  { code: 1602, shortDesc: "Call", longDesc: ""},
		  { code: 1603, shortDesc: "No Reply", longDesc: ""},
		  { code: 1604, shortDesc: "Pickup Card - No Fraud", longDesc: ""},
		  { code: 1605, shortDesc: "Pickup Card - Fraud", longDesc: ""},
		  { code: 1606, shortDesc: "Pickup Card - Lost", longDesc: ""},
		  { code: 1607, shortDesc: "Pickup Card - Stolen", longDesc: ""},
		  { code: 1608, shortDesc: "Account Error", longDesc: ""},
		  { code: 1609, shortDesc: "Already Reversed", longDesc: ""},
		  { code: 1610, shortDesc: "Bad PIN", longDesc: ""},
		  { code: 1611, shortDesc: "Cashback Exceeded", longDesc: ""},
		  { code: 1612, shortDesc: "Cashback Not Available", longDesc: ""},
		  { code: 1613, shortDesc: "CID Error", longDesc: ""},
		  { code: 1614, shortDesc: "Date Error", longDesc: ""},
		  { code: 1615, shortDesc: "Do Not Honor", longDesc: ""},
		  { code: 1616, shortDesc: "NSF", longDesc: ""},
		  { code: 1617, shortDesc: "Exceeded Withdrawal Limit", longDesc: ""},
		  { code: 1618, shortDesc: "Invalid Service Code", longDesc: ""},
		  { code: 1619, shortDesc: "Exceeded activity limit", longDesc: ""},
		  { code: 1620, shortDesc: "Violation", longDesc: ""},
		  { code: 1621, shortDesc: "Encryption Error", longDesc: ""},
		  { code: 1622, shortDesc: "Card Expired", longDesc: ""},
		  { code: 1623, shortDesc: "Renter", longDesc: ""},
		  { code: 1624, shortDesc: "Security Violation", longDesc: ""},
		  { code: 1625, shortDesc: "Card Not Permitted", longDesc: ""},
		  { code: 1626, shortDesc: "Trans Not Permitted", longDesc: ""},
		  { code: 1627, shortDesc: "System Error", longDesc: ""},
		  { code: 1628, shortDesc: "Bad Merchant ID", longDesc: ""},
		  { code: 1629, shortDesc: "Duplicate Batch (Already Closed)", longDesc: ""},
		  { code: 1630, shortDesc: "Batch Rejected", longDesc: ""},
		  { code: 1631, shortDesc: "Account Closed", longDesc: ""},
		  { code: 1650, shortDesc: "Contact Support", longDesc: ""},
		  { code: 1651, shortDesc: "Max Sending - Throttle Limit Hit (ACH only)", longDesc: ""},
		  { code: 1652, shortDesc: "Max Attempts Exceeded", longDesc: ""},
		  { code: 1653, shortDesc: "Contact Support", longDesc: ""},
		  { code: 1654, shortDesc: "Voided - Online Reversal Failed", longDesc: ""},
		  { code: 1655, shortDesc: "Decline (AVS Auto Reversal)", longDesc: ""},
		  { code: 1656, shortDesc: "Decline (CVV Auto Reversal)", longDesc: ""},
		  { code: 1657, shortDesc: "Decline (Partial Auth Auto Reversal)", longDesc: ""},
		  { code: 1658, shortDesc: "Expired Authorization", longDesc: ""},
		  { code: 1659, shortDesc: "Declined - Partial Approval not Supported", longDesc: ""},
		  { code: 1660, shortDesc: "Bank Account Error, please delete and re-add Account Vault", longDesc: ""},
		  { code: 1661, shortDesc: "Declined AuthIncrement", longDesc: ""},
		  { code: 1662, shortDesc: "Auto Reversal - Processor can't settle", longDesc: ""},
		  { code: 1663, shortDesc: "Manager Needed (Needs override transaction)", longDesc: ""},
		  { code: 1664, shortDesc: "Account Vault Not Found: Sharing Group Unavailable", longDesc: ""},
		  { code: 1665, shortDesc: "Contact Not Found: Sharing Group Unavailable", longDesc: ""},
		  { code: 1701, shortDesc: "Chip Reject", longDesc: ""},
		  { code: 1800, shortDesc: "Incorrect CVV", longDesc: ""},
		  { code: 1801, shortDesc: "Duplicate Transaction", longDesc: ""},
		  { code: 1802, shortDesc: "MID/TID Not Registered", longDesc: ""},
		  { code: 1803, shortDesc: "Stop Recurring", longDesc: ""},
		  { code: 1804, shortDesc: "No Transactions in Batch", longDesc: ""},
		  { code: 1805, shortDesc: "Batch Does Not Exist", longDesc: ""},
		  { code: 2101, shortDesc: "Insufficient funds", longDesc: "Available balance is not sufficient to cover the amount of the debit entry" },
		  { code: 2102, shortDesc: "Bank account closed", longDesc: "Previously active amount has been closed by the customer of RDFI" },
		  { code: 2103, shortDesc: "No bank account/unable to locate account", longDesc: "Account number does not correspond to the individual identified in the entry, or the account number designated is not an open account" },
		  { code: 2104, shortDesc: "Invalid bank account number", longDesc: "Account number structure is not valid" },
		  { code: 2105, shortDesc: "Reserved", longDesc: "Currently not in use" },
		  { code: 2106, shortDesc: "Returned per ODFI request", longDesc: "ODFI requested the RDFI to return the entry" },
		  { code: 2107, shortDesc: "Authorization revoked by customer", longDesc: "Receiver has revoked authorization" },
		  { code: 2108, shortDesc: "Payment stopped", longDesc: "Receiver of a recurring debit has stopped payment of an entry" },
		  { code: 2109, shortDesc: "Uncollected funds", longDesc: "Collected funds are not sufficient for payment of the debit entry" },
		  { code: 2110, shortDesc: "Customer advises not authorized", longDesc: "Receiver has advised RDFI that originator is not authorized to debit his bank account" },
		  { code: 2111, shortDesc: "Check truncation entry return", longDesc: "To be used when returning a check truncation entry" },
		  { code: 2112, shortDesc: "Branch sold to another RDFI", longDesc: "RDFI unable to post entry destined for a bank account maintained at a branch sold to another financial institution" },
		  { code: 2113, shortDesc: "RDFI not qualified to participate", longDesc: "Financial institution does not receive commercial ACH entries" },
		  { code: 2114, shortDesc: "Representative payee deceased or unable to continue in that capacity", longDesc: "The representative payee authorized to accept entries on behalf of a beneficiary is either deceased or unable to continue in that capacity" },
		  { code: 2115, shortDesc: "Beneficiary or bank account holder deceased", longDesc: "(Other than representative payee) deceased* - (1) the beneficiary entitled to payments is deceased or (2) the bank account holder other than a representative payee is deceased" },
		  { code: 2116, shortDesc: "Bank account frozen", longDesc: "Funds in bank account are unavailable due to action by RDFI or legal order" },
		  { code: 2117, shortDesc: "File record edit criteria", longDesc: "Entry with Invalid Account Number Initiated Under Questionable Circumstances" },
		  { code: 2118, shortDesc: "Improper effective entry date", longDesc: "Entries have been presented prior to the first available processing window for the effective date." },
		  { code: 2119, shortDesc: "Amount field error", longDesc: "Improper formatting of the amount field" },
		  { code: 2120, shortDesc: "Non-payment bank account", longDesc: "Entry destined for non-payment bank account defined by reg." },
		  { code: 2121, shortDesc: "Invalid company Identification", longDesc: "The company ID information not valid (normally CIE entries)" },
		  { code: 2122, shortDesc: "Invalid individual ID number", longDesc: "Individual id used by receiver is incorrect (CIE entries)" },
		  { code: 2123, shortDesc: "Credit entry refused by receiver", longDesc: "Receiver returned entry because minimum or exact amount not remitted, bank account is subject to litigation, or payment represents an overpayment, originator is not known to receiver or receiver has not authorized this credit entry to this bank account" },
		  { code: 2124, shortDesc: "Duplicate entry", longDesc: "RDFI has received a duplicate entry" },
		  { code: 2125, shortDesc: "Addenda error", longDesc: "Improper formatting of the addenda record information" },
		  { code: 2126, shortDesc: "Mandatory field error", longDesc: "Improper information in one of the mandatory fields" },
		  { code: 2127, shortDesc: "Trace number error", longDesc: "Original entry trace number is not valid for return entry; or addenda trace numbers do not correspond with entry detail record" },
		  { code: 2128, shortDesc: "Transit routing number check digit error", longDesc: "Check digit for the transit routing number is incorrect" },
		  { code: 2129, shortDesc: "Corporate customer advises not authorized", longDesc: "RDFI has been notified by corporate receiver that debit entry of originator is not authorized" },
		  { code: 2130, shortDesc: "RDFI not participant in check truncation program", longDesc: "Financial institution not participating in automated check safekeeping application" },
		  { code: 2131, shortDesc: "Permissible return entry (CCD and CTX only)", longDesc: "RDFI has been notified by the ODFI that it agrees to accept a CCD or CTX return entry" },
		  { code: 2132, shortDesc: "RDFI non-settlement", longDesc: "RDFI is not able to settle the entry" },
		  { code: 2133, shortDesc: "Return of XCK entry", longDesc: "RDFI determines at its sole discretion to return an XCK entry; an XCK return entry may be initiated by midnight of the sixtieth day following the settlement date if the XCK entry" },
		  { code: 2134, shortDesc: "Limited participation RDFI", longDesc: "RDFI participation has been limited by a federal or state supervisor" },
		  { code: 2135, shortDesc: "Return of improper debit entry", longDesc: "ACH debit not permitted for use with the CIE standard entry class code (except for reversals)" },
		  { code: 2136, shortDesc: "Return of Improper Credit Entry", longDesc: "" },
		  { code: 2137, shortDesc: "Source Document Presented for Payment", longDesc: "" },
		  { code: 2138, shortDesc: "Stop Payment on Source Document", longDesc: "" },
		  { code: 2139, shortDesc: "Improper Source Document", longDesc: "" },
		  { code: 2140, shortDesc: "Return of ENR Entry by Federal Government Agency", longDesc: "" },
		  { code: 2141, shortDesc: "Invalid Transaction Code", longDesc: "" },
		  { code: 2142, shortDesc: "Routing Number/Check Digit Error", longDesc: "" },
		  { code: 2143, shortDesc: "Invalid DFI Account Number", longDesc: "" },
		  { code: 2144, shortDesc: "Invalid Individual ID Number/Identification", longDesc: "" },
		  { code: 2145, shortDesc: "Invalid Individual Name/Company Name", longDesc: "" },
		  { code: 2146, shortDesc: "Invalid Representative Payee Indicator", longDesc: "" },
		  { code: 2147, shortDesc: "Duplicate Enrollment", longDesc: "" },
		  { code: 2150, shortDesc: "State Law Affecting RCK Acceptance", longDesc: "" },
		  { code: 2151, shortDesc: "Item is Ineligible, Notice Not Provided, etc.", longDesc: "" },
		  { code: 2152, shortDesc: "Stop Payment on Item (adjustment entries)", longDesc: "" },
		  { code: 2153, shortDesc: "Item and ACH Entry Presented for Payment", longDesc: "" },
		  { code: 2161, shortDesc: "Misrouted Return", longDesc: "" },
		  { code: 2162, shortDesc: "Incorrect Trace Number", longDesc: "" },
		  { code: 2163, shortDesc: "Incorrect Dollar Amount", longDesc: "" },
		  { code: 2164, shortDesc: "Incorrect Individual Identification", longDesc: "" },
		  { code: 2165, shortDesc: "Incorrect Transaction Code", longDesc: "" },
		  { code: 2166, shortDesc: "Incorrect Company Identification", longDesc: "" },
		  { code: 2167, shortDesc: "Duplicate Return", longDesc: "" },
		  { code: 2168, shortDesc: "Untimely Return", longDesc: "" },
		  { code: 2169, shortDesc: "Multiple Errors", longDesc: "" },
		  { code: 2170, shortDesc: "Permissible Return Entry Not Accepted", longDesc: "" },
		  { code: 2171, shortDesc: "Misrouted Dishonored Return", longDesc: "" },
		  { code: 2172, shortDesc: "Untimely Dishonored Return", longDesc: "" },
		  { code: 2173, shortDesc: "Timely Original Return", longDesc: "" },
		  { code: 2174, shortDesc: "Corrected Return", longDesc: "" },
		  { code: 2180, shortDesc: "Cross-Border Payment Coding Error", longDesc: "" },
		  { code: 2181, shortDesc: "Non-Participant in Cross-Border Program", longDesc: "" },
		  { code: 2182, shortDesc: "Invalid Foreign Receiving DFI Identification", longDesc: "" },
		  { code: 2183, shortDesc: "Foreign Receiving DFI Unable to Settle", longDesc: "" },      
		  { code: 2301, shortDesc: "Misc Check 21 Return", longDesc: "" },
		  { code: 2304, shortDesc: "Invalid Image", longDesc: "" },
		  { code: 2305, shortDesc: "Breach of Warranty", longDesc: "" },
		  { code: 2306, shortDesc: "Counterfeit / Forgery", longDesc: "" },
		  { code: 2307, shortDesc: "Refer to Maker", longDesc: "" },
		  { code: 2308, shortDesc: "Maximum Payment Attempts", longDesc: "" },
		  { code: 2309, shortDesc: "Item Cannot be Re-presented", longDesc: "" },
		  { code: 2310, shortDesc: "Not Our Item", longDesc: "" },
		  { code: 2321, shortDesc: "Pay None", longDesc: "" },
		  { code: 2322, shortDesc: "Pay All", longDesc: "" },
		  { code: 2323, shortDesc: "Non-Negotiable", longDesc: "" },
		  { code: 2329, shortDesc: "Stale Dated", longDesc: "" },
		  { code: 2345, shortDesc: "Misc Return", longDesc: "" },
		  { code: 2371, shortDesc: "RCK - 2nd Time", longDesc: "" },
		  { code: 2372, shortDesc: "RCK Reject - ACH", longDesc: "" },
		  { code: 2373, shortDesc: "RCK Reject - Payer", longDesc: "" },
		];
		if (code) {
			let msgIndex = reasoneCodeData.findIndex(x => x.code == code)
			if (msgIndex > -1) {
				let longDesc = reasoneCodeData[msgIndex].longDesc;
				let shortDesc = reasoneCodeData[msgIndex].shortDesc;
				if (longDesc != '') {
					message = longDesc
				} else if (shortDesc != '') {
					message = shortDesc 
				}            
			}
		}
		return message;
	}
    $scope.getFullName = function() {
		if (!$scope.widgetData || !$scope.widgetData.billingAddress) {
			return ''; 
		}		
		const fullName = $scope.widgetData.billingAddress.displayName?.trim() || '';				
		return fullName.length > 32 ? fullName.slice(0, 32) : fullName;
	};
	$scope.$on("$destroy", function () {
        if (document.getElementById('paymentPayaContainer')) {
			document.getElementById('paymentPayaContainer').style.display = "none";
		}
		window.removeEventListener("message", $scope.makePayaPayment);
		$rootScope.isPayaMessageListenerAdded = {
			payment_profile_area: false,
			payment_listing_area: false,
			invoice_page: false,
		}
		if (document.getElementById('payaPayIframe')) {
			document.getElementById('payaPayIframe').remove();
		}
    });			
	$scope.showPayaErrorPopup = function() {
		ngDialog.open({
			template: "payaErrorPopup.html",
			className: 'ngdialog-theme-default v-center',
			overlay: true,
			closeByNavigation: true,
			scope: $scope,
			preCloseCallback: function() {

			}
		});
	}	
})