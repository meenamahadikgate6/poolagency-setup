angular.module('POOLAGENCY')

.controller('customerPaymentListController', function($rootScope, $scope, apiGateWay, $timeout, $filter, $stateParams, $state, ngDialog, getPaymentConfig, configConstant, commonService, auth, config ) { 
    $scope.addressId = $stateParams.addressId; 
    $scope.session = auth.getSession() ? auth.getSession() : {}; 
    $scope.companyId = auth.getSession() ? auth.getSession().companyId : '';   
    $scope.selectedEvn = configConstant.currEnvironment;
    $scope.pageObj =  {
        currentPagePay: 1,
        pagePay: '',
        limitPay: 10,
        totalRecordPay: '',
        totalPagePay: ''        
    }
    $scope.dirPay = 'desc';
    $scope.columnPay = 'createTime';
    $scope.isProcessing = false;
    $scope.isRefundProcessing = false;
    $scope.payDate = {
        fromDate:"",
        toDate:""
    }
    $scope.paymentList = []; 
    $scope.amountUpdateLogs = [];
    $scope.PayStatusFilters = ['unapplied','applied', 'partial'];
    $scope.selectedPayStatus = ['unapplied','applied', 'partial'];
    $scope.paymentStatusFiltersListingPage = ['all','unapplied','partial','applied','refunds'];
    $scope.paymentStatusFiltersListingPageSelected = 'all';
    $scope.paymentDurationFiltersListingPage = ['1 week','1 month','90 days', '6 months', '1 year', 'custom'];
    $scope.selectedPaymentDuration = '1 month';
    $scope.changeDuarationFilter = (val) => {
        $scope.pageObj.currentPagePay = 1;
        $scope.selectedPaymentDuration = val;
        if (val != 'custom') {
            $scope.getCustomerPaymentList();
        }
    }
    $scope.filterByPaymentStatus = (val) => {
        $scope.pageObj.currentPagePay = 1;
        $scope.paymentStatusFiltersListingPageSelected = val;
        $scope.getCustomerPaymentList();
    }
    $scope.isPaymentListingPage = false;
    $scope.selectedRow = {};
    $scope.selectedPayStatusCode = [];
    $scope.paymentStatus = {'unapplied': true, 'applied':true, 'partial':true} 
    $scope.searchPaymentTextKey = '';
    $scope.convertDateOffset = '';
    $scope.modelPaymentData = { 
        type:'',  
        notes: null,
        applyOnNextInvoice:true,   
    }
    $scope.index = 0;
    $scope.showAllPropertiesPayment = {value:0};
    $scope.refundText = 'REFUND';
    $scope.modelRefund = {}
    $scope.initialCheck = false;
    $scope.selectedPaymentMethod = '';
    $scope.payaErrorCode = "";
    $scope.paymentAuditList = [];
    $scope.pageObjPaymentLog =  {
        currentPage: 1,
        page: '',
        limitInv: 10,
        totalRecord: '',
        totalPage: ''        
    }
    $scope.dirInv = 'desc';
    $scope.columnInv = 'createTime';
    $scope.paymentLogLoading = false;
    $scope.paymentId = null;
    $scope.$watch('customerBillingData', function (newVal, oldVal) { 
        if(!$scope.initialCheck && Object.keys(newVal).length > 0 ){
          $scope.initialCheck = true;
          setTimeout(function() {
            $scope.customerBillingDataObj = angular.copy($rootScope.customerBillingData);      
          }, 2000);  
           
        }  
      }, true);
    $(document).ready(function() {
        $timeout(function(){
            $('.input-daterange').datepicker({
                autoclose: true,
                endDate: moment().format('MM-YYYY'),
                todayBtn: "linked"
            });
        }, 1000)
      
    });


    $scope.clickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    $scope.filterByDate = function(p) {
        if ($scope.payDate.fromDate != '' && $scope.payDate.toDate != '') {
            let fromDate = new Date($scope.payDate.fromDate)
            let toDate = new Date($scope.payDate.toDate);
            if (fromDate <= toDate) {
                $scope.pageObj.currentPagePay = 1;
                $scope.getCustomerPaymentList();
            } else {
                if (p == 'fromDate') {
                    $scope.payDate.fromDate = '';
                } else {
                    $scope.payDate.toDate = '';
                }
            }
        } else {
            if ($scope.payDate.fromDate == '' && $scope.payDate.toDate == '') {
                $scope.getCustomerPaymentList();
            }
        }
    };
    $scope.initSingleListingPage = function() {
        window.scrollTo(0, 0);
        $scope.isPaymentListingPage = true;
        if ($rootScope.param_paymentStatus) {
            // 0-unapplied,1-paid/applied,2-partial,3-refund            
            $scope.paymentStatusFiltersListingPageSelected = $rootScope.param_paymentStatus;
        }
        if ($rootScope.param_filterDurationPayment) {
            $scope.selectedPaymentDuration = $rootScope.param_filterDurationPayment;
            if ($rootScope.param_filterDurationPayment == 'custom') {
                $scope.payDate.fromDate = $rootScope.param_fromDatePayment;
                $scope.payDate.toDate = $rootScope.param_toDatePayment;
            }          
        }
        // $scope.getCustomerPaymentList(); 
    }
    $scope.exportPaymentReportParams = {};
    $scope.getCustomerPaymentList = function(newPaymentId = null) {
        $scope.isProcessing = true;
        let payParam = {
            offset: $scope.pageObj.currentPagePay - 1,
            limit: $scope.pageObj.limitPay,
            sortOrder: $scope.dirPay,
            sortColumn: $scope.columnPay,
            status: $scope.selectedPayStatusCode.join(','),
            searchText: $scope.searchPaymentText,
            addressId: $scope.addressId,
            showAllProperties: $scope.showAllPropertiesPayment.value,
        };
        $scope.pageObj.pagePay = $scope.pageObj.currentPagePay;
        if ($scope.payDate.fromDate != '' && $scope.payDate.toDate != '') {
            payParam.fromDate = $filter('date')(new Date($scope.payDate.fromDate), 'yyyy-MM-dd');
            payParam.toDate = $filter('date')(new Date($scope.payDate.toDate), 'yyyy-MM-dd');
        }

        let apiUrl = '/customer_payment_transaction';
        if ($scope.isPaymentListingPage) {
            payParam.length = payParam.limit;
            delete payParam.limit;   
            payParam.page = payParam.offset;
            delete payParam.offset;   
            payParam.column = payParam.sortColumn;
            delete payParam.sortColumn;  
            payParam.status = $scope.paymentStatusFiltersListingPageSelected;
            // 0-unapplied,1-paid/applied,2-partial,3-refund
            payParam.paymentStatus = 0
            if (payParam.status.toLowerCase() == 'unapplied') {
                payParam.paymentStatus = 0
            }if (payParam.status.toLowerCase() == 'applied') {
                payParam.paymentStatus = 1
            }if (payParam.status.toLowerCase() == 'partial') {
                payParam.paymentStatus = 2
            }if (payParam.status.toLowerCase() == 'refunds') {
                payParam.paymentStatus = 3
            }if (payParam.status.toLowerCase() == 'all') {
                delete payParam.paymentStatus;
            }
            delete payParam.status;            
            payParam.duration = $scope.selectedPaymentDuration;
            payParam.dir = payParam.sortOrder;
            delete payParam.sortOrder;
            if (payParam.fromDate) {
                payParam.startDate = payParam.fromDate
                delete payParam.fromDate
            }
            if (payParam.toDate) {
                payParam.endDate = payParam.toDate
                delete payParam.toDate
            }
            delete payParam.showAllProperties;
            delete payParam.addressId;
            apiUrl = '/payment_transaction_list'
            $scope.exportPaymentReportParams = payParam;
        }
        if (newPaymentId != null && !$scope.modeEdit) {
            $scope.pageObj.currentPagePay = 1,
            $scope.pageObj.pagePay = '';
            payParam.offset = 0;
        }
        apiGateWay.get(apiUrl, payParam).then(function(response) {
            
            if (response.data.status == 200) {
                
                let paymentListResponse = response.data.data;
                $scope.applied = paymentListResponse.applied;
                $scope.unapplied = paymentListResponse.unapplied;
                $scope.partial = paymentListResponse.partial;
                $scope.index =  $scope.index ? $scope.index : 0;
                if (newPaymentId != null) {
                    $scope.index = paymentListResponse.data.findIndex(item => item.id == newPaymentId);
                }
                if(!$scope.isPaymentListingPage && paymentListResponse.data[$scope.index] && (payParam.custPayTranId == undefined || payParam.custPayTranId == null)){
                    $scope.modelPaymentData.amountApplied = paymentListResponse.data[$scope.index].amountApplied;
                    $scope.modelPaymentData.amountUnApplied = paymentListResponse.data[$scope.index].amountBalance;
                    $scope.modelPaymentData.applied = paymentListResponse.data[$scope.index].applied;
                    $scope.modelPaymentData.custPayTranId = paymentListResponse.data[$scope.index].id;
                    $scope.modelPaymentData.createTime = paymentListResponse.data[$scope.index].createTime;
                    $scope.modelPaymentData.paymentMethod = paymentListResponse.data[$scope.index].paymentMethod; 
                    $scope.modelPaymentData.id = paymentListResponse.data[$scope.index].id; 
                    $rootScope.rootTransactionId = paymentListResponse.data[$scope.index].id;
                    $scope.paymentId = Number(paymentListResponse.data[$scope.index].id);
                    $scope.pageObjPaymentLog.currentPage = 1;
                    $scope.pageObjPaymentLog.page = '';
                    $scope.modelPaymentData.transactionStatus = paymentListResponse.data[$scope.index].transactionStatus;
                    $scope.paymentData = angular.copy(paymentListResponse.data[$scope.index]);
                    $scope.modelRefund.amount =  angular.copy(paymentListResponse.data[$scope.index].amount);         
                    if (!$scope.isPaymentListingPage) {
                        $scope.amountHistoryTooltip = $scope.amountUpdateHistoryById(paymentListResponse.data[$scope.index].id);          
                    }
                }

                if( $rootScope.rootTransactionId!=null && $scope.modelPaymentData.transactionStatus!=1 ){
                    $scope.getTransactionStatus();
                }
                if(!$scope.modeEdit){
                    $scope.modeEdit = true;
                } 
                $scope.pageObj.totalRecordPay = paymentListResponse.count; //paymentListResponse.rows;                
                $scope.pageObj.totalPagePay = $scope.pageObj.totalRecordPay > 0 ? Math.ceil($scope.pageObj.totalRecordPay / $scope.pageObj.limitPay) : 0;
                
                $scope.paymentList = paymentListResponse.data;                                  
                $scope.paymentStatusData = paymentListResponse.statusData;
                $scope.totalPageAmount = 0;
                $scope.amountUpdateLogs = paymentListResponse.logs;
                angular.forEach(paymentListResponse.data, function(item){
                    if(item.transactionType=="Refund") { item.amount = item.amount * -1 }
                    $scope.totalPageAmount = $scope.totalPageAmount+item.amount;
                });

                $scope.totalAmount = paymentListResponse.grandTotal;
                angular.forEach($scope.selectedPayStatus, function(item){
                    $scope.paymentStatus[item] = true;                   
                }); 
                 $scope.companyTimeZone = $scope.session.timeZone;
                $scope.generatePagination();

              
            } else {
                $scope.paymentList = [];
                $scope.amountUpdateLogs = [];
            }
            $scope.isProcessing = false;
        },function(error){
            $scope.isProcessing = false;
        });
    };

    $scope.addEditPaymentRefund = function(index){      
        if ($scope.isPaymentListingPage) {
            $scope.selectedRow = $scope.paymentList[index]; 
        }
        if (index != undefined && index != null) {
            $scope.paymentId = Number($scope.paymentList[index].id);
            $scope.pageObjPaymentLog.currentPage = 1;
            $scope.pageObjPaymentLog.page = '';
            if ($scope.isPaymentListingPage) {
               $scope.addressId = Number($scope.paymentList[index].addressId);
            }
        }
        $scope.getPaymentProfile();       
        $scope.modeEdit = false;  
        $scope.refundText = "REFUND";       
        $scope.modelPaymentData = { 
            type:'',  
            notes: null,
            applyOnNextInvoice:true,
            applied:0
        }
        if(index != null){
            $rootScope.rootTransactionId = $scope.paymentList[index].id;
            $scope.index = index; 
            $scope.modeEdit = true;
            
            $scope.modelPaymentData = { 
                type:$scope.paymentList[index].transactionType,  
                notes:$scope.paymentList[index].notes,
                amount:$scope.paymentList[index].amount,
                applyOnNextInvoice:$scope.paymentList[index].applyOnNextInvoice ? true : false,
                custPayTranId: $scope.paymentList[index].id,
                paymentMethod: $scope.paymentList[index].paymentMethod,
                applied: $scope.paymentList[index].applied,
                amountApplied: $scope.paymentList[index].amountApplied,
                amountUnApplied: $scope.paymentList[index].amountBalance,
                checkNumber: $scope.paymentList[index].checkNumber,
                createTime: $scope.paymentList[index].createTime,
                account_holder_name : $scope.paymentList[index].account_holder_name,
                id: $scope.paymentList[index].id,
                transactionId: $scope.paymentList[index].transactionId,
                transactionStatus: $scope.paymentList[index].transactionStatus,
                accountVaultId: $scope.paymentList[index].accountVaultId,
            }
            $scope.paymentData = angular.copy($scope.paymentList[index])
            $scope.modelRefund.amount =  angular.copy($scope.paymentList[index].amount);      
            $rootScope.rootTransactionId = $scope.paymentList[index].id;          
            if (!$scope.isPaymentListingPage) {
                $scope.amountHistoryTooltip = $scope.amountUpdateHistoryById($scope.paymentList[index].id);  
            }   
            
            if($scope.modelPaymentData.transactionId!=null && $scope.modelPaymentData.transactionStatus!=1 ){
                $scope.getTransactionStatus();
            }
            
            if (($scope.paymentList[index].paymentMethod == 'cc' || $scope.paymentList[index].paymentMethod == 'ach')) {
                $scope.getCCDetails($scope.paymentList[index].transactionId);
            } else {
                $scope.paymentListingCCDetails = {
                    account_type: '',
                    last_four: ''
                };
            }
        }
        
        ngDialog.open({
          id  : 10,
          template: 'addPaymentRefundPopup.html',
          className: 'ngdialog-theme-default v-center',
          autoFocus: false,
          overlay: true,
          closeByNavigation: true,
          closeByDocument: true,
          scope: $scope,
          trapFocus: false,
          preserveFocus: false,
          preCloseCallback: function() {
              $scope.index = '';  
              $scope.modeEdit = false;    
              $scope.modelPaymentData.custPayTranId = '';
              $scope.paymentSuccess = false;        
              $scope.paymentError = false;
              $scope.transactionId = '';
              $scope.paymentData = {};
              $scope.selectedPaymentMethod = '';
              $scope.amountHistoryTooltip = '';
              $rootScope.rootTransactionId = '';   
              $scope.selectedRow = {}
              $scope.paymentListingCCDetails = {
                account_type: '',
                last_four: ''
              };
          }
        });
       
      }
    $scope.getTransactionStatus = function(){ 
        if($rootScope.rootTransactionId || $scope.modelPaymentData.id){
            $scope.isProcessing = true; 
            apiGateWay.get("/get_transaction_status",  {transactionId: $rootScope.rootTransactionId ? $rootScope.rootTransactionId : $scope.modelPaymentData.id}).then(function(response) {
                if (response.data.data == 0) { 
                    $scope.refundText = "VOID"; 
                }
                if (response.data.data == 1) { 
                    $scope.refundText = "REFUND"; 
                }
                if (response.data.data == 2) { 
                    $scope.refundText = "VOID"; 
                }           
                $scope.isProcessing = false; 
            }, function(error){
                $scope.isProcessing = false; 
            })
        }
        
    }
    $scope.goToCustomerPaymentListPage = function(page) {
        $scope.pageObj.currentPagePay = page;
        $scope.getCustomerPaymentList();
    };
  
    $scope.goToPaymentDetail = function(obj) {        
       
        if (event.ctrlKey){
            var url = "/app/customerpaymentdetail/"+obj.id;
            window.open(url,'_blank');
        }else{
            $state.go("app.customerpaymentdetail",{"paymentId":obj.id}, {reload: true});
        } 
    };

    $scope.orderByJobList = function(columnPay) {
        $scope.columnPay = columnPay;
        $scope.dirPay = ($scope.dirPay == 'desc') ? 'asc' : 'desc';
        $scope.getCustomerPaymentList();
    };


    $scope.filterByStatus = function(node) {
        let type = node.toLowerCase()
        let allFilterRemoved = Object.entries($scope.paymentStatus).filter(function(item){
             return item[1] == true})

        if(allFilterRemoved.length > 1 || !$scope.paymentStatus[type]){
            $scope.paymentStatus[type] = !$scope.paymentStatus[type];        
            const index = $scope.selectedPayStatus.indexOf(type);

            if(index > -1) {
                $scope.selectedPayStatus.splice(index, 1)
            }else {
                $scope.selectedPayStatus.push(type);
            }                                                                         
            $scope.pageObj.currentPagePay = 1;
            $scope.selectedPayStatusCode = [];
            angular.forEach($scope.selectedPayStatus, function(item){
                if(item=='applied'){
                    $scope.selectedPayStatusCode.push(1);
                }
                if(item=='unapplied'){
                    $scope.selectedPayStatusCode.push(0);
                }
                if(item=='partial'){
                    $scope.selectedPayStatusCode.push(2);
                }
            })
            $scope.getCustomerPaymentList();
        }
        
    };

    $scope.showListingTab = function(tab){        
            angular.forEach(Object.entries($scope.listingTab), function(item){
                $scope.listingTab[item[0]] = false;
            })
            $rootScope.listingTab[tab]=true;  
            $scope.getCustomerPaymentList();
    }
    $scope.generatePagination = function(){         
        $scope.pageItem = []
        for(let i=1; i <= $scope.pageObj.totalPagePay; i++){
            $scope.pageItem.push(i);
        }
    }
    $scope.doSearchPaymentList = function($event,searchPaymentTextKey) {
        if(searchPaymentTextKey || $scope.searchPaymentText != searchPaymentTextKey){
            $event.target.blur();
            $scope.currentPage = 1;
            $scope.pageObj.currentPagePay = 1;
            $scope.searchPaymentText = searchPaymentTextKey.trim().replace(/,/g, "");        
            $scope.getCustomerPaymentList();
        }
    };
    //Add Credit
    $scope.addCredit = function(model){
        if (!$scope.isValidAmount(model)) {
            $scope.errorMsg = 'Please enter a valid amount';
            setTimeout(function() {
                $scope.errorMsg = '';
            }, 2000);
            return false;
        }
        if(lastPaymentApiHit){
            lastPaymentApiHit = false;
            let postData = {
                "transactionType": model.type,
                "amount": model.amount ? model.amount : 0,
                "applyOnNextInvoice": model.applyOnNextInvoice ? 1 : 0,
                "notes":  model.notes,
                "addressId": $scope.addressId
            }
            if($scope.isPaymentListingPage) {
                postData.addressId = $scope.selectedRow.addressId
            }
            if($scope.modeEdit){
                postData.custPayTranId = model.custPayTranId
            }
    
            $scope.isProcessing = true;       
            apiGateWay.send("/customer_payment_transaction",  postData).then(function(response) {
                if (response.data.status == 200) {  
                    lastPaymentApiHit = true;
                    if ($scope.isPaymentListingPage) {
                        $scope.changeStatus($scope.selectedRow.addressId);
                    } else {
                        $scope.changeStatus($scope.addressId);
                    }
                    $rootScope.rootTransactionId = response.data.data.custPayTranId;
                    $scope.paymentId = Number(response.data.data.custPayTranId);
                    $scope.pageObjPaymentLog.currentPage = 1;
                    $scope.pageObjPaymentLog.page = '';
                    $scope.getCustomerPaymentList($scope.paymentId);
                    $scope.isProcessing = false; 
                } else {   
                    $scope.errorMsg = response.data.message;
                    $scope.isProcessing = false; 
                    setTimeout(function() {
                        $scope.errorMsg = '';
                        if (!$scope.$$phase) $scope.$apply()
                    }, 2000);
                }         
                
                $scope.multipleClickIssue = true;
                  setTimeout(function() {
                    $scope.multipleClickIssue = false;
                    
                }, 2000);  
    
            },function(error){
                $scope.isProcessing = false;
                $scope.errorMsg = error;
                setTimeout(function() {
                    $scope.errorMsg = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 2000);                      
            });
        }
              
    }

    $scope.changeStatus = function (addressId) {
        $scope.isChangingStatus = true;
        apiGateWay.get("/customer/change_status", {'addressId': addressId }).then(function (response) {
          if (response.status == 200) {
            $scope.getUpdatedStatus(addressId);
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

    $scope.getUpdatedStatus = function (addressId) {
        var pdata = {
            addressId: addressId,
        };
        apiGateWay.get($rootScope.customerDetailEndpoint, pdata).then(function(response) {
            if (response.data) {
                if (response.data.status == 200) {
                    $scope.customerinfo = response.data.data;
                    $rootScope.existsInvoicePayment = response.data.data.custAddrDetailsData[0].existsInvoicePayment;
                    if($scope.customerinfo.customer.customerId){
                        $scope.isDelete = 0;
                        if($scope.customerinfo.customer.isActive == null){
                            $rootScope.isActive = 'Lead';
                            $scope.isDelete = 1;
                        }
                        else if($scope.customerinfo.customer.isActive == 3){
                            $rootScope.isActive = 'Active (no route)';
                        }
                        else if($scope.customerinfo.customer.isActive == 0){
                            $rootScope.isActive = 'Inactive';
                        }
                        else if($scope.customerinfo.customer.isActive == 1){
                            $rootScope.isActive = 'Active (routed)';
                        }
                        else{
                            $rootScope.isActive = 'Archived';   
                        }            
                    }
                } else {
                    $scope.customerinfo = [];
                }
            }
            $scope.isProcessing = false;
        }, function(error) {
            
        });
    }
    //Check PaymentType
    var lastPaymentApiHit = true;
    $scope.checkPaymentType = function(model){
        if (!$scope.isValidAmount(model)) {
            $scope.errorMsg = 'Please enter a valid amount';
            setTimeout(function() {
                $scope.errorMsg = '';
            }, 2000);
            return false;
        }
        if((model.paymentMethod == 'cc' || model.paymentMethod == 'ach') && !$scope.modeEdit){
            $scope.modelPaymentData.amount = $scope.modelPaymentData.amount.toString(); //reverse masking 
            $scope.modelPaymentData.amount = $scope.modelPaymentData.amount.replace(/ /g,''); //remove whitespace
            $scope.modelPaymentData.amount = $scope.modelPaymentData.amount.replace(/\$|,/g, ''); //reverse masking 
            $scope.modelPaymentData.amount = Number($scope.modelPaymentData.amount) // convert to number          
            if ($scope.modelPaymentData.amount === 0 || isNaN($scope.modelPaymentData.amount)) {        
                // $scope.errorMsg = 'Please enter a valid amount';            
                setTimeout(function(){
                    // $scope.errorMsg = ''
                }, 1500)
                return
            }           
            $scope.modelCachedForPayment = angular.copy(model);            
            let _companyId = (auth.getSession().userType == "administrator" || auth.getSession().canAccessMultiCompany) ? $rootScope.selectedCompany : $scope.companyId;
            let billingAddress = {
                displayName: $rootScope.customerInfoForPaymentPage.customer.displayName || '',
                firstName: $rootScope.customerInfoForPaymentPage.customer.firstName || '',
                lastName: $rootScope.customerInfoForPaymentPage.customer.lastName || '',
                email: $rootScope.customerInfoForPaymentPage.customer.email || '',
                country: $rootScope.customerInfoForPaymentPage.customer.country || 'US',
                address: $rootScope.customerInfoForPaymentPage.customer.billing_street || '',
                city: $rootScope.customerInfoForPaymentPage.customer.billing_city || '',
                state: $rootScope.customerInfoForPaymentPage.customer.billing_state || '',
                zip: $rootScope.customerInfoForPaymentPage.customer.billing_zip || '',
            }
            let widgetData = { 
                section: 'payment_listing_area',
                type: model.paymentMethod,
                companyId: _companyId,   
                prefix_transaction_id: $scope.addressId,           
                addressId: $scope.addressId,
                userTokenId: $scope.$parent.customerId,
                amount: model.amount,
                billingAddress: billingAddress,
                sessionToken: null,
                notes: $scope.modelCachedForPayment.notes,
                applyOnNextInvoice: $scope.modelCachedForPayment.applyOnNextInvoice
            };
            $rootScope.initiatePaymentFormEvent(widgetData) 
        } else {
            if(lastPaymentApiHit){
                $scope.takePayment(model, '');
            }
        }
    }
    $scope.isValidAmount = function(model) {
        model.amount =  model.amount.toString(); //reverse masking 
        model.amount = model.amount.replace(/\$|,/g, ''); //reverse masking
        const amount = parseFloat(model.amount); // Convert to a number
        return !isNaN(amount) && amount > 0; // Check if the amount is a valid number and greater than zero
    }
    //Take Payment
    $scope.payaErrorMessage = '';
    $rootScope.root_takePayment_payment_listing_area = function(data) {   
        if (data.paymentMethod === $rootScope.paymentGateWayNames.ab) {
            if ($scope.isPaymentListingPage) {
                $scope.changeStatus($scope.selectedRow.addressId);
            } else {
                $scope.changeStatus($scope.addressId);
            }
            $scope.getCustomerPaymentList($scope.paymentId); 
        } else {
            $scope.takePayment($scope.modelCachedForPayment, data);        
        }       
    }
    $scope.takePayment = function(model, data, node='', autoSave=false){  
        lastPaymentApiHit = false;    
        if (!$scope.index || $scope.index == -1 || $scope.index == null) {
            $scope.index = $scope.paymentList.findIndex(item => item.id == model.id);
        }
        if(node && $scope.paymentList[$scope.index][node] == model[node]){
            return false;
        }
        if(!model.paymentMethod && model.type != "Account Credit"){

            $scope.paymentError = {error:['Please select payment method']};
            
            setTimeout(function() {
                $scope.paymentError = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);
            return false;
           
        }
        let postData = {};
        let obj = [];


        model.amount =  model.amount.toString(); //reverse masking 
        model.amount = model.amount.replace(/\$|,/g, ''); //reverse masking 


        postData = {    
            "transactionType": model.type,
            "amount": model.amount ? model.amount : 0,
            "applyOnNextInvoice": model.applyOnNextInvoice ? 1 : 0,
            "notes":  model.notes,
            "addressId": $scope.addressId,                
        
        };

        if($scope.modeEdit){
            postData.custPayTranId = model.custPayTranId;
        } else {
            if(model.paymentMethod && ['cash', 'check', 'cc', 'ach'].indexOf(model.paymentMethod) == -1 ){
                obj = $scope.paymentProfiles.filter(function(item){           
                    return item.id == model.paymentMethod;
                })
            }
            postData.payment_method = obj.length > 0 ? obj[0].paymentMethod : model.paymentMethod;    
            
            if(obj.length > 0){
                postData.account_profile_id = obj.length > 0 ? obj[0].id : '';
            }
            if(model.paymentMethod && ['cc', 'ach'].indexOf(model.paymentMethod) > -1 ){
                postData.responseCode = 201
                postData.responseText = data
                postData.gatewayTransId = data.id || data.transactionId
                postData.transaction_api_id = data.transaction_api_id

                $scope.multipleClickIssue = true;
                                
                setTimeout(function() {
                    $scope.multipleClickIssue = false;
                    
                }, 2000);  
            }
        }
        
        if(model.paymentMethod && model.paymentMethod =='check'){
            postData.checkNumber = model.checkNumber;
        }
        
        
        if($scope.isPaymentListingPage) {
            postData.addressId = $scope.selectedRow.addressId
        }
        if (!$scope.isPaymentListingPage && $stateParams.addressId != postData.addressId) {
            return
        }       
        if ($scope.modelPaymentData.addressId == '' && !$scope.modeEdit) {
            if (postData.paymentMethod && ['cash', 'check', 'cc', 'ach'].indexOf(postData.paymentMethod) > -1 ) {
                return
            }
        }
        if ((postData.gatewayTransId != undefined && postData.gatewayTransId != null) && $scope.checkDuplicatePaymentGatewayTransIdEntry(postData.gatewayTransId)) {
            console.error('Duplicate payment... API call aborting....')
            return
        } 
        $scope.isProcessing = true; 
        $scope.paymentError = false; 
        $scope.payaErrorMessage = '';
        apiGateWay.send("/customer_payment_transaction",  postData).then(function(response) {
            if (response.data.status == 200) {
                lastPaymentApiHit = true;
                $rootScope.rootTransactionId = response.data.data.custPayTranId;
                $scope.paymentId = Number(response.data.data.custPayTranId);
                $scope.pageObjPaymentLog.currentPage = 1;
                $scope.modelPaymentData.addressId = '';
                if ($scope.isPaymentListingPage) {
                    $scope.changeStatus($scope.selectedRow.addressId);
                } else {
                    $scope.changeStatus($scope.addressId);
                }
                if(model.paymentMethod && ['cash', 'check'].indexOf(model.paymentMethod) == -1 && !$scope.modeEdit){
                    if(response.data.data && !response.data.data.Error){
                        // if Nuvei
                        if (data.paymentMethod == $rootScope.paymentGateWayNames.nuvei) {
                            $scope.transactionId = data.transactionId;
                            if ((model.paymentMethod == 'cc' || model.paymentMethod == 'ach')) {
                                $scope.paymentListingCCDetails = {
                                    account_type: 'Visa',
                                    last_four: data.last4Digits
                                };
                            } else {
                                $scope.paymentListingCCDetails = {
                                    account_type: '',
                                    last_four: ''
                                };
                            } 
                        } 
                        // if Paya
                        else if ((response.data.data.transactionId || response.data.data.gatewayTransId)) {
                            $scope.transactionId = response.data.data.transactionId ? response.data.data.transactionId : response.data.data.gatewayTransId;
                            if ((model.paymentMethod == 'cc' || model.paymentMethod == 'ach')) {
                                $scope.paymentListingCCDetails = {
                                    account_type: response.data.data.responseText.account_type,
                                    last_four: response.data.data.responseText.last_four
                                };
                            } else {
                                $scope.paymentListingCCDetails = {
                                    account_type: '',
                                    last_four: ''
                                };
                            }                            
                        }
                        $scope.getCustomerPaymentList($scope.paymentId); 
                        if(!autoSave){ 
                            setTimeout(function() { $scope.modeEdit = true;}, 500);   
                        }                       
                        if (!$scope.$$phase) $scope.$apply() 
                    } else {
                        if(response.data.data && response.data.data.Error){
                            //$scope.paymentError = {error:[response.data.data.Error]};
                            $scope.payaErrorCode = response.data.data.reason_code_id;
                            $scope.payaErrorMessage = $rootScope.getPayaErrorMessageByReasonCode(response.data.data.reason_code_id ? response.data.data.reason_code_id : 0);
                            $scope.showPayaErrorPopup();
                        } else {
                            $scope.paymentError = {error:['Something went wrong, please try again.']};
                        }                    
                    }  
                } else {

                    $scope.getCustomerPaymentList($scope.paymentId);  
                    $scope.paymentSuccess = true;
                   
                    if(!autoSave){ 
                        setTimeout(function() { $scope.modeEdit = true;}, 500); 
                    }
                    if (!$scope.$$phase) $scope.$apply() 
                }
                
                $scope.multipleClickIssue = true;
                 
                  
                $scope.isProcessing = false; 
                
                setTimeout(function() {
                    $scope.multipleClickIssue = false;
                    
                }, 2000);  

                  
                setTimeout(function() {
                    $scope.paymentError = '';
                    $scope.modelCachedForPayment = null;
                    if (!$scope.$$phase) $scope.$apply()
                }, 2000);             
            } else {    
                lastPaymentApiHit = true;
                $scope.isProcessing = false; 
                $scope.paymentError = {error:[response.data.message]};
                setTimeout(function() {
                    $scope.paymentError = '';
                    if (!$scope.$$phase) $scope.$apply()
                }, 2000);
            }           
        },function(error){
            lastPaymentApiHit = true;
            if(typeof error === 'object' && error.Error){ 
                $scope.paymentError = error.Error;
            } else {
                $scope.paymentError = {error:[error]};
            }
            $scope.isProcessing = false;
            setTimeout(function() {
                $scope.paymentError = '';
                if (!$scope.$$phase) $scope.$apply()
            }, 2000);                      
        });
              
    }
    //Get Payment Profile
    $scope.getPaymentProfile = function(){  
        $scope.isProcessing = true; 
        $scope.paymentProfiles = [];       
        var _customerId = $scope.$parent.customerId   
        if ($scope.isPaymentListingPage) {
            _customerId = $scope.selectedRow.customerId;
        }     
       if (!_customerId) {
        _customerId = $scope.customerinfo.customer.customerId
       }
        apiGateWay.get("/payment_profile",  {customerId: _customerId}).then(function(response) {
            if (response.data.status == 200) { 
                $scope.paymentProfiles = response.data.data; 
            } else {    
                $scope.paymentProfiles = [];   
                $scope.errorMsg = response.data.message;
            }            
            $scope.isProcessing = false; 
        }, function(error){
            $scope.isProcessing = false; 
            $scope.paymentProfiles = []; 
        })
    }
    $scope.paymentGatewayTransIdCached = []
    $scope.checkDuplicatePaymentGatewayTransIdEntry = function(gatewayTransId) {
        let isDuplicate = false;
        if ($scope.paymentGatewayTransIdCached.length == 0) {
            $scope.paymentGatewayTransIdCached.push(gatewayTransId)
            isDuplicate = false;
        } else {
            if ($scope.paymentGatewayTransIdCached.includes(gatewayTransId)) {
                isDuplicate = true;
            } else {
                $scope.paymentGatewayTransIdCached.push(gatewayTransId)
                isDuplicate = false;
            }
        }
        return isDuplicate;
    } 
    //Refund
    $scope.refundPaymentConfirm = function(refundText){    

        let templateModel = ($scope.modelPaymentData.applied == 1 ||  $scope.modelPaymentData.applied == 2) ? "infoPaymentPopup.html" : refundText != 'VOID' ? 'refundPaymentPopup.html' : 'voidPaymentPopup.html';

        ngDialog.open({
            template: templateModel,
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function () {   
              $scope.model = '';    
            }
        });
    } 
   
    $scope.refundAction = function(){  
        $scope.isProcessing = true; 
        $scope.isRefundProcessing = true;
        let postData = {
            amount:  $scope.modelRefund.amount,
            custPayTranId: $scope.paymentData.id,
            refundType : $scope.refundText
        }

        $scope.errorMsgRefund = ''; 
        $scope.successMsgRefund = '';
        apiGateWay.send("/refund_customer_payment_transaction", postData).then(function(response) {
            if (response.data.status == 200) { 
                $scope.successMsgRefund =  response.data.message;
                $scope.getCustomerPaymentList(); 
                ngDialog.closeAll();
                setTimeout(function() {                                    
                    $scope.successMsgRefund ='';
                    
                    if (!$scope.$$phase) $scope.$apply()              
                }, 1000); 
            } else {    
                $scope.errorMsgRefund = response.data.message;
                setTimeout(function() {       
                    $scope.errorMsgRefund = '';
                    if (!$scope.$$phase) $scope.$apply()              
                }, 1000); 
                
            }            
            $scope.isProcessing = false;
            $scope.isRefundProcessing = false; 
        }, function(error){
            $scope.errorMsgRefund = error
            setTimeout(function() {       
               
                $scope.errorMsgRefund = '';
                if (!$scope.$$phase) $scope.$apply()              
            }, 1000); 
           
            $scope.isProcessing = false;
            $scope.isRefundProcessing = false; 
        })
    }
    //


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
    // 
    $scope.selectPaymentType = function(value){
      $scope.selectedPaymentMethod = '';
      $scope.modelPaymentData.paymentMethod = '';
      $scope.modelPaymentData.type = value;
      $scope.modelPaymentData.payaStatus = $rootScope.customerBillingData.payaStatus;
    }
    // select Logs For Edited Payment/Credit Amount
    $scope.amountUpdateHistoryById = function(id){
        let tooltip = '';
        let logs = $scope.amountUpdateLogs.filter(function(item){
            return item.custPayTransId == id;            
        });       
        if(logs.length > 0){         
            angular.forEach(logs, function(item, index){           
                if(index == 0){ 
                    tooltip += 'Original Amount '+$filter('currency')(item.existValue);
                }
                if(item.custPayTransId == id){
                    tooltip += '<br />Changed to '+$filter('currency')(item.value)+' by '+item.firstName+' '+item.lastName+' - '+$filter('convertDateOffset')(item.createTime, $scope.companyTimeZone, 'MM/dd/yyyy');
                } 
            })
        }
        return tooltip;
        
      }
    var lastPLAPIHit = 0;
    var lastPLAPIHitDelay = 20; 
    $scope.UpdatePaymentDate = function(value){
        if (lastPLAPIHit >= (Date.now() - lastPLAPIHitDelay)) {
            return;
        } else {
            lastPLAPIHit = Date.now();
            $scope.paymentDate = $filter('date')(new Date(value.target.value), 'yyyy-MM-dd');
            let updatePaymentDate = {
                customerId: $scope.$parent.customerId,  
                addressId: $scope.addressId, 
                custPayTranId: $scope.modelPaymentData.custPayTranId, 
                qboTxnDate: $scope.paymentDate
            }
            if($scope.isPaymentListingPage) {
                updatePaymentDate.addressId = $scope.selectedRow.addressId
                updatePaymentDate.customerId = $scope.selectedRow.customerId
            }
            apiGateWay.send("/Update_Payment_Date", updatePaymentDate).then(function(response) {
                if (response.status == 200) {
                    $scope.getCustomerPaymentList($scope.modelPaymentData.custPayTranId);
                } 
            })
        }        
    }
    
    $scope.exportPaymentReportEmailModel = {
        email: ''
    }
    $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail;    
    $scope.downloadPaymentReport = function() {
        $scope.showEmailInvoiceOpenPopup();
    }
    $scope.showEmailInvoiceOpenPopup = function(){
        $scope.exportPaymentReportEmailModel.email = $scope.companyEmailforReports; 
        $scope.showEmailInvoiceOpenPopupModal = ngDialog.open({
            template: 'sentReportEmailPopupReportPage.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.exportPaymentReportStyleType = '';
                $scope.exportPaymentReportEmailModel.email = $scope.companyEmailforReports;                
            }
            });
    }
    $scope.reportPageErrorMsg = '';
    $scope.sendPaymentReport = function() {
        $scope.exportPaymentReportisSending = true;
        var sendReportParams = {
            email: $scope.exportPaymentReportEmailModel.email,
            reportType: 'paymentReport',
        }
        apiGateWay.send('/send_email_reports', sendReportParams).then(function(response) {
            if (response.data.status == 200 && response.data.data.reportId) {
                $scope.exportPaymentReportGenerateProcessStart = true;
                var params = $scope.exportPaymentReportParams;
                params.reportId = response.data.data.reportId;
                $scope.generateReportByReportId(params);
                setTimeout(function(){
                    $scope.exportPaymentReportGenerateProcessStart = false;
                    $scope.exportPaymentReportisSending = false;                       
                    $scope.showEmailInvoiceOpenPopupModal.close();
                }, 2000)
            } else {
                $scope.reportPageErrorMsg = 'Some error occured. Please try again.';
                setTimeout(function(){
                    $scope.reportPageErrorMsg = '';
                }, 2000)
            }                     
        }, function(error){
            $scope.reportPageErrorMsgMsg = typeof error == 'string' ? error : 'Something went wrong.';
            setTimeout(function(){
                $scope.reportPageErrorMsg = '';
            }, 2000)
            $scope.exportPaymentReportisSending = false;
        });
    }
    $scope.generateReportByReportId = function(params) {       
        delete params.length     
        delete params.page     
        var apiURL = '/payment_transaction_report';
        apiGateWay.get(apiURL, params).then(function(response) {
            // Report sent
        }, function(error){
        });
    }
    $scope.paymentListingCCDetails = {
        account_type: '',
        last_four: ''
    };
    $scope.getCCDetails = (transactionId) => {
        $scope.paymentListingCCDetails = {
            account_type: '',
            last_four: ''
        };
        $scope.isProcessing = true;
        apiGateWay.get('/get_data_from_transactionId', { transactionId: transactionId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.paymentListingCCDetails = {
                    account_type: response.data.data.data.account_type ? response.data.data.data.account_type : '',
                    last_four: response.data.data.data.last_four ? response.data.data.data.last_four : '',
                };      
            } 
            $scope.isProcessing = false;            
        }, function(error){
            $scope.isProcessing = false;
        });   
    }
    $rootScope.rootGetCustomerPaymentList = () => {
        $scope.getCustomerPaymentList();
    }
    $scope.openPaymentAuditLog = function() {
        ngDialog.open({
          template: 'paymentAuditPopup.html',
          className: 'ngdialog-theme-default',
          scope: $scope,          
      });     
    };
    
    $scope.getPaymentAuditLogs = function() {
        $scope.paymentLogLoading = true;
        var _customerId = $scope.$parent.customerId   
        if ($scope.isPaymentListingPage) {
            _customerId = $scope.selectedRow.customerId;
        }     
       if (!_customerId) {
        _customerId = $scope.customerinfo.customer.customerId
       }
        let jobParam = {
            offset: $scope.pageObjPaymentLog.currentPage - 1,
            limit: $scope.pageObjPaymentLog.limitInv,
            sortOrder: $scope.dirInv,
            sortColumn: $scope.columnInv,
            addressId: $scope.addressId,
            paymentId: $scope.paymentId,
            customerId: _customerId
        };
        apiGateWay.get("/get_payment_audit_logs", jobParam).then(function(response) {
            if (response.data.status == 200) {
                $scope.paymentLogLoading = false;                
                let paymentAuditResponse = response.data.data;
                $scope.paymentAuditList = $rootScope.getShortLastNames(paymentAuditResponse.data);
                $scope.pageObjPaymentLog.totalRecord = paymentAuditResponse.rows;
                $scope.pageObjPaymentLog.totalPage = $scope.pageObjPaymentLog.totalRecord > 0 ? Math.ceil($scope.pageObjPaymentLog.totalRecord / $scope.pageObjPaymentLog.limitInv) : 0; 
            } else {
                $scope.paymentLogLoading = false;
            }
        }, function(error){
            $scope.paymentLogLoading = false;
        });
    }
    $scope.goToPaymentAuditListPage = function(page) {
        $scope.pageObjPaymentLog.currentPage = page;
        $scope.getPaymentAuditLogs();
    };
});
