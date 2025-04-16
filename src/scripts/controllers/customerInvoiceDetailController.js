angular.module('POOLAGENCY')

.controller('customerInvoiceDetailController', function($rootScope, $scope, $state, $stateParams, apiGateWay, $filter, $window, ngDialog, $http, getPaymentConfig, commonService, configConstant, auth, config, pendingRequests, $timeout, $location, DecryptionService) {
    //$rootScope, $scope,$window, Carousel, deviceDetector, $timeout, $filter, $sce, apiGateWay, service, $state, $stateParams, ngDialog, Analytics, configConstant, auth
    //https://www.checksnforms.com/ENV-1-Double-Window-Envelopes-p/env%201.htm?gclid=Cj0KCQiA9P__BRC0ARIsAEZ6irhfy3yEaz1q7b30QE1QkHLBy7GeNyz_7myyFoBHpYieezV68WzaYn8aAsYTEALw_wcB

    $scope.$window = $window;
    $scope.selectedEvn = configConstant.currEnvironment;
    $scope.payaConfig = {};
    $scope.addressId = $stateParams.addressId;
    if ($state.current.name == 'invoiceWithKey') {
        $scope.qID = $location.search().q;
        $scope.qID = decodeURIComponent($scope.qID);
        $scope.qID = $scope.qID.replaceAll(' ', '+');
        let qData = DecryptionService.decrypt($scope.qID);
        if (qData) {
            let splitData = qData.split('/');
            $scope.companyId = splitData[0];
            $scope.invoiceId = splitData[1];
        } else {
            console.error("Decryption failed or string is invalid");
        }
    } else {
        $scope.companyId = $stateParams.companyId ? $stateParams.companyId : (auth.getSession() ?auth.getSession().companyId : '');
        $scope.invoiceId = $stateParams.invoiceId? $stateParams.invoiceId : 0;
    }
    $scope.IsVisible = false;
    $scope.serviceAddressId = '';
    $scope.IsIndVisible = [];
    $scope.IsTextFieldVisible = [];
    $scope.IsBunddleVisible = [];
    $scope.lineUnitPrice = [];
    var a = [];
    $scope.IsBunddleVisible.push(a);
    $rootScope.invoiceDetails = {};
    $scope.customerDetails = {};
    $scope.sentOnData = [];
    $scope.errorProductFormQty = [];
    $scope.errorItemFormQty = [];
    $scope.errorItemFormQty.push(a);
    $scope.viewedOnData = [];
    $scope.paymentProfiles = [];
    $scope.date = new Date();
    $scope.showHideText = "show";
    $scope.noLineItem = false;
    $scope.model ={
        paymentMethod : '',
        notes: '',
        transaction_amount:''
    }
    $scope.companyTimeZone = '';
    $scope.sentEmailModel = {
        email:''
    };
    $scope.invoiceModel = {
        invoiceNotes:'',
       // discountTitle: '',
        //discountValue: ''
    }
    $scope.bundleSearchForm = false;
    $scope.isBundleSearch = false;
    $scope.isDeleting = false;
    $scope.productBundleList = {}; 
    $scope.productBundleListCategory = "";
    $scope.isProcessing = false;
    $scope.bundleList = [];
    $scope.bundleListNew = [];
    $scope.bundleSearchText = '';
    $scope.productEdit = false;
    $scope.bundleSearchListNew = '';
    $scope.productBundleListNew = [];
    $scope.productNoItem = false;
    $scope.isNoAuthPage = true;
    $scope.selectedPaymentMethod = '';
    $scope.customerTaxData = {"taxSettingArray":[],"taxDataPopup":false, "selectedTaxId":null, "selectedTaxAmount":0, "addTaxButton":true};
    $scope.customerDiscountData = {"discountDataShow":false, "discountDataUpdated":false, "discountAmount":0, "discountValue":0, "DiscountTitle":"", "dtype":"%","addDiscountButton":false, "errorMsg":""};
    $scope.invoiceNotFoundStatus = true;
    if($state.current.name !='invoice' && $state.current.name != 'invoiceWithKey'){
        $scope.isNoAuthPage = false;
        //$state.go("app.customerinvoicedetail",{ invoiceId: $scope.invoiceId}, {reload: false});
    }
    $scope.directPayment = false;
    $scope.payaErrorCode = "";


    $scope.saveOneTimeJob = false;
    $scope.isBundleSearch = false;
    $scope.bundleSearchForm = false;

    $scope.bundleSearchListNew = '';
    $scope.productBundleListNew = [];
    $scope.lineData = [];
    $scope.productNoItem = false;

    $scope.productBundleList = {}; 
    $scope.productBundleListCategory = "";
    $scope.bundleCost  = "";

    $scope.bundleTotal = 0;
    $scope.bundleSubTotal = 0;
    $scope.costBundleTotal = 0;
    $scope.bundleQtyText = "1";
    $scope.bundleCost  = "";
    $scope.bundleQtyPrice = "";
    $scope.qtyBundle = "";
    $scope.jobStatusIcon = '';
    $scope.addNote = '';
    $scope.invoiceType = 'OneOffJob';
    $scope.showAddProduct = true;
    $scope.showItemPrint = true;
    $scope.invoiceAuthCompany = auth.getSession().companyId;
    $scope.existPaymentValue = false;
    $rootScope.rs_existPaymentValue = false;
    $scope.emit = false;
    $scope.bundleItemTotal = [];
    $scope.defaultTaxSettingData = {};
    var hitCoints = 0;    
    $rootScope.datePickerOptionDueDate = {
        format: 'MM/DD/YYYY', 
        showClear: false, 
        // minDate: $rootScope.createdOn
    };
    $scope.pageObj =  {
        currentPageInv: 1,
        pageInv: '',
        limitInv: 10,
        totalRecordInv: '',
        totalPageInv: ''        
    }
    $scope.dirInv = 'desc';
    $scope.columnInv = 'createTime';    
    var lastAPIHit = true;
    $scope.cachedPrimaryAddressDetails = null;
    $scope.currentIndex = null;
    $scope.getInvoiceDetails = function(updateDiscount = false, inIt= false) {
        if ($rootScope.isNPPCompany()) {
            return
        }
        if(inIt){
            $scope.$on('child', function (event, data) {
            if(data.total > 0 && data.type == "top"){
                $scope.existPaymentValue = true;
                $rootScope.rs_existPaymentValue = true;
            }
            });
            $scope.isProcessing = true; 
            $scope.jobArray = [];
            $scope.jobArrayGroup = [];                
            let apiURL = '/invoice_details';  
            if($scope.isNoAuthPage){
                apiURL = '/public_invoice_details'; 
            }  
            apiGateWay.get(apiURL, {invoiceId:$scope.invoiceId, companyId:$scope.companyId}).then(function(response) {
                if (response.data.status == 200) {
                    if(!response.data.data.data){
                        $rootScope.title = '';
                        
                        $scope.invoiceNotFoundStatus = true;
                        $scope.invoiceNotFoundText = 'Invoice Not Found';                   
                        $scope.cachedPrimaryAddressDetails = null;
                    } else {                                              
                        if (response.data.data.data.primaryAddressDetails) {
                            $scope.cachedPrimaryAddressDetails = response.data.data.data.primaryAddressDetails;                            
                        }
                        $scope.parseInvoiceData(updateDiscount, inIt, response.data.data);
                    }                    
                } else {
                    $scope.invoiceDetails = {};
                    $scope.invoiceModel.invoiceNotes = '';                    
                    $scope.sentOnData = [];
                    $scope.viewedOnData = [];
                    $scope.cachedPrimaryAddressDetails = null;
                }
                $scope.isProcessing = false;            
                $scope.isTotalProcessing = false;            
            },function(error){
                $scope.isProcessing = false;
                $scope.isTotalProcessing = false;
            });
        } else {
            if (lastAPIHit) {
                lastAPIHit = false;
                $scope.existPaymentValue = false;
                $rootScope.rs_existPaymentValue = false;
                $scope.isProcessing = true; 
                $scope.jobArray = [];
                $scope.jobArrayGroup = [];                
                let apiURL = '/invoice_details';  
                if($scope.isNoAuthPage){
                    apiURL = '/public_invoice_details'; 
                }  
                hitCoints++;
                apiGateWay.get(apiURL, {invoiceId:$scope.invoiceId, companyId:$scope.companyId}).then(function(response) {
                    if (response.data.status == 200) {
                        if(!response.data.data.data){
                            $rootScope.title = '';                        
                            $scope.invoiceNotFoundStatus = true;
                            $scope.invoiceNotFoundText = 'Invoice Not Found';                   
                        } else {
                            $scope.parseInvoiceData(updateDiscount, inIt, response.data.data);
                            if($scope.successProductFormResponse){
                                $scope.successMsg = $scope.successProductFormResponse;  
                                setTimeout(function() {
                                    $scope.successMsg = '';  
                                }, 2000);
                            }                       
                        }
                    } else {
                        $scope.invoiceDetails = {};
                        $scope.invoiceModel.invoiceNotes = '';
                        $scope.sentOnData = [];
                        $scope.viewedOnData = [];
                    }
                    $scope.lineUnitPrice = [];
                    $scope.isProcessing = false;            
                    $scope.isTotalProcessing = false;  
                    lastAPIHit = true;
                    if ($rootScope.resDataTop) {                    
                        $scope.$broadcast('refreshTopDataStatus');                      
                    }
                },function(error){
                    $scope.isProcessing = false;
                    $scope.isTotalProcessing = false;
                });
            }
        }
    };
    $scope.invoiceParsed = false;
    $scope.parseInvoiceData = (updateDiscount, inIt, _data) => {
        $scope.invoiceParsed = true;
        $scope.isDueDatePickerVisible = false;
        if (inIt) {
            $scope.addressId = _data.data.details[0].addressId;
            $scope.changeStatus($scope.addressId);
        }
        $scope.invoiceNotFoundStatus = false;
        $scope.invoiceNotFoundText = '';                        
        if(!$scope.isNoAuthPage){
            $scope.getCompanySetting();
        } 
        if (inIt) {            
            if(_data.data.discountValue === null) {
                _data.data.discountValue = 0;
                _data.data.discountTitle = ""
            }
        }
        $scope.companyTimeZone = _data.companyTimeZone;
        $scope.moment = moment;
        $rootScope.invoiceDetails = _data.data; 
        $scope.invoiceDetails = _data.data; 
        if (_data.data.primaryAddressDetails) {
            $rootScope.invoiceDetails.primaryAddressDetails = _data.data.primaryAddressDetails;
            $scope.invoiceDetails.primaryAddressDetails = _data.data.primaryAddressDetails;
        } else if ($scope.cachedPrimaryAddressDetails) {
            $scope.invoiceDetails.primaryAddressDetails = angular.copy($scope.cachedPrimaryAddressDetails)
        }        
        $scope.selectedInvoiceDepartment = $rootScope.findDepartmentById($scope.invoiceDetails.departmentId); 
        $scope.invDueDate = $scope.invoiceDetails.dueDate;
        $scope.oldPayloadDueDate = moment($scope.invoiceDetails.dueDate).format('YYYY-MM-DD')
        // $rootScope.datePickerOptionDueDate.minDate = moment($rootScope.createdOn).format('MM/DD/YYYY');
        // $rootScope.datePickerOption.maxDate = moment($scope.invoiceDetails.dueDate).format('MM/DD/YYYY');
        $scope.noLineItem = $scope.invoiceDetails.details[0].lineData.length == 0 ? true : false;
        if (inIt) {
            $scope.defaultTaxSettingData = _data.data.defaultTaxSettingData;
        }
        $scope.invoiceModel.invoiceNotes = $scope.invoiceDetails.invoiceNotes;
        $scope.customerTaxData.selectedTaxValue = $scope.invoiceDetails.taxValue;
        $scope.customerTaxData.selectedTaxTitle = $scope.invoiceDetails.taxTitle;        
        $scope.customerDiscountData.discountAmount = $scope.invoiceDetails.discountValue;
        $scope.customerDiscountData.discountTitle = $scope.invoiceDetails.discountTitle;        
        if($scope.invoiceDetails.discountValue>0 || $scope.invoiceDetails.discountTitle){
            $scope.customerDiscountData.discountDataUpdated = true;
        } 
        if($scope.invoiceDetails.discountValue == 0 || $scope.invoiceDetails.discountTitle == ''){
            $scope.customerDiscountData.discountDataUpdated = false;
        }         
        if($scope.invoiceDetails.taxValue>0 || $scope.invoiceDetails.taxTitle){
            let valueFromTitle = $scope.customerTaxData.selectedTaxTitle.split("("); 
            valueFromTitle = valueFromTitle[valueFromTitle.length-1].split("%");
            if($scope.customerTaxData.selectedTaxAmount > 0){
                $scope.customerTaxData.selectedTaxAmount =  Number(valueFromTitle[0]);
            }
        }                        
        if($scope.invoiceDetails.discountTitle==""){
            $scope.customerDiscountData.addDiscountButton = true;
            $scope.customerTaxData.addTaxButton = true;
        }        
        if($scope.invoiceDetails.invoiceStatus == "Paid"){
            $scope.customerDiscountData.addDiscountButton = false;
            $scope.customerTaxData.addTaxButton = false;
        }
        if($scope.invoiceDetails.details && $scope.invoiceDetails.details.length > 0){
            angular.forEach($scope.invoiceDetails.details, function(detail, parentIndex){
                if(detail.serviceDetails && detail.serviceDetails.length > 0){
                    angular.forEach(detail.serviceDetails, function(item, index){                                   
                        $scope.invoiceDetails.details[parentIndex].serviceDetails[index].chemicalDetails = []
                        $scope.invoiceDetails.details[parentIndex].serviceDetails[index].chemicalDetails = $scope.chemicalReadingArray(item.jobDetails);                                                                      
                    })
                }
            })
            $scope.productServices = [];
            angular.forEach($scope.invoiceDetails.details[0].lineData, function(itemdetail, itemindex){
                if(itemdetail.qty==0 || !itemdetail.qty || itemdetail.qty=='') {
                    $scope.invoiceDetails.details[0].lineData[itemindex].qty = 0;
                }
                if(itemdetail.unitPrice==0 || !itemdetail.unitPrice || itemdetail.unitPrice=='') {
                    $scope.invoiceDetails.details[0].lineData[itemindex].unitPrice = $scope.invoiceDetails.details[0].lineData[itemindex].amount;
                }
                $scope.productServices.push(itemdetail.title);        
            })        
        }
        $scope.sentOnData = _data.sentOnData;
        $scope.viewedOnData = _data.viewedOnData;  
        try {
            $scope.sentEmailModel.email = $scope.invoiceDetails.length > 0 && invoiceDetails.billingDetails ? $scope.invoiceDetails.billingDetails.email : '';
        } catch (error) {
        }             
        let website = $scope.invoiceDetails.companyDetails.website;
        $scope.invoiceDetails.companyDetails.website = website && website.search("http:") == -1 && website.search("https:") == -1 ? 'http://'+website : website;                        
        if (inIt) {
            $rootScope.subTitle = '<div class="flex align-items-center">INVOICE #'+$rootScope.invoiceDetails.invoiceNumber+'</div>';  
            $rootScope.createdOn = $scope.invoiceDetails.qboTxnDate;
        }
        if(updateDiscount == true){
            $scope.discountValueChange();
            $scope.saveDiscount(false);
            $scope.taxSelected($scope.customerTaxData.selectedTaxId, false); 
        }
        // Check for toggle status to be taken from Invoice or customer
        if ($scope.invoiceDetails.isInvoiceServiceDatesHidden != null) {
            $scope.IsVisible = $scope.invoiceDetails.isInvoiceServiceDatesHidden ? false : true;
        } else {
            $scope.IsVisible = $scope.invoiceDetails.isServiceDatesHidden ? false : true;
        }
        $scope.showHideText = $scope.IsVisible ? "hide" : "show";
    }

    $scope.printInvoice = function(){
        $scope.showItemPrint = false;
        setTimeout(function(){
        $scope.$window.print();
        $scope.showItemPrint = true;
        },500);
    }
    $scope.emailInvoice = function(model){
        $scope.isProcessing = true;       
        apiGateWay.send("/send_invoice_email", {invoiceId:$scope.invoiceId, email:model.email}).then(function(response) {
            if (response.data.status == 200) {
                $scope.getInvoiceDetails()  
                $scope.successMsg = response.data.message;
                ngDialog.closeAll();
            } else {     
                $scope.isProcessing = false; 
                $scope.sentEmailError = response.data.message;
            }
            setTimeout(function() {
                $scope.sentEmailError = '';
                $scope.successMsg = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        },function(error){
            $scope.isProcessing = false;
            $scope.sentEmailError = error;
            setTimeout(function() {
                $scope.sentEmailError = '';
                $scope.successMsg = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 3000);
            //$scope.error = response.data.message;
        });
        
    }
     //Check PaymentType
     $scope.checkPaymentType = function(model){

        model.transaction_amount =  model.transaction_amount.toString();
        model.transaction_amount = model.transaction_amount.replace(/\$|,/g, ''); //masking reverse

        if(!model.paymentMethod || !model.transaction_amount || model.transaction_amount > $scope.invoiceDetails.balanceDue){
            let error = [];
            if(!model.paymentMethod) error.push('Please select payment method') 
            if(!model.transaction_amount) error.push('Entered amount should be greater than 0')
            if(model.transaction_amount > $scope.invoiceDetails.balanceDue) error.push('Entered amount should not greater than invoice total amount')
            
            
            $scope.paymentError = {error};

            setTimeout(function() {
                $scope.paymentError = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
            return false;
        } 
        if((model.paymentMethod == 'cc' || model.paymentMethod == 'ach') && !$scope.modeEdit){
           $scope.checkInvoicePaidStatus(model.paymentMethod)           
        } else {
            $scope.takePayment(model, '')
        }
    }
    $scope.gatewayTransIdCached = []
    $scope.checkDuplicateGatewayTransIdEntry = function(gatewayTransId) {
        let isDuplicate = false;
        if ($scope.gatewayTransIdCached.length == 0) {
            $scope.gatewayTransIdCached.push(gatewayTransId)
            isDuplicate = false;
        } else {
            if ($scope.gatewayTransIdCached.includes(gatewayTransId)) {
                isDuplicate = true;
            } else {
                $scope.gatewayTransIdCached.push(gatewayTransId)
                isDuplicate = false;
            }
        }
        return isDuplicate;
    }
    //Take Payment    
    $scope.isInvoicePaymentInProgress = false;   
    $scope.invoicePaymentMadeLastTime = 0;
    $rootScope.root_takePayment_invoice_page = function(data) {
        if (data.paymentMethod === $rootScope.paymentGateWayNames.ab) {
            $scope.getInvoiceDetails();
            ngDialog.closeAll(); 
            setTimeout(function() {
                $scope.$broadcast('refreshPaymentData');                        
            }, 500); 
        } else {
            $scope.takePayment($scope.model, data);
        }
    }
    $scope.takePayment = function(model, data){
        const now = Date.now();
        const timeSinceLastCall = now - $scope.invoicePaymentMadeLastTime;
        if (timeSinceLastCall < 2000) {
            console.error('Function called too soon... Function call aborting....');
            return
        }
        if ($scope.isInvoicePaymentInProgress) {
            console.error('Payment in progress... API call aborting....');
            return
        }
        $scope.payaErrorMessage = '';
        if(!model.paymentMethod){
            $scope.paymentError = {error:['Please select payment method']};
            setTimeout(function() {
                $scope.paymentError = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
            return false;
        }
        let postData = {
            "invoiceId":$scope.invoiceId,
            "action":"sale",
            "description": model.notes,
            "transaction_amount": data.transaction_amount ? data.transaction_amount : model.transaction_amount
        };
        let obj = [];
        if(model.paymentMethod && ['cash', 'check', 'cc', 'ach'].indexOf(model.paymentMethod) == -1 ){
            obj = $scope.paymentProfiles.filter(function(item){           
                return item.id == model.paymentMethod;
            })
        }        
        postData.account_profile_id = obj.length > 0 ? obj[0].id : '';      
        postData.payment_method = obj.length > 0 ? obj[0].paymentMethod : model.paymentMethod;   
          
        if(model.paymentMethod && ['cc', 'ach'].indexOf(model.paymentMethod) > -1 ){
            postData.responseCode = 201
            postData.responseText = data
            postData.gatewayTransId = data.id || data.transactionId
        }
        if(model.paymentMethod == 'check'){
            postData.checkNumber = model.checkNumber;
        }
      

        $scope.removePaymentInputErrorClass = () => {
            var transactionAmountInput = document.getElementById('transaction_amount');
            if (transactionAmountInput) {
                transactionAmountInput.classList.remove('has-error')
            }
        }

       

        if (postData.transaction_amount == '0' || postData.transaction_amount == 0) {
            var transactionAmountInput = document.getElementById('transaction_amount');
            if (transactionAmountInput) {
                transactionAmountInput.classList.add('has-error');
                transactionAmountInput.focus();
                $scope.paymentError = {error:['Entered amount should be greater than 0']};
                setTimeout(function() {
                    $scope.paymentError = '';
                }, 2000);
            }
            return
        }
        $scope.isProcessing = true; 
        $scope.paymentError = false;    
        let apiURL = '/invoice_take_payment';  
        if($scope.isNoAuthPage){
            apiURL = '/public_invoice_take_payment'; 
            postData.companyId = $scope.companyId;
            postData.responseCode = 200;
        }  
        if ((postData.gatewayTransId != undefined && postData.gatewayTransId != null) && $scope.checkDuplicateGatewayTransIdEntry(postData.gatewayTransId)) {
            console.error('Duplicate payment... API call aborting....')
            return
        }  
        $scope.isInvoicePaymentInProgress = true;
        $scope.invoicePaymentMadeLastTime = now;
        apiGateWay.send(apiURL,  postData).then(function(response) {
            if (response.data.status == 200) {
                if(response.data.data && !response.data.data.Error){
                    $scope.transactionId = response.data.data.transactionId ? response.data.data.transactionId : response.data.data.gatewayTransId;
                    $scope.getInvoiceDetails();  
                    //$scope.paymentSuccess = true;
                    ngDialog.closeAll(); 
                    setTimeout(function() {
                        $scope.$broadcast('refreshPaymentData');                        
                    }, 500); 
                } else {
                    //apiGateWay.logData('Get Response - ' + JSON.stringify(response));
                    if(response.data.data && response.data.data.Error){
                       // $scope.paymentError = response.data.data.Error;
                       $scope.payaErrorCode = response.data.data.reason_code_id;
                       $scope.payaErrorMessage = $rootScope.getPayaErrorMessageByReasonCode(response.data.data.reason_code_id ? response.data.data.reason_code_id : 0);
                       $scope.showPayaErrorPopup();
                    } else {
                        let _msg = response.data.message ? response.data.message : 'Something went wrong, please try again.';
                        $scope.paymentError = {error:[_msg]};
                    }                    
                }  
                $scope.isProcessing = false;  
                setTimeout(function() {
                    $scope.isInvoicePaymentInProgress = false;
                    $scope.paymentError = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 2000);             
            } else {  
                //apiGateWay.logData('Get Response - ' + JSON.stringify(response));   
                $scope.isProcessing = false; 
                $scope.paymentError = {error:[response.data.message]};
                setTimeout(function() {
                    $scope.isInvoicePaymentInProgress = false;
                    $scope.paymentError = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 2000);
            }           
        },function(error){
            //apiGateWay.logData('Get Response - ' + JSON.stringify(error));
            $scope.isProcessing = false;
            if(typeof error === 'object' && error.Error){ 
                $scope.paymentError = error.Error;
            } else {
                $scope.paymentError = {error:[error]};
            }
            setTimeout(function() {
                $scope.paymentError = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);                      
        });
              
    }
    //get Paya Setting
    $rootScope.getPayaSettings = function(){
        $scope.settingDataAvailable = false;
        apiGateWay.get("/company_paya_details").then(function(response) {
        if (response.data.status == 200) {
            if(response.data.data){  
                $scope.payaData = response.data.data;
                $scope.payaStatus = $scope.payaData.status;
            }
            }
            $scope.isProcessing = false;
        }, function(error){
        $scope.isProcessing = false;
        })
    }  
    $scope.jobArray = [];
    $scope.jobArrayGroup = [];
    $scope.uniqueDate = function(job){
        if(job.groupId) {
            jobDate = $filter('mysqlTojsDate')(job.jobDate)
            jobDate = $filter('date')(jobDate, 'MM/dd/yyyy')
            $scope.jobArrayGroup.push({jobDate, groupId: job.groupId})
            //$scope.jobArrayGroup = _.uniqBy($scope.jobArrayGroup, 'jobDate');
            $scope.jobArrayGroup = _.uniqBy($scope.jobArrayGroup, 'groupId');
            $scope.jobArrayGroup = _.sortBy($scope.jobArrayGroup, 'jobDate');
            $scope.jobArray = $scope.jobArrayGroup.map(o => {return o.jobDate});
        } else {
            jobDate = $filter('mysqlTojsDate')(job.jobDate)
            jobDate = $filter('date')(jobDate, 'MM/dd/yyyy')
            $scope.jobArray.push(jobDate);
            $scope.jobArray = _.uniqBy($scope.jobArray);
            $scope.jobArray = _.sortBy($scope.jobArray);
        }
    }
    $scope.invoices = [];
    $scope.jobArrayObj = {};
    $scope.uniqueDatePrint = function(job,details){
        if (details) {
            jobDate = $filter('mysqlTojsDate')(job.jobDate)
            jobDate = $filter('date')(jobDate, 'MM/dd/yyyy')
            $scope.invoices.push({
                date: jobDate,
                invoiceNo: details.invoiceNumber,
            });
            $scope.jobArrayObj = $scope.getUniqueDates($scope.invoices);
        }
    }
    $scope.getUniqueDates = (invoices) => {
        const uniqueDatesMap = {};    
        invoices.forEach((invoice) => {
            const { invoiceNo, date } = invoice;
    
            // Check if the invoiceNo is already in the map
            if (uniqueDatesMap.hasOwnProperty(invoiceNo)) {
                // Add the date to the existing array if not already present
                if (!uniqueDatesMap[invoiceNo].includes(date)) {
                    uniqueDatesMap[invoiceNo].push(date);
                }
            } else {
                // Create a new array for the invoiceNo if not present in the map
                uniqueDatesMap[invoiceNo] = [date];
            }
        });    
        return uniqueDatesMap;
    }
    $rootScope.getPayaSettingsNonAuth = function(){
        apiGateWay.get("/company_paya_details_noauth", {companyId:$scope.companyId}).then(function(response) {
        if (response.data.status == 200) {
            if(response.data.data){  
                $scope.payaData = response.data.data;
                $scope.payaStatus = $scope.payaData.status;
            }
            }
            $scope.isProcessing = false;
        }, function(error){
        $scope.isProcessing = false;
        })
    }  
    //Generate PDF
    $scope.generatePdf = function(){
        $scope.isProcessing = true;    
        //public_invoice_pdf?companyId=122&invoiceId=25
        $scope.isProcessing = true;   
        let apiURL = '/invoice_pdf';  
        if($scope.isNoAuthPage){
            apiURL = '/public_invoice_pdf'; 
        }    
        apiGateWay.get(apiURL, {invoiceId:$scope.invoiceId, companyId:$scope.companyId, showServiceDate: $scope.IsVisible}).then(function(response) {
            if (response.data.status == 200 && response.data.data.pdf) {        
                
                $window.location.href = response.data.data.pdf;
                          
            } else {  
                $scope.error = response.data.message;
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
        }, function(error){
            $scope.isProcessing = false;
            $scope.error = error;
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 3000);
            //$scope.error = response.data.message;
        });        
    }
    //Get Payment Profile
    $scope.getPaymentProfile = function(){  
        if($scope.isNoAuthPage){
            $scope.showPaymentProfilePopup();
            return false;
        }
        $scope.isProcessing = true; 
        apiGateWay.get("/payment_profile",  {customerId: $scope.invoiceDetails.customerId}).then(function(response) {
            if (response.data.status == 200) { 
                $scope.paymentProfiles = response.data.data;  
                 
            } else {    
                $scope.paymentProfiles = [];   
                $scope.errorMsg = response.data.message;
            }            
            $scope.isProcessing = false; 
            $scope.showPaymentProfilePopup();
        }, function(error){
            $scope.isProcessing = false; 
            $scope.paymentProfiles = []; 
            $scope.showPaymentProfilePopup();  
        })
    }
    //Show Payment Profile Popup
    $scope.showPaymentProfilePopup = function(){    
        $scope.model.transaction_amount = $scope.invoiceDetails.balanceDue    
        $scope.selectPaymentMethodPopup = ngDialog.open({
            template: 'selectPaymentMethodPopup.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {     
                $scope.model = {
                    paymentMethod : '',
                    notes: '',
                    transaction_amount:''
                }
                $scope.paymentSuccess = false;
                $scope.paymentError = false;
                $scope.selectedPaymentMethod = '';
                $scope.isTransactionPending = false;
            }
          });
    }

    //Show Email Invoice Popup
    $scope.showEmailInvoicePopup = function(){   

//        $scope.sentEmailModel.email = $scope.invoiceDetails.length > 0 && invoiceDetails.billingDetails ? $scope.invoiceDetails.billingDetails.email : $scope.customerDetails.customer.email;
          $scope.sentEmailModel.email = $scope.invoiceDetails.length > 0 && invoiceDetails.billingDetails ? $scope.invoiceDetails.billingDetails.email : $scope.invoiceDetails.billingDetails.email;

        $scope.successMsg = false;
        $scope.sentEmailError = false;
        ngDialog.open({
            template: 'sentEmailPopup.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {  
             
                
            }
          });
    }
    $scope.checkingInvoicePaidStatus = false;
    $scope.invoiceIsAlreadyPaid = false;
    $scope.isTransactionPending = false;
    $scope.checkInvoicePaidStatus = function(type, isCallBackForDueDate=false){
        $scope.checkingInvoicePaidStatus = true;
        $scope.invoiceIsAlreadyPaid = false;
        $scope.isTransactionPending = false;
        let apiURL = '/invoice_details';  
        if($scope.isNoAuthPage){
            apiURL = '/public_invoice_details'; 
        }  
        apiGateWay.get(apiURL, {invoiceId:$scope.invoiceId, companyId:$scope.companyId}).then(function(response) {
            if (response.data.status == '200') {
                let status = response.data.data.data.invoiceStatus ? response.data.data.data.invoiceStatus : '';
                // const isTransactionPending = response.data.data.data.isTransactionPending;
                const isTransactionPending = false;
                if (isTransactionPending != null && isTransactionPending != undefined && isTransactionPending) {
                    $scope.isTransactionPending = true;
                    $scope.checkingInvoicePaidStatus = false;
                    return
                }
                if (isCallBackForDueDate) {
                    $scope.invoiceDetails.invoiceStatus = status;
                    $scope.isDueDatePickerVisible = false;
                    $scope.isDueDateUpdating = false;
                    $scope.successMsg = 'Due date updated successfully';
                    setTimeout(function() {
                        $scope.successMsg = false;
                        if (!$scope.$$phase) $scope.$apply()
                    }, 500);
                    return
                }
                if (status.toLowerCase() != 'paid') {
                    setTimeout(function() {
                        $scope.checkingInvoicePaidStatus = false;                        
                        if (!$scope.$$phase) $scope.$apply()
                    }, 2000);
                    let _companyId = (auth.getSession().userType == "administrator" || auth.getSession().canAccessMultiCompany) ? $rootScope.selectedCompany : $scope.companyId;
                    let billingAddress = {
                        displayName: $scope.invoiceDetails.billingDetails.displayName || '',
                        firstName: $scope.invoiceDetails.billingDetails.firstName || '',
                        lastName: $scope.invoiceDetails.billingDetails.lastName || '',
                        email: $scope.invoiceDetails.billingDetails.email || '',
                        country: $scope.invoiceDetails.billingDetails.country || 'US',
                        address: $scope.invoiceDetails.billingDetails.address || '',
                        city: $scope.invoiceDetails.billingDetails.city || '',
                        state: $scope.invoiceDetails.billingDetails.state || '',
                        zip: $scope.invoiceDetails.billingDetails.zipCode || '',
                    }
                    let widgetData = { 
                        section: 'invoice_page',
                        type: type, 
                        companyId: _companyId,                        
                        prefix_transaction_id: $scope.invoiceId,
                        addressId: $scope.invoiceDetails.billingDetails.addressId,
                        userTokenId: $scope.invoiceDetails.customerId,
                        amount: $scope.model.transaction_amount,
                        billingAddress: billingAddress,
                        sessionToken: null                
                    };
                    $rootScope.initiatePaymentFormEvent(widgetData)                   
                } else {       
                    $scope.invoiceIsAlreadyPaid = true;                    
                    $scope.checkingInvoicePaidStatus = false;
                    $scope.getInvoiceDetails();
                }
            } else {
                $scope.checkingInvoicePaidStatus = false;
            }            
        }, function(error) {
            $scope.checkingInvoicePaidStatus = false;
        })                
    }
    $scope.closePaidErrorPopup = function() {
        $scope.invoiceIsAlreadyPaid = false;        
        ngDialog.closeAll();   
        let _btn = document.getElementById('getPaymentBtnNoAuth');
        if (_btn) {
            _btn.blur();
        }    
    }
   
    
    //Save Notes
    $scope.saveNotes = function(notes){  
        if(notes == $scope.invoiceDetails.invoiceNotes){
            return false;
        }
        $scope.isProcessing = true; 
        apiGateWay.send("/update_invoice_notes", {invoiceId: $scope.invoiceId, notes:$scope.invoiceModel.invoiceNotes}).then(function(response) {
            if (response.data.status == 200){ 
                $scope.invoiceDetails.invoiceNotes = notes;
            } else {     
                $scope.errorMsg = response.data.message;
            }            
            $scope.isProcessing = false; 
        }, function(error){
            $scope.isProcessing = false; 
        })
    }

    $scope.selectPaymentMethod = function(value){
        let obj = [];     
        if(typeof value === "number"){
            obj = $scope.paymentProfiles.filter(function(item){           
                return item.id == value;
            })
            $scope.selectedPaymentMethod = obj[0].paymentProfileName+' <small>('+(obj[0].paymentMethod == 'ach' ? 'ACH' : '')+""+(obj[0].paymentMethod == 'cc' && obj[0].accountType ? obj[0].accountType.toUpperCase() : '')+' x'+obj[0].accountLastFourDigits+')</small>';
        } else {
            $scope.selectedPaymentMethod = value;
        }
    }
    
    $scope.chemicalReadingArray = function(items){
     
        let result = {} 
        let total = 0; 
        angular.forEach(items, function(job){     
            
            angular.forEach(job.chemicalDetails, function(item){
                
                if(result[item.chemical]){
                    result[item.chemical].qty = result[item.chemical].qty+parseFloat(item.qty);
                   // result[item.chemical].rate = result[item.chemical].rate+parseFloat(item.rate);
                    result[item.chemical].rate = result[item.chemical].rate;
                    result[item.chemical].total = result[item.chemical].total+parseFloat(item.total);
                } else {
                    result[item.chemical] = angular.copy(item);
                    //result[item.chemical].grandTotal = job.chemicalCost;
                }

            })
            total = total + parseFloat(job.chemicalCost);
        })
        
        return {rows: Object.keys(result).map(function(k) {return result[k]}), total:total};      
        
    }
    $scope.isCompanyBillingSettingLoaded = false;
    $scope.getCompanySetting = function(){
        if ($scope.isCompanyBillingSettingLoaded) {
            return
        }
        $scope.isProcessing = true;       
        apiGateWay.get("/company_billing_settings?"+$scope.companyId).then(function(response) {
            if (response.data.status == 200) {
                $scope.customerTaxData.taxSettingArray = response.data.data.taxData;                
            }
            $scope.isProcessing = false; 
            $scope.isCompanyBillingSettingLoaded = true;
        },function(error){
            $scope.isProcessing = false;
        });
        
    }

    $scope.taxSelected = function(id, getInvoiceDetails= true){
        
        $scope.isProcessing = true;  
        $scope.customerTaxData.selectedTaxId = id;
        angular.forEach($scope.customerTaxData.taxSettingArray, function(item){
            if(item.id == id){
                $scope.customerTaxData.selectedTaxTitle = item.title + " (" + item.amount + "%)";
                $scope.customerTaxData.selectedTaxAmount = item.amount;
            }
        });
        $scope.customerTaxData.selectedTaxValue = ($scope.invoiceDetails.subTotalAmount - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;

        apiGateWay.send("/update_invoice_tax", {invoiceId:$scope.invoiceId, taxTitle:$scope.customerTaxData.selectedTaxTitle, taxPercentValue:$scope.customerTaxData.selectedTaxAmount, isRemove:0}).then(function(response) {
            if (response.status == 200 && response.data.data) {
                $scope.isProcessing = false; 

                $scope.invoiceDetails.balanceDue = response.data.data.balanceDue;

                if($scope.customerDiscountData.discountAmount>0){
                    $scope.invoiceDetails.totalAmount = $scope.invoiceDetails.subTotalAmount + $scope.customerTaxData.selectedTaxValue - $scope.customerDiscountData.discountAmount; 
                }else{
                    $scope.invoiceDetails.totalAmount = $scope.invoiceDetails.subTotalAmount + $scope.customerTaxData.selectedTaxValue;
                }
                if(getInvoiceDetails){
                    $scope.getInvoiceDetails();
                }

            } else {     
                $scope.isProcessing = false; 
            }
        },function(error){
            $scope.isProcessing = false; 
        });

        $scope.customerTaxData.taxDataPopup = false;
    }
    $scope.removeTax = function(){
        $scope.isProcessing = true;       
        apiGateWay.send("/update_invoice_tax", {invoiceId:$scope.invoiceId, taxTitle:"", taxPercentValue:0, isRemove:1}).then(function(response) {
            if (response.data.status == 200 && response.data.data) {
                $scope.invoiceDetails.balanceDue = response.data.data.balanceDue;
                $scope.isProcessing = false;
                $scope.customerTaxData.selectedTaxTitle = "";
                $scope.customerTaxData.selectedTaxAmount = 0;
                $scope.customerTaxData.selectedTaxValue = 0;
                $scope.getInvoiceDetails();
               if($scope.customerDiscountData.discountAmount>0){
                    $scope.invoiceDetails.totalAmount = $scope.invoiceDetails.subTotalAmount - $scope.customerDiscountData.discountAmount; 
                }else{
                    $scope.invoiceDetails.totalAmount = $scope.invoiceDetails.subTotalAmount;
                }
            } else {     
                $scope.isProcessing = false; 
                $scope.customerTaxData.errorMsg = error;
            }

        },function(error){
            $scope.isProcessing = false;
            $scope.customerTaxData.errorMsg = error;
        });
        setTimeout(function () {
            $scope.customerTaxData.errorMsg = '';
        }, 2000); 
    }

    $scope.showTaxPopup = function(){
        
        $scope.customerTaxData.taxDataPopup = !$scope.customerTaxData.taxDataPopup;
        
        if ($scope.customerTaxData.taxDataPopup) {
            
            $scope.$window.onclick = function (event) {
                closeTaxPopup(event);
            };
        } else {
            $scope.customerTaxData.taxDataPopup = false;
           // $scope.$window.onclick = null;
        }
    }

    function closeTaxPopup(event) {

        var clickedElement = event.target;
        if (!clickedElement) return;

        var elementClasses = clickedElement.classList;
        var clickedOnDiscountPop = elementClasses.contains('tax-button') || elementClasses.contains('tax-button') || (clickedElement.parentElement !== null && clickedElement.parentElement.classList.contains('tax-button'));
        if (!clickedOnDiscountPop) {
            $scope.customerTaxData.taxDataPopup = false;
            return;
        }
    }

    $scope.showDiscountInput= function(){
        $scope.customerDiscountData.discountDataShow = true;
        $scope.customerDiscountData.discountValue = 0;
    }
    $scope.updateDiscountType= function($index){
        $scope.customerDiscountData.dtype  = $index ;
        $scope.discountValueChange();
    }
    $scope.discountValueChange= function(){
       if($scope.customerDiscountData.dtype=='%'){
        $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue * $scope.invoiceDetails.subTotalAmount/100  ;
        $scope.customerDiscountData.discountTitle = $scope.customerDiscountData.discountValue+" "+$scope.customerDiscountData.dtype;
       } else{
        $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue;
        $scope.customerDiscountData.discountTitle = $scope.customerDiscountData.dtype + $scope.customerDiscountData.discountValue;
       }
       
    }
    $scope.saveDiscountByInput = function(e){        
        if (e.keyCode == 13) {
            $scope.saveDiscount();
        }
    }
    $scope.saveDiscount = function(getInvoiceDetails= true){
        if($scope.customerDiscountData.discountAmount > $scope.invoiceDetails.subTotalAmount){
            $scope.errorDiscount ="Discount amount should not be more than the subtotal";
            
            setTimeout(function () {
                $scope.errorDiscount = '';
            }, 2000);
            return false;
        }
       
        if( true ){
            $scope.isProcessing = true; 

            /*if($scope.customerDiscountData.discountAmount > $scope.invoiceDetails.balanceDue){
                
                $scope.customerDiscountData.discountAmount = $scope.invoiceDetails.balanceDue;
               
            }*/

            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = ($scope.invoiceDetails.subTotalAmount - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.invoiceDetails.totalAmount = $scope.invoiceDetails.subTotalAmount - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue; 
            }else{
                $scope.invoiceDetails.totalAmount = $scope.invoiceDetails.subTotalAmount - $scope.customerDiscountData.discountAmount;
            }
           // $scope.customerDiscountData.discountAmount = $scope.customerDiscountData.discountAmount > $scope.invoiceDetails.balanceDue ? $scope.invoiceDetails.balanceDue : $scope.customerDiscountData.discountAmount;
           if ($scope.customerDiscountData.discountAmount === null) {
            $scope.customerDiscountData.discountAmount = 0
           }
            apiGateWay.send("/update_invoice_discount", {invoiceId: $scope.invoiceId, discountTitle:$scope.customerDiscountData.discountTitle, discountValue:$scope.currencyTrimmer($scope.customerDiscountData.discountAmount), taxValue:$scope.customerTaxData.selectedTaxValue, isRemove:0}).then(function(response) {
                if (response.data.status == 200){ 
                    $scope.customerDiscountData.discountDataUpdated = true;
                    $scope.customerDiscountData.discountDataShow = false;
                    $scope.invoiceDetails.balanceDue = response.data.data.balanceDue;
                    if(getInvoiceDetails){
                        $scope.getInvoiceDetails();
                    }
                } else {     
                    $scope.errorBottom = response.data.message;
                    $scope.scrollToError('#bottom-section-error')
                    setTimeout(function() {
                        $scope.errorBottom = '';
                        if (!$scope.$$phase) $scope.$apply()
                    }, 3000);
                }         
                $scope.isProcessing = false; 
            }, function(error){
                $scope.errorBottom = error;
                $scope.scrollToError('#bottom-section-error')
                setTimeout(function() {
                    $scope.errorBottom = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 3000);
                $scope.isProcessing = false; 
                if(getInvoiceDetails){
                    $scope.getInvoiceDetails();
                }
            })
        }  
    }
    $scope.scrollToError = function(id){
        $('html, body').animate({
            scrollTop: $(id).offset().top
        }, 200);
    }

    $scope.removeDiscount = function(){
        $scope.isProcessing = true; 

        if($scope.customerTaxData.selectedTaxValue>0){
            $scope.customerTaxData.selectedTaxValue = $scope.invoiceDetails.subTotalAmount * $scope.customerTaxData.selectedTaxAmount / 100;
            $scope.invoiceDetails.totalAmount = $scope.invoiceDetails.subTotalAmount + $scope.customerTaxData.selectedTaxValue; 
        }else{
            $scope.invoiceDetails.totalAmount = $scope.invoiceDetails.subTotalAmount;
        }

        apiGateWay.send("/update_invoice_discount", {invoiceId: $scope.invoiceId, discountTitle:"", discountValue:0, taxValue:$scope.customerTaxData.selectedTaxValue, isRemove:1}).then(function(response) {
            if (response.data.status == 200){ 
                
                $scope.customerDiscountData.discountTitle = "";
                $scope.customerDiscountData.discountAmount = 0;
                $scope.customerDiscountData.discountDataUpdated = false;
                $scope.customerDiscountData.discountDataShow = false; 
                $scope.customerDiscountData.addDiscountButton = true;    
                $scope.invoiceDetails.balanceDue = response.data.data.balanceDue;   
                setTimeout(function(){
                    $scope.getInvoiceDetails();
                },500)
            } else {     
            }            
            $scope.isProcessing = false; 
        }, function(error){
            $scope.isProcessing = false; 
            $scope.customerDiscountData.errorMsg = error;
        })
        setTimeout(function(){
            $scope.customerDiscountData.errorMsg = '';  
          }, 2000)
  
    }

    $scope.syncInvoicesToQBO = function(){
        $scope.isProcessing = true;
        let url = '/sync_invoices_to_qbo';
        
        apiGateWay.get(url, {companyId:auth.getSession().companyId, invoiceId: $scope.invoiceId}).then(function(response) {
          if (response.data.status == 200) {
            $scope.successMsg = 'Invoice Synced QBO Id : ' + response.data.data.qboInvoiceId + " PB Id: " + response.data.data.pbInvoiceId + " PB Invoice Number: " + response.data.data.invoiceNumber ;
          } else {
            $scope.error = 'There is some error in invoice syncing'
          }
          $scope.isProcessing = false;
          setTimeout(function(){
            $scope.successMsg = '';
            $scope.error = '';
          }, 5000);
        }, function(error){
          $scope.isProcessing = false;
          $scope.error = error;
          setTimeout(function(){
            $scope.successMsg = '';
            $scope.error = '';
          }, 2000);
        })
    }

    $scope.getCustomerDetails = function() {
        $scope.customerDiscountData = {"discountDataShow":true, "discountDataUpdated":false, "discountAmount":0, "discountValue":0, "DiscountTitle":"", "dtype":"%","addDiscountButton":true, "errorMsg":""};
        $scope.customerTaxData = {"taxSettingArray":[],"taxDataPopup":false, "selectedTaxId":null, "selectedTaxAmount":0, "addTaxButton":true};
        $scope.getInvoiceDetails();  
        $scope.isProcessing = true;
        let addressId= $scope.addressId;
        apiGateWay.get("/customer_short_details", {"addressId":addressId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.customerDetails = response.data.data;
            } 
            $scope.isProcessing = false;
        },function(error){
            $scope.isProcessing = false;
        });
    };

    $scope.addBundleProductSearch = () => {
        $scope.bundleSearchText = "";
        if($scope.existPaymentValue) {
            ngDialog.open({
                template: 'existPaymentValue.html',
                className: 'ngdialog-theme-default v-center',
                overlay: true,
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function() {     
                    
                }
              });
        } else {
            $scope.saveOneTimeJob = true;
            $scope.bundleSearchForm = true;
            setTimeout(function(){
                angular.element("#bundleSearchText").focus();
            }, 100);
        }
        
    }
    $scope.saveInvoiceType = function(invoiceType) {
        $scope.invoiceType = invoiceType;
    }

    $scope.addProductToBundle = (productBundleListCategory) => {
        let invoiceLineItems = $scope.invoiceDetails.details[0].lineData;
        if (invoiceLineItems && invoiceLineItems.length > 0) {
            function isLineItemIdIsNumber(value) {
                return typeof value === 'number';
            }
            function isLineItemIdIsString(value) {
                return typeof value === 'string' && value.startsWith('qb_');
            }
            let existingProductIndex = invoiceLineItems.findIndex(product => {
                if (isLineItemIdIsNumber(product.id)) {
                  return product.id === productBundleListCategory.id;
                } else if (isLineItemIdIsString(product.id)) {                  
                  return product.id === 'qb_' + productBundleListCategory.importId;
                } else {                  
                  return false;
                }
            });                   
            if (existingProductIndex > -1) {
                let existingProduct = invoiceLineItems[existingProductIndex];                                
                existingProduct.qty = Number(existingProduct.qty) + 1;
                if (existingProduct.id && typeof existingProduct.id === 'string') {
                    existingProduct.id = existingProduct.id.trim();
                }
                if (isLineItemIdIsString(existingProduct.id) || existingProduct.id == "" || existingProduct.id == undefined || existingProduct.id == null) {
                    existingProduct.id = productBundleListCategory.id;
                    existingProduct.importId = productBundleListCategory.importId;
                }
                existingProduct.title = productBundleListCategory.name;
                existingProduct.isChargeTax = productBundleListCategory.isChargeTax;
                existingProduct.description = productBundleListCategory.description;
                existingProduct.price = productBundleListCategory.price;
                existingProduct.unitPrice = productBundleListCategory.unitPrice ? productBundleListCategory.unitPrice : productBundleListCategory.price;
                $scope.bundleSearchForm = false;                
                $scope.calculateBundleCostAndSave(existingProduct, existingProductIndex);
                return false
            }        
        }
        $scope.showAddProduct = false
        if(productBundleListCategory.bundleItemReference && productBundleListCategory.bundleItemReference.length > 0) {
            angular.forEach(productBundleListCategory.bundleItemReference, (element, index) => {
                //  if isChargeTax is missing from element
                if ((element.isChargeTax === undefined || element.isChargeTax ===  null)) {                
                    apiGateWay.get("/product_services_save", {
                        id: element.id
                    }).then(function(response) {
                        var isChargeTax;
                        //  if isChargeTax is missing from response
                        if(response.data.data.isChargeTax === undefined || response.data.data.isChargeTax === null) {
                            if (element.category == "Product") {
                                if ($scope.defaultTaxSettingData.companyProductTaxe == 1) {
                                    isChargeTax = 1
                                } else {
                                    isChargeTax = 0
                                }
                            }
                            if (element.category == "Service") {
                                if ($scope.defaultTaxSettingData.companyServiceTaxe == 1) {
                                    isChargeTax = 1
                                } else {
                                    isChargeTax = 0
                                }
                            }
                        } else {
                            //  if isChargeTax is not missing from response
                            isChargeTax = response.data.data.isChargeTax;
                        }
                        element.isChargeTax = isChargeTax;
                        $scope.bundleSearchText = "";
                        $scope.bundleSearchForm = false;        
                    }, function(error){
                    });
                } 
            });
        }
        if($scope.productNoItem == true){
            let bundleObj = [{
                "category":productBundleListCategory.category, 
                "bundleItemReference":productBundleListCategory.bundleItemReference?productBundleListCategory.bundleItemReference:null,
                "cost": productBundleListCategory.cost, 
                "id": productBundleListCategory.id, 
                "name": productBundleListCategory.name, 
                "price": productBundleListCategory.price, 
                "sku": productBundleListCategory.sku,
                "showIndividualPrice": productBundleListCategory.showIndividualPrice?productBundleListCategory.showIndividualPrice:0  ,
                "isChargeTax": productBundleListCategory.isChargeTax?productBundleListCategory.isChargeTax:0,
                "duration": productBundleListCategory.duration?productBundleListCategory.duration:"00:00", 
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "description": productBundleListCategory.description ? productBundleListCategory.description : ''
            }];
            $scope.productBundleListNew = bundleObj;
            $scope.productBundleListNewCategory = bundleObj.category;
            $scope.productNoItem = false; 
        } else {
            let bundleObj = {
                "category":productBundleListCategory.category,
                "bundleItemReference":productBundleListCategory.bundleItemReference?productBundleListCategory.bundleItemReference:null, 
                "cost": productBundleListCategory.cost,
                "sku": productBundleListCategory.sku?productBundleListCategory.sku:'', 
                "id": productBundleListCategory.id, 
                "showIndividualPrice": productBundleListCategory.showIndividualPrice?productBundleListCategory.showIndividualPrice:0,
                "isChargeTax": productBundleListCategory.isChargeTax?productBundleListCategory.isChargeTax:0,
                "duration": productBundleListCategory.duration?productBundleListCategory.duration:"00:00",
                "name": productBundleListCategory.name, 
                "price": productBundleListCategory.price, 
                "qty": productBundleListCategory.qty ? productBundleListCategory.qty : 1,
                "description": productBundleListCategory.description ? productBundleListCategory.description : ''
            };
            $scope.productBundleListNew.push(bundleObj);
            $scope.productBundleList = angular.copy($scope.productBundleListNew);
        }
        $scope.isBundleSearch = false;
        $scope.bundleSearchForm = false;
        $scope.bundleCost = productBundleListCategory.cost;
        $scope.calculateBundleCost();
        
        $scope.saveInvoiceItem();
        
    }

    $scope.saveInvoiceItem = function() {
        $scope.isProcessing = true; 

        let subTotalAmt  = parseFloat($scope.invoiceDetails.subTotalAmount) + parseFloat($scope.bundleSubTotal)
        
        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != ""){
            $scope.customerDiscountData.discountAmount  = parseFloat($scope.customerDiscountData.discountTitle) * subTotalAmt/100  ;
        } else{
            $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue;
        }
        if($scope.customerDiscountData.discountAmount > 0){
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.invoiceDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue; 
            }else{
                $scope.invoiceDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount;
            }
        }else{
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - 0) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.invoiceDetails.totalAmount = subTotalAmt - 0 + $scope.customerTaxData.selectedTaxValue; 
            }else{
                $scope.invoiceDetails.totalAmount = subTotalAmt
            }   
        }
       
        $scope.invoiceDetails.balanceDue = $scope.invoiceDetails.totalAmount
        let saveInvoiceProductItem = {
            "itemReference":$scope.productBundleListNew,
            "invoiceId":$scope.invoiceId,
            "action":"Add",
            "isIndividualPriceVisibilityChanged": 0,
            "customerId":$scope.invoiceDetails.customerId,
            "addressId":$scope.invoiceDetails.serviceAddressId,
            "invoiceStatus":$scope.invoiceDetails.invoiceStatus,
            "subTotalAmount": $scope.invoiceDetails.subTotalAmount,
            "totalAmount": $scope.invoiceDetails.totalAmount, 
            "companyId":auth.getSession().companyId,
            "discountValue": $scope.currencyTrimmer($scope.customerDiscountData.discountAmount),
            "discountTitle": $scope.invoiceDetails.discountTitle != '' ? $scope.invoiceDetails.discountTitle : '' ,
            "taxValue": $scope.customerTaxData.selectedTaxValue,
            "balanceDue":$scope.invoiceDetails.balanceDue 
        };
        // roundup amount values
        if (saveInvoiceProductItem.invoiceStatus == 'Upcoming') {
            saveInvoiceProductItem.balanceDue =  Number(saveInvoiceProductItem.balanceDue.toFixed(2));
            saveInvoiceProductItem.totalAmount =  Number(saveInvoiceProductItem.totalAmount.toFixed(2));
        }
        // roundup amount values        
        // show error if amount is less then zero
        if (saveInvoiceProductItem.itemReference && saveInvoiceProductItem.itemReference.amount && saveInvoiceProductItem.itemReference.amount < 0) {
            $scope.errorProductForm = 'Transaction amount should be 0 or greater.';
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
            $scope.isProcessing = false;
            return
        }
        // show error if amount is less then zero
        apiGateWay.send("/edit_invoice", saveInvoiceProductItem).then(function(response) {
            if (response.data.status == 200) {
                $scope.successProductFormResponse = response.data.message;             
                $scope.getInvoiceDetails();   
                $scope.isProcessing = false;   
                $scope.productBundleListNew = [];  
            } else {
                $scope.errorProductForm = 'Error';
                $scope.isProcessing = false;
            }
        },function(error) {            
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });
        $scope.showAddProduct = true
    }

    $scope.calculateBundleCost = () => {
        $scope.bundleSubTotal = 0; 
        if( $scope.productBundleListNew.length > 0){
            angular.forEach( $scope.productBundleListNew, function(value, key) {
                $scope.bundleSubTotal = $scope.bundleSubTotal + value.price*value.qty;
                $scope.bundleTotal = $scope.bundleSubTotal+$scope.discountCalculation;
            })
            
        }
    }

    $scope.cancelInvoiceItem = () => {
        $scope.productBundleListNew = []; 
        $scope.showAddProduct = true
    }

    $scope.calculateBundleCostAndSave = (productBundleListCategory, k, j) => {
        $scope.currentIndex = k;
        $scope.bundleSubTotal = 0; 
        let subTotalAmountVar = 0; 
        let totalAmountVar = 0; 


        productBundleListCategory.unitPrice =  productBundleListCategory.unitPrice.toString(); // reverse masking 
        productBundleListCategory.unitPrice = productBundleListCategory.unitPrice.replace(/\$|,/g, ''); // reverse masking
        
        if(!productBundleListCategory.qty || productBundleListCategory.qty==0){
            $scope.errorProductFormQty[k] = 'Quantity cannot be zero.';
            setTimeout(function() {
                $scope.errorProductFormQty[k] = "";
            }, 2000);
            return false;
        }
        $scope.isProcessing = true;
        
        pAmmount = parseFloat(productBundleListCategory.qty) * parseFloat(productBundleListCategory.unitPrice)
        if(pAmmount > parseFloat(productBundleListCategory.amount)){
            diffammount = pAmmount - parseFloat(productBundleListCategory.amount)
            subTotalAmountVar = parseFloat($scope.invoiceDetails.subTotalAmount) + parseFloat(diffammount)
            totalAmountVar = parseFloat($scope.invoiceDetails.totalAmount) + parseFloat(diffammount)
        }

        if(pAmmount < parseFloat(productBundleListCategory.amount)){
            diffammount =  parseFloat(productBundleListCategory.amount) - pAmmount
            subTotalAmountVar = parseFloat($scope.invoiceDetails.subTotalAmount) - parseFloat(diffammount)
            totalAmountVar = parseFloat($scope.invoiceDetails.totalAmount) - parseFloat(diffammount)
        }

        // show error if amount is less then zero      
        if (subTotalAmountVar < 0) {
            $scope.amountInMinusError = "The invoice total can't be less than $0.00";
            setTimeout(function() {
                $scope.amountInMinusError = "";
            }, 2000);
            $scope.isProcessing = false;
            return
        }

        if(pAmmount == parseFloat(productBundleListCategory.amount)){
            $scope.isProcessing = false;
            if($scope.invoiceDetails.invoiceStatus == "Paid"){
                // $scope.errorProductForm = 'Paid or partially paid invoices is not updated.';
            }
            subTotalAmountVar = parseFloat($scope.invoiceDetails.subTotalAmount)
            totalAmountVar = parseFloat($scope.invoiceDetails.totalAmount)
        }
        
        productBundleListCategory.amount = parseFloat(pAmmount)
        productBundleListCategory.unitPrice = parseFloat(productBundleListCategory.unitPrice)
        productBundleListCategory.category = productBundleListCategory.category
        

        let subTotalAmt  = parseFloat(subTotalAmountVar)
        if($scope.invoiceDetails.totalAmount == 0){
            $scope.invoiceDetails.totalAmount = subTotalAmt
        }else{
            $scope.invoiceDetails.totalAmount = totalAmountVar
        }


        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != ""){
            $scope.customerDiscountData.discountAmount  = parseFloat($scope.customerDiscountData.discountTitle) * subTotalAmt/100  ;
        } else{
            $scope.customerDiscountData.discountAmount  = $scope.invoiceDetails.discountValue;
        }

        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != "" &&  
        Number.isNaN($scope.customerDiscountData.discountAmount)=== true && parseFloat($scope.invoiceDetails.discountValue) > 0 ){
            $scope.customerDiscountData.discountAmount  = $scope.invoiceDetails.discountValue;
        }
        if($scope.customerDiscountData.discountAmount > 0){
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.invoiceDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue; 
            }else{
                $scope.invoiceDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount;
            }
        }else{
            if($scope.customerTaxData.selectedTaxValue>0 & productBundleListCategory.isChargeTax === 1){
                $scope.invoiceDetails.totalAmount = subTotalAmt - 0 + $scope.customerTaxData.selectedTaxValue;                 
                // $scope.customerTaxData.selectedTaxValue = (subTotalAmt - 0) * $scope.customerTaxData.selectedTaxAmount / 100;
                // $scope.invoiceDetails.totalAmount = subTotalAmt - 0 + $scope.customerTaxData.selectedTaxValue; 
            }else{
                $scope.invoiceDetails.totalAmount = subTotalAmt
            }   
        }

        // if($scope.customerDiscountData.discountAmount > subTotalAmt){
        //     $scope.isProcessing = false;
        //     $scope.IsTextFieldVisible[k] =  false ;
        //     $scope.IsBunddleVisible[k] =  false ;   
        //     $scope.errorProductForm = "Discount amount should not be more than the subtotal";
        //     setTimeout(function() {
        //         $scope.errorProductForm = "";
        //     }, 2000);
        //     return false;
        // }
        if(Number.isNaN($scope.customerTaxData.selectedTaxValue)) {
            $scope.customerTaxData.selectedTaxValue = 0
        }
        if(Number.isNaN($scope.invoiceDetails.totalAmount)) {
            $scope.invoiceDetails.totalAmount = 0
        }
        $scope.invoiceDetails.balanceDue = $scope.invoiceDetails.totalAmount
        let saveInvoiceProductItem = {
            "itemReference":productBundleListCategory,
            "invoiceId":$scope.invoiceId,
            "action":"Edit",
            "isIndividualPriceVisibilityChanged": 0,
            "customerId":$scope.invoiceDetails.customerId,
            "addressId":$scope.invoiceDetails.serviceAddressId,
            "invoiceStatus":$scope.invoiceDetails.invoiceStatus,
            "subTotalAmount": $scope.invoiceDetails.subTotalAmount,
            "totalAmount": $scope.invoiceDetails.totalAmount,
            "companyId":auth.getSession().companyId,
            "discountValue": $scope.currencyTrimmer($scope.customerDiscountData.discountAmount),
            "discountTitle": $scope.invoiceDetails.discountTitle != '' ? $scope.invoiceDetails.discountTitle : '' ,
            "taxValue": $scope.customerTaxData.selectedTaxValue,
            "balanceDue":$scope.invoiceDetails.balanceDue
        };
        // let saveInvoiceProductItem = {
        //     "itemReference":productBundleListCategory,
        //     "invoiceId":$scope.invoiceId,
        //     "action":"Edit",
        //     "customerId":$scope.invoiceDetails.customerId,
        //     "addressId":$scope.invoiceDetails.serviceAddressId,
        //     "invoiceStatus":$scope.invoiceDetails.invoiceStatus,
        //     "subTotalAmount": 100,
        //     "totalAmount": 120,
        //     "companyId":auth.getSession().companyId,
        //     "discountValue": 10,
        //     "taxValue": $scope.customerTaxData.selectedTaxValue,
        //     "balanceDue":$scope.invoiceDetails.balanceDue
        // };
        // roundup amount values
        if (saveInvoiceProductItem.invoiceStatus == 'Upcoming') {
            saveInvoiceProductItem.balanceDue =  Number(saveInvoiceProductItem.balanceDue.toFixed(2));
            saveInvoiceProductItem.totalAmount =  Number(saveInvoiceProductItem.totalAmount.toFixed(2));
        }
        // roundup amount values  
        // show error if amount is less then zero
        // if (saveInvoiceProductItem.itemReference && saveInvoiceProductItem.itemReference.amount && saveInvoiceProductItem.itemReference.amount < 0) {
        //     $scope.errorProductForm = 'Transaction amount should be 0 or greater.';
        //     setTimeout(function() {
        //         $scope.errorProductForm = "";
        //     }, 2000);
        //     $scope.isProcessing = false;
        //     return
        // }
        // show error if amount is less then zero 
        if (saveInvoiceProductItem && saveInvoiceProductItem.itemReference && saveInvoiceProductItem.itemReference.qty) {
            saveInvoiceProductItem.itemReference.qty = $scope.qtyDecimalConverter(saveInvoiceProductItem.itemReference.qty);
        }
        apiGateWay.send("/edit_invoice", saveInvoiceProductItem).then(function(response) {
            if (response.data.status == 200) {
                $scope.successProductFormResponse = response.data.message;             
                //$scope.isProcessing = false;   
                $scope.productBundleListNew = []; 
                $scope.getInvoiceDetails();
                //$scope.invoiceDetails.subTotalAmount = subTotalAmountVar;
                // if($scope.customerDiscountData.discountDataUpdated && $scope.customerDiscountData.discountTitle !=''){
                //     $scope.getInvoiceDetails(true);   
                // } else {
                //     $scope.getInvoiceDetails(false);  
                // }
                //$scope.getInvoiceDetails(true);   
                // $scope.discountValueChange();
                // $scope.saveDiscount();
                // $scope.taxSelected($scope.customerTaxData.selectedTaxId);
                
                $scope.IsTextFieldVisible[k] =  false ;     
                $scope.IsBunddleVisible[k] =  false ;     
            } else {
                $scope.errorProductForm = response.message;
                $scope.isProcessing = false;
                $scope.IsTextFieldVisible[k] =  false ;
                $scope.IsBunddleVisible[k] =  false ;   
            }
        },function(error) {            
            $scope.isProcessing = false;
            $scope.IsTextFieldVisible[k] =  false ;
            $scope.IsBunddleVisible[k] =  false ;   
            $scope.errorProductForm = error;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        }); 
       
    }

    $scope.deleteLineDataAndSave = (productBundleListCategory, k) => {                
        $scope.currentIndex = k;            
        const lineItemsWithNotZeroQty = $scope.invoiceDetails.details[0].lineData.filter(item => item.qty !== 0);        
        if (lineItemsWithNotZeroQty.length == 1) {
            $scope.errorProductForm = "This can't be deleted because it's the last line item on the invoice. You can add a different line item and then delete this one or you can delete the entire invoice.";
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
            return
        }        
        $scope.bundleSubTotal = 0; 
        $scope.isProcessing = true; 
        // try {
        //     let str = $scope.productServices
        //     var proCount = str.toString().split(',').length; 
        // } catch (error) {
        //     var proCount = 0; 
        // }
        // const index = $scope.productServices.indexOf(productBundleListCategory.title);
        // if (index !== -1) $scope.productServices.splice(index, 1);


        let subTotalAmt  = parseFloat($scope.invoiceDetails.subTotalAmount) - parseFloat(productBundleListCategory.amount)

        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != ""){
            $scope.customerDiscountData.discountAmount  = parseFloat($scope.customerDiscountData.discountTitle) * subTotalAmt/100  ;
        } else{
            $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue;
        }
        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != "" &&  
        Number.isNaN($scope.customerDiscountData.discountAmount)=== true && parseFloat($scope.invoiceDetails.discountValue) > 0 ){
            $scope.customerDiscountData.discountAmount  = $scope.invoiceDetails.discountValue;
        }

        if($scope.customerDiscountData.discountAmount > 0){
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.invoiceDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue; 
            }else{
                $scope.invoiceDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount;
            }
        }else{
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - 0) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.invoiceDetails.totalAmount = subTotalAmt - 0 + $scope.customerTaxData.selectedTaxValue; 
            }else{
                $scope.invoiceDetails.totalAmount = subTotalAmt
            }
        }

        // show error if amount is less then zero
        if ($scope.invoiceDetails.totalAmount < 0) {
            $scope.amountInMinusError = "The invoice total can't be less than $0.00";
            setTimeout(function() {
                $scope.amountInMinusError = "";
            }, 2000);
            $scope.isProcessing = false;
            return
        }

        $scope.invoiceDetails.balanceDue = $scope.invoiceDetails.totalAmount
        let saveInvoiceProductItem = {
            "itemReference":productBundleListCategory,
            "invoiceId":$scope.invoiceId,
            "action":"Delete",
            "isIndividualPriceVisibilityChanged": 0,
            "customerId":$scope.invoiceDetails.customerId,
            "addressId":$scope.invoiceDetails.serviceAddressId,
            "invoiceStatus":$scope.invoiceDetails.invoiceStatus,
            "subTotalAmount": $scope.productBundleListNew.length > 0 ? $scope.invoiceDetails.subTotalAmount : 0,
            "totalAmount": $scope.invoiceDetails.totalAmount, 
            "companyId":auth.getSession().companyId,
            "discountValue": $scope.currencyTrimmer($scope.invoiceDetails.discountValue),
            "discountTitle": $scope.invoiceDetails.discountTitle != '' ? $scope.invoiceDetails.discountTitle : '' ,
            "taxValue": $scope.customerTaxData.selectedTaxValue,
            "balanceDue":$scope.invoiceDetails.balanceDue 
        };
        $scope.customerDiscountData.discountDataUpdated = $scope.productBundleListNew.length > 0 ? $scope.customerDiscountData.discountDataUpdated : 0;
        if(subTotalAmt == 0){
            saveInvoiceProductItem.totalAmount = 0
            saveInvoiceProductItem.balanceDue = 0
            $scope.removeDiscount()
            $scope.removeTax()
        }
        // roundup amount values
        if (saveInvoiceProductItem.invoiceStatus == 'Upcoming') {
            saveInvoiceProductItem.balanceDue =  Number(saveInvoiceProductItem.balanceDue.toFixed(2));
            saveInvoiceProductItem.totalAmount =  Number(saveInvoiceProductItem.totalAmount.toFixed(2));
        }
        // roundup amount values        
        // show error if amount is less then zero
        // if (saveInvoiceProductItem.itemReference && saveInvoiceProductItem.itemReference.amount && saveInvoiceProductItem.itemReference.amount < 0) {
        //     $scope.errorProductForm = 'Transaction amount should be 0 or greater.';
        //     setTimeout(function() {
        //         $scope.errorProductForm = "";
        //     }, 2000);
        //     $scope.isProcessing = false;
        //     return
        // }
        // show error if amount is less then zero
        apiGateWay.send("/edit_invoice", saveInvoiceProductItem).then(function(response) {
            if (response.data.status == 200) {
                $scope.successProductFormResponse = response.data.message;                 
                $scope.isProcessing = false;
                $scope.productBundleListNew = [];
                $scope.IsTextFieldVisible = [];
                $scope.getInvoiceDetails();   
            } else {
                $scope.errorProductForm = response.message;
                $scope.isProcessing = false;
                $scope.IsTextFieldVisible[k] = $scope.IsTextFieldVisible[k] ? false : true;
            }
        },function(error) {            
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            $scope.IsTextFieldVisible[k] = $scope.IsTextFieldVisible[k] ? false : true;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });
       
        
    }      
    $rootScope.showInvoiceDate = function(){
        $rootScope.shownInvoiceDate = true; 
    }
    $rootScope.hideInvoiceDate = function(){
        $rootScope.shownInvoiceDate = false;
    }
    $rootScope.deleteInvoiceConfirm = function(){  
        if($scope.existPaymentValue) {
            ngDialog.open({
                template: 'existPaymentValue.html',
                className: 'ngdialog-theme-default v-center',
                overlay: true,
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function() {     
                    
                }
              });
        } else {
            $scope.addInvoicePopup = ngDialog.open({            
                id  : 11,
                template: 'deleteInvoiceConfirm.html',
                className: 'ngdialog-theme-default v-center',
                overlay: true,
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function () {
                    
                }
            });
        }           
        
    }

    
    $rootScope.deleteInvoice = function(){
        $scope.isDeleting = true;
        apiGateWay.send("/delete_invoice", {
            "id": $scope.invoiceId
        }).then(function(response) {
            if (response.status == 200) {
                $scope.changeStatus($scope.addressId);
            }            
            $scope.successMsg = response.data.message;
            setTimeout(function() {
                $scope.successMsg = false;
                $scope.addInvoicePopup.close();
                $state.go("app.customerdetail", {
                    addressId: $scope.invoiceDetails.billingDetails.addressId
                });
                $scope.isDeleting = false;
            }, 2000)
        }, function(error){            
            $scope.addInvoicePopup.close();
            if(error.message!=""){$scope.error = error;}else{$scope.error = 'Something went wrong';}
            setTimeout(function() {
                $scope.error = "";
            }, 2000);
            $scope.isDeleting = false;
        })
    };

    $scope.changeStatus = function (addressId) {
        $scope.isChangingStatus = true;
        apiGateWay.get("/customer/change_status", {'addressId': addressId }).then(function (response) {
          if (response.status == 200) {
            $scope.isChangingStatus = false;
          } else {
            $scope.isChangingStatusError = response.message;
          }
          $scope.isChangingStatus = false;
        }, function (error) {
          $scope.isChangingStatusError = error;
          $scope.isChangingStatus = false;
        });
      }

    $scope.hideSearchBar = function(){  
        if(!$scope.searchText){
            $scope.bundleSearchForm = false;
            $scope.isBundleSearch = false;
        } 
        $scope.searchText = "";
    }
    
    $scope.hideSearchBarIcon = function(){
        $scope.bundleSearchForm = false;
        $scope.isBundleSearch = false;
        $scope.searchText = "";
        $scope.bundleSearchText = "";
    }
    $scope.showIndPrice = function(obj,k){  
        $scope.isProcessing = true; 
        obj.showIndividualPrice = 1
        $scope.calculateBundleCostAndSaveToggle(obj,k, true)
    }
    $scope.hideIndPrice = function(obj,k){  
        $scope.isProcessing = true; 
        obj.showIndividualPrice = 0
        $scope.calculateBundleCostAndSaveToggle(obj,k, true)
    }
    $scope.ShowHide = function (e) {
        $scope.showHideText = ($scope.showHideText=="show") ? "hide" : "show";
        $scope.IsVisible = $scope.IsVisible ? false : true;
        $scope.serviceDateToggleUpdate($scope.showHideText=="show" ? true : false);
    }
    $scope.ShowHideTextField = function (k) {
        $scope.IsTextFieldVisible[k] = $scope.IsTextFieldVisible[k] ? false : true;
        $scope.IsTextFieldVisible[k] ? false : $scope.getInvoiceDetails();
        
        $scope.IsTextFieldVisible[k] ? $scope.bundleSearchForm = false : true;
        $scope.IsBunddleVisible = []
    }

    $scope.ShowHideBundleItemReference = function (k, j) {
        $scope.IsBunddleVisible = []
        //if(!$scope.IsBunddleVisible[k]){
            $scope.IsBunddleVisible[k] = [];
       // }
        $scope.IsBunddleVisible[k][j] = $scope.IsBunddleVisible[k][j] ? false : true;
        $scope.IsBunddleVisible[k][j] ? false : $scope.getInvoiceDetails();

        $scope.IsBunddleVisible[k][j] ? $scope.bundleSearchForm = false : true;
        $scope.IsTextFieldVisible[k] = false
    }
    $scope.sentToJobPage = function(jobId){
        $state.go("app.onetimejob",{"addressId":$scope.invoiceDetails.billingDetails.addressId,"jobId":jobId}, {reload: true});
    }

    $scope.calculateBundleCostAndSaveToggle = (productBundleListCategory, k, isIndvPriceToggle=false) => {
        $scope.bundleSubTotal = 0; 
        let subTotalAmountVar = 0; 
        let totalAmountVar = 0; 
        $scope.isProcessing = true; 
        pAmmount = parseFloat(productBundleListCategory.qty) * parseFloat(productBundleListCategory.unitPrice)
        if(pAmmount > parseFloat(productBundleListCategory.amount)){
            diffammount = pAmmount - parseFloat(productBundleListCategory.amount)
            subTotalAmountVar = parseFloat($scope.invoiceDetails.subTotalAmount) + parseFloat(diffammount)
            totalAmountVar = parseFloat($scope.invoiceDetails.totalAmount) + parseFloat(diffammount)
        }

        if(pAmmount < parseFloat(productBundleListCategory.amount)){
            diffammount =  parseFloat(productBundleListCategory.amount) - pAmmount
            subTotalAmountVar = parseFloat($scope.invoiceDetails.subTotalAmount) - parseFloat(diffammount)
            totalAmountVar = parseFloat($scope.invoiceDetails.totalAmount) - parseFloat(diffammount)
        }

        if(pAmmount == parseFloat(productBundleListCategory.amount)){
            $scope.isProcessing = false;
            if($scope.invoiceDetails.invoiceStatus == "Paid"){
                // $scope.errorProductForm = 'Paid or partially paid invoices is not updated.';
            }
            subTotalAmountVar = parseFloat($scope.invoiceDetails.subTotalAmount)
            totalAmountVar = parseFloat($scope.invoiceDetails.totalAmount)
        }

        productBundleListCategory.amount = parseFloat(pAmmount)
        productBundleListCategory.unitPrice = parseFloat(productBundleListCategory.unitPrice)
        
        let subTotalAmt  = parseFloat(subTotalAmountVar)
        if($scope.invoiceDetails.totalAmount == 0){
            $scope.invoiceDetails.totalAmount = subTotalAmt
        }else{
            $scope.invoiceDetails.totalAmount = totalAmountVar
        }
        

        if($scope.customerDiscountData.dtype=='%' && $scope.customerDiscountData.discountTitle != ""){
            $scope.customerDiscountData.discountAmount  = parseFloat($scope.customerDiscountData.discountTitle) * subTotalAmt/100  ;
        } else{
            $scope.customerDiscountData.discountAmount  = $scope.customerDiscountData.discountValue;
        }
        if($scope.customerDiscountData.discountAmount > 0){
            if($scope.customerTaxData.selectedTaxValue>0){
                $scope.customerTaxData.selectedTaxValue = (subTotalAmt - $scope.customerDiscountData.discountAmount) * $scope.customerTaxData.selectedTaxAmount / 100;
                $scope.invoiceDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount + $scope.customerTaxData.selectedTaxValue; 
            }else{
                $scope.invoiceDetails.totalAmount = subTotalAmt - $scope.customerDiscountData.discountAmount;
            }
        }
       
        $scope.invoiceDetails.balanceDue = $scope.invoiceDetails.totalAmount
        let saveInvoiceProductItem = {
            "itemReference":productBundleListCategory,
            "invoiceId":$scope.invoiceId,
            "action":"Edit",
            "isIndividualPriceVisibilityChanged": isIndvPriceToggle ? 1 : 0,
            "customerId":$scope.invoiceDetails.customerId,
            "addressId":$scope.invoiceDetails.serviceAddressId,
            "invoiceStatus":$scope.invoiceDetails.invoiceStatus,
            "subTotalAmount": $scope.invoiceDetails.subTotalAmount,
            "totalAmount": $scope.invoiceDetails.totalAmount, 
            "companyId":auth.getSession().companyId,
            "discountValue": $scope.currencyTrimmer($scope.customerDiscountData.discountAmount),
            "discountTitle": $scope.invoiceDetails.discountTitle != '' ? $scope.invoiceDetails.discountTitle : '' ,
            "taxValue": $scope.customerTaxData.selectedTaxValue,
            "balanceDue":$scope.invoiceDetails.balanceDue 
        };
        $scope.isProcessing = true;
        // roundup amount values
        if (saveInvoiceProductItem.invoiceStatus == 'Upcoming') {
            saveInvoiceProductItem.balanceDue =  Number(saveInvoiceProductItem.balanceDue.toFixed(2));
            saveInvoiceProductItem.totalAmount =  Number(saveInvoiceProductItem.totalAmount.toFixed(2));
        }
        // roundup amount values        
        // show error if amount is less then zero
        if (saveInvoiceProductItem.itemReference && saveInvoiceProductItem.itemReference.amount && saveInvoiceProductItem.itemReference.amount < 0) {
            $scope.errorProductForm = 'Transaction amount should be 0 or greater.';
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
            $scope.isProcessing = false;
            return
        }
        // show error if amount is less then zero
        apiGateWay.send("/edit_invoice", saveInvoiceProductItem).then(function(response) {
            if (response.data.status == 200) {
                $scope.successProductFormResponse = response.data.message;              
                $scope.isProcessing = false;   
                $scope.productBundleListNew = []; 
                $scope.invoiceDetails.subTotalAmount = subTotalAmountVar;
                
                $scope.getInvoiceDetails();
            } else {
                $scope.errorProductForm = response.message;
                $scope.isProcessing = false;
            }
        },function(error) {            
            $scope.isProcessing = false;
            $scope.errorProductForm = error;
            setTimeout(function() {
                $scope.errorProductForm = "";
            }, 2000);
        });
    }

    $scope.updateBundlePrice = (value, parentIndex)=>{
        if($scope.invoiceDetails && $scope.invoiceDetails.details.length > 0){
            let total = 0;
            angular.forEach($scope.invoiceDetails.details, function(detail, index){
                let lineData = detail.lineData[parentIndex].bundleItemReference;
                angular.forEach(lineData, function(item){
                    //total += parseFloat(item.qty) * parseFloat(item.unitPrice);
                    total += parseFloat(item.qty) * String(item.unitPrice).match(/(\d+)(\.\d+)?/g);
                });
            });
            $scope.invoiceDetails.details[0].lineData[parentIndex].unitPrice = total;
        }
    }
    $scope.currencyChangeConverter = (unitPrice,qty, ind) => {
        $scope.invoiceDetails.details[0].lineData[ind].qty = qty.toString().replace(/[^\d\.-]/g, "")        
        let up = 0
        try {
            up =  unitPrice.toString().replace(/\$|,/g, '');
        } catch (error) {
             up =  unitPrice;
        }
         $scope.lineUnitPrice[ind] = parseFloat(up)*qty; 
     }
    $scope.fixQty = function(qty, lineItem) {
        qty = qty + '';
        qty = qty.replace(/[^0-9.]/g, '');
        let parts = qty.split('.');
        if (parts.length > 2) {
            lineItem.qty = null;
        }
    }
     $scope.qtyDecimalConverter = (qty) => {       
        _val = Number(qty);
        if (isNaN(_val)) return 0;
        var _isInt = _val % 1 === 0 || false;
        var _dontFix = true; 
        if (!_isInt && _dontFix) {
            var _x = _val.toString();  // convert to string for array
            _x = _x.split('.'); // convert to array
            _x = _x[0] + '.' + _x[1].substring(0, 2); // remove extra decimals
            _x = Number(_x); // convert to number
            return _x;
        }
        return qty;
     }

     $scope.currencyChangeConverterBundle = (unitPrice,qty, ind, pind=0) => {
        let up = 0
        try {
            up =  unitPrice.toString().replace(/\$|,/g, '');
        } catch (error) {
             up =  unitPrice;
        }
          $scope.lineUnitPrice[ind] = parseFloat(up)*qty; 
          $scope.updateBundlePriceQty(parseFloat(up),qty,pind)
      }
 
      $scope.updateBundlePriceQty = (value, qty, parentIndex)=>{
        
         if($scope.invoiceDetails && $scope.invoiceDetails.details.length > 0){
             let total = 0;
             angular.forEach($scope.invoiceDetails.details, function(detail, index){
                 let lineData = detail.lineData[parentIndex].bundleItemReference;
                 angular.forEach(lineData, function(item, i){
                     
                     let up = 0
                        try {
                            up =  item.unitPrice.toString().replace(/\$|,/g, '');
                        } catch (error) {
                            up =  item.unitPrice;
                        }
                     total += parseFloat(item.qty) * parseFloat(up);
                 });
             });
             $scope.invoiceDetails.details[0].lineData[parentIndex].unitPrice = total;
         }
     } 
    $scope.isTotalProcessing = false;
    $scope.toggleChargeTax = function(lineItem, index) {
        $scope.isTotalProcessing = true;
        $scope.calculateBundleCostAndSave(lineItem, index)        
    }
    $scope.currencyTrimmer = function(c) {
        var finalValue = c;
        if (c) {
            c = Number(c);
            finalValue = Number(Math.round(finalValue * 1000) / 1000)
            finalValue = Number(Math.round(finalValue * 100) / 100)
        }
        return finalValue;
    }
    $scope.getFormattedHtmlForLineItemDesc = (html) => {    
        var units = ['ounce', 'pound', 'cup', 'quart', 'gallon', 'bag', 'scoop', 'bottle', 'container', 'pod', 'tab', 'bucket'];  
        if (html && html != '') {
            html = html.replaceAll('\n', '')
            units.forEach(function (unit) {
                var regex = new RegExp('\\b' + unit + '\\b', 'gi');
                html = html.replace(regex, unit + '<br>');
                html = html.replaceAll('<br> ', '<br>');
            })
            return html
        } 
        return '';        
    }
    $scope.getLineItemTitleFormatted = (title) => {
        if (title.includes(':')) {
            var titleArr = title.split(':')
            return titleArr[titleArr.length - 1];
        }
        return title
    }

    $rootScope.openInvoiceAuditLog = () => {
        $scope.invoiceAuditPopup();
    }

    $scope.invoiceAuditPopup = function() {
        ngDialog.open({
          template: 'invoiceAuditPopup.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };

    $scope.getInvoiceAuditLogs = function() {
        $scope.isProcessing = true;
        let jobParam = {
            offset: $scope.pageObj.currentPageInv - 1,
            limit: $scope.pageObj.limitInv,
            sortOrder: $scope.dirInv,
            sortColumn: $scope.columnInv,
            addressId: $scope.addressId,
            invoiceId: $scope.invoiceId,
        };
        apiGateWay.get("/get_invoice_audit_logs", jobParam).then(function(response) {
            if (response.data.status == 200) {
                $scope.isProcessing = false;                
                let invoiceAuditResponse = response.data.data;
                $scope.invoiceAuditList = invoiceAuditResponse.data;
                $scope.pageObj.totalRecordInv = invoiceAuditResponse.rows;                
                $scope.pageObj.totalPageInv = $scope.pageObj.totalRecordInv > 0 ? Math.ceil($scope.pageObj.totalRecordInv / $scope.pageObj.limitInv) : 0; 
            } else {
                $scope.isProcessing = false;
            }
        }, function(error){
            $scope.isProcessing = false;
        });
    }

    $scope.goToInvoiceAuditListPage = function(page) {
        $scope.pageObj.currentPageInv = page;
        $scope.getInvoiceAuditLogs();
    };

    $scope.taxRateHelp = function(){
        var url = 'https://help.poolbrain.com/en/articles/7235786-quickbooks-online-tax-rate-syncing';
        window.open(url,'_blank');
    }
    $scope.parseAmtToStr = (v) => {
        v = v + '';
        v = v.replaceAll(",", "_");
        v = v.replaceAll(".", "_");
        return v;
    }
    $rootScope.refreshProductSearch = (productName) => {
        $scope.showListForBundle(productName)
    }
    $scope.$on("$destroy", function() {
      if ($rootScope.isCommonForm) {
          $rootScope.isCommonForm = false;
          $rootScope.isCategoryLoaded = false;
      }
  });
    $scope.isDueDatePickerVisible = false;
    $scope.isDueDateUpdating = false;
    $scope.isDueDateHasError = false;
    $scope.toggleDueDatePicker = (type) => { 
        $rootScope.shownInvoiceDate = false;
        $scope.cachedInvDueDate = $scope.invDueDate;
        if (type=='open') {
            $scope.isDueDatePickerVisible = true;
            setTimeout(function() {
                document.querySelector('#invDueDate').focus()                
            }, 10)
        } else if (type=='close') {                        
            $scope.isDueDatePickerVisible = false;
        }
    }
    $scope.oldPayloadDueDate = '';
    $scope.updateDueDate = (event) => {
        let _val = event.target.value;
        if (_val.length < 10) {
            _val = ''
        }
        $scope.invDueDate = _val;             
        if ($scope.invDueDate == undefined || $scope.invDueDate == null || $scope.invDueDate == '') {
            $scope.isDueDatePickerVisible = false;
            $scope.invDueDate = $scope.cachedInvDueDate;    
            setTimeout(function() {
                document.querySelector('#invDueDate').value = moment($scope.invDueDate).format('MM/DD/YYYY');                
            }, 100)
            return
        }
        $scope.isDueDateHasError = false; 
        $scope.successMsg = '';
        $scope.error = '';
        let payload = { 
            date: moment($scope.invDueDate).format('YYYY-MM-DD'),
            invoiceId: $scope.invoiceId,
            actionPerformed : 'update_due_date'          
        };    
        if ($scope.oldPayloadDueDate === payload.date) {
            $scope.isDueDatePickerVisible = false;
            $scope.invDueDate = $scope.cachedInvDueDate; 
            return
        }
        $scope.oldPayloadDueDate = payload.date;    
        $scope.isDueDateUpdating = true;        
        apiGateWay.send("/update_due_date", payload).then(function(response) {
            if (response.data.status == 200 && response.data.message == "Date Updated Successfully") {    
                $scope.invDueDate = response.data.data.dueDate;             
                $scope.invoiceDetails.dueDate = response.data.data.dueDate;
                $scope.cachedInvDueDate = response.data.data.dueDate;
                $scope.checkInvoicePaidStatus(undefined, true)   
                // $rootScope.datePickerOption.maxDate = moment($scope.invoiceDetails.dueDate).format('MM/DD/YYYY');
                if ($rootScope.qbConnectedNow) { apiGateWay.get('/sync_invoices_to_qbo', {companyId:auth.getSession().companyId, invoiceId: $scope.invoiceId}).then(function(response) {}, function(error){}) }
            } else {                                          
                $scope.error = response.data.message;
                $scope.isDueDateUpdating = false;
                $scope.isDueDateHasError = true;
                setTimeout(function() {
                    $scope.isDueDateHasError = false;
                    if (!$scope.$$phase) $scope.$apply()
                }, 500);
                setTimeout(function() {
                    $scope.error = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 2000);
            }            
        }, function(error){
            $scope.error = typeof error === 'string' ? error : 'Something went wrong';
            $scope.isDueDateUpdating = false; 
            $scope.isDueDateHasError = true;
            setTimeout(function() {
                $scope.isDueDateHasError = false;
                if (!$scope.$$phase) $scope.$apply()
            }, 500);
            setTimeout(function() {
                $scope.error = '';
                $scope.successMsg = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);           
        });
    }
    $scope.allInvoiceDetails = []; 
    $scope.$watch('invoiceDetails', function(newTitle) { 
        $scope.allInvoiceDetails = []; 
        $scope.allInvoiceDetails.push($scope.invoiceDetails)         
    }); 
    $scope.$on('productAddEvent', function(event, data) {
        if (data && data.widgetArea == 'invoiceDetail') {    
            if (data.isClose) {
                $scope.bundleSearchForm = false                
                return
            }
            if ($rootScope.canAddProductToBundle(data, $scope.invoiceDetails.subTotalAmount, 'errorProductForm')) {
                $scope.addProductToBundle(data);
            }
        }
    });
    $scope.copySuccessMsg = '';   
    $scope.copyPublicUrl = async () => {                    
        let str = $scope.invoiceDetails.invoiceUrl ? $scope.invoiceDetails.invoiceUrl : '';
        $scope.copySuccessMsg = '';
        function fallbackCopyTextToClipboard(text) {
          var textArea = document.createElement("textarea");
          textArea.value = text;          
          textArea.style.top = "0";
          textArea.style.left = "0";
          textArea.style.position = "fixed";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            if (successful) {
              $scope.copySuccessMsg = 'URL copied';
              $timeout(function() {
                $scope.copySuccessMsg = ''
              }, 500)
            } else {
              console.error('copy failed')
            }
          } catch (err) {
            console.error('copy failed')
          }
          document.body.removeChild(textArea);
        }
        function copyTextToClipboard(text) {
          if (!navigator.clipboard) {
            fallbackCopyTextToClipboard(text);
            return;
          }
          navigator.clipboard.writeText(text).then(function() {
            $scope.copySuccessMsg = 'URL copied';
            $timeout(function() {
              $scope.copySuccessMsg = ''
            }, 500)
          }, function(err) {
            console.error('copy failed')
          });
        }
        copyTextToClipboard(str)
    }
    // Department Dropdown    
    $scope.selectedInvoiceDepartment = {};
    $scope.isInvoiceDepartmentAssigning = false;
    $scope.assignInvoiceDepartment = function(department) {
        $scope.isInvoiceDepartmentAssigning = true;
        let payload = {
            invoiceId: $scope.invoiceId,
            departmentId: department.id
        }
        apiGateWay.send('/map_invoice_location', payload).then(function(response) {
            if (response.data.status == 200) {
                $scope.successMsg = response.data.message || "";
                setTimeout(function() {
                    $scope.successMsg = '';  
                }, 2000);
            } else {
                $scope.errorProductForm = response.data.message || "";
                setTimeout(function() {
                    $scope.errorProductForm = '';  
                }, 2000);
            }
            $scope.isInvoiceDepartmentAssigning = false;
        }, function(error){
            $scope.errorProductForm = typeof error == 'string' ? error : "Something went wrong!";
            setTimeout(function() {
                $scope.errorProductForm = '';  
            }, 2000);
            $scope.isInvoiceDepartmentAssigning = false;
        })  
    }
    $scope.setSelectedInvoiceDepartment = function(department) {  
        if ($scope.selectedInvoiceDepartment.id != department.id) {
            $scope.assignInvoiceDepartment(department)
        }     
        $scope.selectedInvoiceDepartment = department;
        return department.id || 0;
    } 
    // Department Dropdown
    $scope.serviceDateToggleUpdate = function(isShow){
        $scope.isProcessing = true; 
        apiGateWay.send("/update_service_dates_toggle", {invoiceId: $scope.invoiceId, isServiceDatesHide: isShow}).then(function(response) {
            if (response.data.status == 200 && response.data.data) {
                // $scope.IsVisible = response.data.data.isInvoiceServiceDatesHidden;
            }
            $scope.isProcessing = false; 
        },function(error){
            $scope.isProcessing = false;
        });
    }    
});