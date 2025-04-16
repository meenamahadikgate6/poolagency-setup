angular.module('POOLAGENCY')

.controller('invoicePaymentAppliedListController', function($rootScope, $scope, apiGateWay, $timeout, auth,$state,$stateParams, configConstant, pendingRequests) {   
    //app.customerdetail //app.customerinvoicedetail
    var currEnvironment = configConstant.currEnvironment;
    var apiUrl = configConstant[currEnvironment].server;
    let endpointTop;
    let endpointBottom;
    $scope.parentPage = $state.current.name ? $state.current.name : '';  
    $scope.balanceDue = 0;
    $rootScope.invoiceEditable = true;
    $scope.$watch('$parent.invoiceDetails.balanceDue',(newVal, oldVal)=>{        
        if($scope.parentPage == 'app.customerinvoicedetail'){
            if(newVal != oldVal){
                $scope.balanceDue = $scope.$parent.invoiceDetails.balanceDue;
            }
        }        
    })
  
    $scope.invoiceId = $stateParams.invoiceId ? $stateParams.invoiceId : '';
    $scope.companyTimeZone = auth.getSession() ? auth.getSession().timeZone : ''; 
    $scope.pageObj = { 
        top: {
            currentPage: 1,
            page: '',
            limit: 5,
            totalRecord: '',
            totalPage: '',
            dir: 'asc',  
            column: $scope.parentPage == 'app.customerinvoicedetail' ? 'createTime' : 'createdOn',
            fromDate: '',
            toDate: '',
            searchText:'',
            searchTextModel:''
        },
        bottom:{
            currentPage: 1,
            page: '',
            limit: 5,
            totalRecord: '',
            totalPage: '',
            dir: 'asc',  
            column: $scope.parentPage == 'app.customerinvoicedetail' ? 'createTime' : 'createdOn',
            fromDate: '',
            toDate: '',
            searchText:'',
            searchTextModel:''
        } 
    }
    
    $scope.invoiceData = {
        top:{},
        bottom:{}
    };
    $scope.$on("$destroy", function () {
        $rootScope.rootTransactionId = '';
    })
    $scope.getInvoiceData = (type) => {
        if (type == 'top') {
            $scope.getInvoiceDataTop();
        }
        if (type == 'bottom') {
            $scope.getInvoiceDataBottom();
        }
    }
    $scope.$on('refreshPaymentData', function(e) {  
        $scope.getInvoiceData('top')     
        $scope.getInvoiceData('bottom')     
    });
    $scope.$on('refreshTopDataStatus', function(e) {  
        $scope.refreshTopDataStatus();    
    });    
    $scope.refreshTopDataStatus = () => {
        if ($rootScope.resDataTop) {                    
            if ($rootScope.resDataTop.total > 0) {                        
                $rootScope.rs_existPaymentValue = true;                        
            }            
        }
    }
    $scope.getInvoiceDataTop = (alongWithBottom=false) => {
        let type = 'top';
        $scope.isProcessing = true;
        let postData = {
            transactionId: $rootScope.rootTransactionId,
            searchText: $scope.pageObj[type].searchText ? $scope.pageObj[type].searchText : '', 
            offset: $scope.pageObj[type].currentPage - 1,
            limit: $scope.pageObj[type].limit,
            sortOrder: $scope.pageObj[type].dir,
            sortColumn: $scope.pageObj[type].column, 
            invoiceId: $scope.invoiceId
        };
        $scope.pageObj[type].page = $scope.pageObj[type].currentPage        
        let _apiName = '/unpaid_invoice_list';
        if(type == 'top'){
            _apiName = '/payment_applied_invoice_list';
        }
        if($scope.parentPage == 'app.customerinvoicedetail'){
            _apiName = '/unapplied_payment_list';
            $rootScope.invoiceEditable = true;
            if(type == 'top'){
                _apiName = '/applied_payment_list';
            }
        }
        endpointTop = _apiName;
        let canAPIHit;
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpointTop) {                    
                    canAPIHit = false;
                } else {
                    canAPIHit = true;
                }
            })
        } else { 
            canAPIHit = true;                 
        }
        if (canAPIHit) {
            apiGateWay.get(_apiName, postData).then(function(response) {
                if (response.data.status == 200) {                            
                    $scope.invoiceData[type] = response.data.data;  
                    $scope.pageObj[type].totalRecord = $scope.invoiceData[type].total; //paymentListResponse.rows;                
                    $scope.pageObj[type].totalPage = ($scope.pageObj[type].totalRecord % $scope.pageObj[type].limit) !== 0 ? parseInt($scope.pageObj[type].totalRecord / $scope.pageObj[type].limit) : parseInt(($scope.pageObj[type].totalRecord / $scope.pageObj[type].limit)) - 1; 
                    $scope.$emit('child', {total:response.data.data.total, type : type}); // going up!
                    angular.forEach(response.data.data.list, (element, index) => {
                        if(element && type == 'top'){
                            $rootScope.invoiceEditable = false;
                        }
                    });
                } else {
                    $scope.invoiceData[type].list = [];
                    $scope.invoiceData[type].total = 0;
                }      
                if (alongWithBottom) {
                    $scope.isProcessing = true;
                    setTimeout(function(){
                        $scope.getInvoiceData('bottom');
                    }, 200)
                } else {
                    $scope.isProcessing = false;
                }      
            },function(error){
                $scope.invoiceData[type].list = [];
                $scope.invoiceData[type].total = 0;
                $scope.isProcessing = false;
            }); 
        }
    }     
    $scope.getInvoiceDataBottom = () => {
        let type = 'bottom';
        $scope.isProcessing = true;
        let postData = {
            transactionId: $rootScope.rootTransactionId,
            searchText: $scope.pageObj[type].searchText ? $scope.pageObj[type].searchText : '', 
            offset: $scope.pageObj[type].currentPage - 1,
            limit: $scope.pageObj[type].limit,
            sortOrder: $scope.pageObj[type].dir,
            sortColumn: $scope.pageObj[type].column, 
            invoiceId: $scope.invoiceId
        };
        $scope.pageObj[type].page = $scope.pageObj[type].currentPage        
        let _apiName = '/unpaid_invoice_list';
        if(type == 'top'){
            _apiName = '/payment_applied_invoice_list';
        }
        if($scope.parentPage == 'app.customerinvoicedetail'){
            _apiName = '/unapplied_payment_list';
            $rootScope.invoiceEditable = true;
            if(type == 'top'){
                _apiName = '/applied_payment_list';
            }
        }
        endpointBottom = _apiName;
        let canAPIHit;
        var pr = pendingRequests.get();        
        if (pr.length > 0) {
            pr.forEach(function(r){
                if (r.url === apiUrl + endpointBottom) {                    
                    canAPIHit = false;
                } else {
                    canAPIHit = true;
                }
            })
        } else { 
            canAPIHit = true;                 
        }
        if (canAPIHit) {
            apiGateWay.get(_apiName, postData).then(function(response) {
                if (response.data.status == 200) {             
                    $scope.invoiceData[type] = response.data.data;  
                    $scope.pageObj[type].totalRecord = $scope.invoiceData[type].total; //paymentListResponse.rows;                
                    $scope.pageObj[type].totalPage = ($scope.pageObj[type].totalRecord % $scope.pageObj[type].limit) !== 0 ? parseInt($scope.pageObj[type].totalRecord / $scope.pageObj[type].limit) : parseInt(($scope.pageObj[type].totalRecord / $scope.pageObj[type].limit)) - 1; 
                    $scope.$emit('child', {total:response.data.data.total, type : type}); // going up!
                    angular.forEach(response.data.data.list, (element, index) => {
                        if(element && type == 'top'){
                            $rootScope.invoiceEditable = false;
                        }
                    });
                } else {
                    $scope.invoiceData[type].list = [];
                    $scope.invoiceData[type].total = 0;
                }            
                $scope.isProcessing = false;
            },function(error){
                $scope.invoiceData[type].list = [];
                $scope.invoiceData[type].total = 0;
                $scope.isProcessing = false;
            }); 
        }

       
    } 
    $scope.goToListPage = (page, type) => {
        $scope.pageObj[type].currentPage = page;
        $scope.getInvoiceData(type);        
    };
    $scope.orderByJobList = (column, type) => {
        $scope.pageObj[type].column = column;
        $scope.pageObj[type].dir = ($scope.pageObj[type].dir == 'desc') ? 'asc' : 'desc';
        $scope.getInvoiceData(type);
    };
    $scope.doSearchList = (searchTextModel, type) => {
        if(searchTextModel || $scope.pageObj[type].searchText != searchTextModel){
            $scope.pageObj[type].currentPage = 1;
            $scope.pageObj[type].searchText = searchTextModel.trim().replace(/,/g, "");       
            $scope.getInvoiceData(type);
        } 
    };
    //add payment
    $scope.moveRow = (obj, type, payment) => {
        if (payment === 'payment' && $scope.parentPage !== 'app.customerinvoicedetail') {
            payment = 'Payment'
        }
        $scope.isProcessing = true;
        let postData = {
            transactionId:$rootScope.rootTransactionId,
            invoiceId:obj.id,      
            action: payment    
        };  
        let apiURL = '/apply_payment_invoice_v2'
        if(type == 'top'){
            postData.paymentId = obj.paymentId
            apiURL ='/remove_payment_invoice_v2'
        }        
        if($scope.parentPage == 'app.customerinvoicedetail'){
            postData.invoiceId = $scope.invoiceId;
            postData.transactionId = obj.id;
        }
        let syncPaymentPayload = {};
        syncPaymentPayload.invoiceId = postData.invoiceId;
        syncPaymentPayload.transactionId = postData.transactionId;
        $rootScope.resDataTop = {};
        apiGateWay.send(apiURL, postData).then(function(response) {
                if (response.data.status == 200) {  
                    $scope.pageObj['top'].currentPage = 1;     
                    $scope.pageObj['bottom'].currentPage = 1; 
                    if($scope.parentPage != 'app.customerinvoicedetail'){
                        $scope.invoiceData['top'].list = [];
                        $scope.invoiceData['top'].total = 0;
                        $scope.invoiceData['top'] = response.data.data.applyInvoiceDetailsData;  
                        $scope.pageObj['top'].totalRecord = $scope.invoiceData['top'].total; //paymentListResponse.rows;                
                        $scope.pageObj['top'].totalPage = ($scope.pageObj['top'].totalRecord % $scope.pageObj['top'].limit) !== 0 ? parseInt($scope.pageObj['top'].totalRecord / $scope.pageObj['top'].limit) : parseInt(($scope.pageObj['top'].totalRecord / $scope.pageObj['top'].limit)) - 1; 
                        // bottom data
                        $scope.invoiceData['bottom'].list = [];
                        $scope.invoiceData['bottom'].total = 0;
                        $scope.invoiceData['bottom'] = response.data.data.unapplyInvoiceDetailsData;  
                        $scope.pageObj['bottom'].totalRecord = $scope.invoiceData['bottom'].total; //paymentListResponse.rows;                
                        $scope.pageObj['bottom'].totalPage = ($scope.pageObj['bottom'].totalRecord % $scope.pageObj['bottom'].limit) !== 0 ? parseInt($scope.pageObj['bottom'].totalRecord / $scope.pageObj['bottom'].limit) : parseInt(($scope.pageObj['bottom'].totalRecord / $scope.pageObj['bottom'].limit)) - 1; 
                        
                    }                    
                    if($scope.parentPage == 'app.customerinvoicedetail'){
                        $scope.$parent.customerTaxData.addTaxButton = true;
                        $scope.$parent.customerDiscountData.addDiscountButton = true;
                        $scope.$parent.parseInvoiceData(false, false, response.data.data.InvoiceDetailsData);                                   
                    } else {                        
                        // update payment data
                        // $scope.$parent.paymentListResponse.data[$scope.$parent.index] = response.data.data.paymentDetailsData;
                        let paymentDetails = response.data.data.paymentDetailsData;
                        $scope.$parent.modelPaymentData.amountApplied = paymentDetails.amountApplied;
                        $scope.$parent.modelPaymentData.amountUnApplied = paymentDetails.amountBalance;
                        $scope.$parent.modelPaymentData.applied = paymentDetails.applied;
                        $scope.$parent.modelPaymentData.custPayTranId = paymentDetails.id;
                        $scope.$parent.modelPaymentData.createTime = paymentDetails.createTime;
                        $scope.$parent.modelPaymentData.last_four = paymentDetails.last_four;
                        $scope.$parent.modelPaymentData.account_type = paymentDetails.account_type;
                        $scope.$parent.modelPaymentData.paymentMethod = paymentDetails.paymentMethod; 
                        $scope.$parent.modelPaymentData.id = paymentDetails.id; 
                        $rootScope.rootTransactionId = paymentDetails.id;  
                        $scope.$parent.modelPaymentData.transactionStatus = paymentDetails.transactionStatus;
                        $scope.$parent.paymentData = angular.copy(paymentDetails);
                        $scope.$parent.modelRefund.amount =  angular.copy(paymentDetails.amount);         
                        if (!$scope.$parent.isPaymentListingPage) {
                            $scope.$parent.amountHistoryTooltip = $scope.amountUpdateHistoryById(paymentDetails.id);          
                        }
                        // update payment data
                        $scope.$parent.getCustomerPaymentList(true);
                    }
                    apiGateWay.send('/sync_payment', syncPaymentPayload).then(function(response) {})
                    if($scope.parentPage == 'app.customerinvoicedetail'){
                        // 
                        $scope.pageObj['top'].page = $scope.pageObj['top'].currentPage;
                        let resDataTop = response.data.data.applyPaymentDetailsDate;
                        $rootScope.resDataTop = resDataTop;
                        $scope.invoiceData['top'] = resDataTop;  
                        $scope.pageObj['top'].totalRecord = $scope.invoiceData['top'].total; //paymentListResponse.rows;                
                        $scope.pageObj['top'].totalPage = ($scope.pageObj['top'].totalRecord % $scope.pageObj['top'].limit) !== 0 ? parseInt($scope.pageObj['top'].totalRecord / $scope.pageObj['top'].limit) : parseInt(($scope.pageObj['top'].totalRecord / $scope.pageObj['top'].limit)) - 1; 
                        $scope.$emit('child', {total:resDataTop.total, type : 'top'}); // going up!                      
                        if (resDataTop.total == 0) {                        
                            $scope.$parent.existPaymentValue = false;
                            $rootScope.invoiceEditable = true;
                            $rootScope.rs_existPaymentValue = false;                        
                        } else {                        
                            $scope.$parent.existPaymentValue = true;
                            $rootScope.invoiceEditable = false;
                            $rootScope.rs_existPaymentValue = true;                        
                        }       
                        // 
                        // 
                        $scope.pageObj['bottom'].page = $scope.pageObj['bottom'].currentPage;
                        let resDataBottom = response.data.data.unapplyPaymentDetailsData;
                        $scope.invoiceData['bottom'] = resDataBottom;  
                        $scope.pageObj['bottom'].totalRecord = $scope.invoiceData['bottom'].total; //paymentListResponse.rows;                
                        $scope.pageObj['bottom'].totalPage = ($scope.pageObj['bottom'].totalRecord % $scope.pageObj['bottom'].limit) !== 0 ? parseInt($scope.pageObj['bottom'].totalRecord / $scope.pageObj['bottom'].limit) : parseInt(($scope.pageObj['bottom'].totalRecord / $scope.pageObj['bottom'].limit)) - 1; 
                        $scope.$emit('child', {total:resDataBottom.total, type : 'bottom'}); // going up!                    
                        //                     
                    }

                } else {
                    $scope.error = response.data.message;
                    setTimeout(()=>{
                        $scope.error = ''
                        if (!$scope.$$phase) $scope.$apply(); 
                    }, 3000)
                }            
                $scope.isProcessing = false;
            },function(error){
                $scope.error = error;
                $timeout(()=>{
                    $scope.error = ''
                    if (!$scope.$$phase) $scope.$apply(); 
                }, 3000)
                $scope.isProcessing = false;
        }); 
    } 
})