angular.module('POOLAGENCY')

.controller('customerQuotesListController', function($rootScope, $scope, apiGateWay, $timeout, $filter, $stateParams, $state, ngDialog, auth) { 
    $scope.addressId = $stateParams.addressId || $stateParams.technicianId; 
    $scope.pageObj =  {
        currentPageInv: 1,
        pageInv: '',
        limitInv: 10,
        totalRecordInv: '',
        totalPageInv: ''        
    }
    $scope.isSingleListingPage = false;
    $scope.isFrameSection = false;
    $scope.isAllQuotesSelected = false;
    $scope.allQuotesSelected = () => {
        $scope.pageObj.currentPageInv = 1;
        $scope.isAllQuotesSelected = true;
        $scope.selectedInvStatus = ['open','approved','denied','closed'];
        $scope.getCustomerInvoiceList();
    }
    $scope.dirInv = 'desc';
    $scope.columnInv = 'createdOn';
    $scope.isProcessing = false;
    $scope.invDate = {
        fromDate:"",
        toDate:""
    }
    $scope.invoiceList = []; 
    $scope.showAllPropertiesInvoice = {value:0};
    $scope.selectedInvStatus = ['open','approved','denied','closed'];
    $scope.statusCount = [];
    $scope.invoiceStatus = {'open':true, 'approved': true,'denied': true, 'closed': true} 
    $scope.searchInvoiceTextKey = '';
    $scope.convertDateOffset = '';
    $scope.rangeFilterData = [
        { title: '1 MONTH', value: '1 month' },
        { title: '90 DAYS', value: '90 days' },
        { title: '6 MONTHS', value: '6 months' },
        { title: '1 YEAR', value: '1 year' },
        { title: 'CUSTOM', value: 'custom' },
    ]
    $scope.selectedFilterRange = '90 days';
    $scope.selectedFilterRangeTitle = '90 DAYS';
    $scope.$watch('custAddrDetailsData', function (newVal, oldVal) {     
        if(newVal && newVal != oldVal){ 
          $scope.customerData = angular.copy($rootScope.custAddrDetailsData);  
        }
      }, true);
      $scope.$watch('listingTab.quotes', function (newVal, oldVal) {     
        if (newVal && ($state.current.name !== "app.quotelistingSingle")) {            
            $scope.initFrameSection();
            $scope.getCustomerInvoiceList(); 
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
    $scope.filterRange = function(p) {
        $scope.selectedFilterRange = p.value;
        $scope.selectedFilterRangeTitle = p.title;
        $scope.pageObj.currentPageInv = 1;
        if (p.value != 'custom') {
            $scope.getCustomerInvoiceList();
        }
        else{
            $scope.invDate.fromDate = '';
            $scope.invDate.toDate = '';
        }
    }
    $scope.clickDate = function(event) {
        angular.element(document.getElementsByClassName('currentDateCalendar')).removeClass('currentDateCalendar');
        angular.element(event.target.parentNode).addClass('currentDateCalendar');
    }
    $scope.filterByDate = function(p) {
        if ($scope.invDate.fromDate != '' && $scope.invDate.toDate != '') {
            let fromDate = new Date($scope.invDate.fromDate)
            let toDate = new Date($scope.invDate.toDate);
            if (fromDate <= toDate) {
                $scope.pageObj.currentPageInv = 1;
                $scope.getCustomerInvoiceList();
            } else {
                //alert("From date should be smaller than to date");
                if (p == 'fromDate') {
                    $scope.invDate.fromDate = '';
                } else {
                    $scope.invDate.toDate = '';
                }
            }
        } else {
            if ($scope.invDate.fromDate == '' && $scope.invDate.toDate == '') {
                $scope.getCustomerInvoiceList();
            }
        }
    };
    $scope.removeAllSelectedStatus = function () {
        $scope.selectedInvStatus = [];
        $scope.invoiceStatus['open'] = false; 
        $scope.invoiceStatus['approved'] = false; 
        $scope.invoiceStatus['denied'] = false; 
        $scope.invoiceStatus['closed'] = false;
        $scope.isAllQuotesSelected = false;
    }
    $scope.setSelectedStatusForSingleListPage = function (s) {
        $scope.removeAllSelectedStatus();
        $scope.selectedInvStatus = [s];
        $scope.invoiceStatus[s] = true;
    }
    $scope.initFrameSection = function () {
        $scope.isFrameSection = true;
        $scope.isSingleListingPage = false;
        $scope.selectedFilterRange = 'custom';
        $scope.selectedFilterRangeTitle = 'CUSTOM';
    }
    $scope.initSingleListingPage = function() {
        window.scrollTo(0, 0);
        $scope.isFrameSection = false;
        $scope.isSingleListingPage = true;
        $scope.rangeFilterData.unshift(
            { title: '1 WEEK', value: '1 week' }
        );
        if ($rootScope.param_filterDurationQuote) {
            if ($rootScope.param_filterDurationQuote == 'custom') {
                $scope.invDate.fromDate = $rootScope.param_fromDateQuote;
                $scope.invDate.toDate = $rootScope.param_toDateQuote;
            }
            $scope.selectedFilterRange = $rootScope.param_filterDurationQuote;
            $scope.selectedFilterRangeTitle = ($rootScope.param_filterDurationQuote).toUpperCase();
        } else {
            $scope.selectedFilterRange = '1 week';
            $scope.selectedFilterRangeTitle = '1 WEEK';
        }
        if ($rootScope.param_quoteStatus) {
            $scope.setSelectedStatusForSingleListPage($rootScope.param_quoteStatus);
        } else {
            $scope.allQuotesSelected();
        }    
        $scope.getCustomerInvoiceList();
    }
    $scope.getCustomerInvoiceList = function() {
        if ($scope.isSingleListingPage) { 
            $scope.setParamFilters() 
        }
        $scope.isProcessing = true;
        var jobParam = {
            offset: $scope.pageObj.currentPageInv - 1,
            limit: $scope.pageObj.limitInv,
            sortOrder: $scope.dirInv,
            sortColumn: $scope.columnInv,
            status: $scope.selectedInvStatus.join('-'),
            title: $scope.searchInvoiceText,
            // technicianId: $scope.addressId,
            showAllProperties: $scope.showAllPropertiesInvoice.value,
        };
        if($stateParams.technicianId){
            jobParam.technicianId = $scope.addressId;
            jobParam.showAllProperties = 1;
        } 
        if($stateParams.addressId){
            jobParam.addressId = $scope.addressId;            
        }
        
        if ($scope.selectedFilterRange != '') {
            jobParam.duration = $scope.selectedFilterRange
        }
        
        $scope.pageObj.pageInv = $scope.pageObj.currentPageInv;
        if ($scope.selectedFilterRange == 'custom' && $scope.invDate.fromDate != '' && $scope.invDate.toDate != '') {
            jobParam.fromDate = $filter('date')(new Date($scope.invDate.fromDate), 'yyyy-MM-dd');
            jobParam.toDate = $filter('date')(new Date($scope.invDate.toDate), 'yyyy-MM-dd');
        }
        $scope.exportQuotesReportParams = jobParam;
        apiGateWay.get("/quote_list", jobParam).then(function(response) {
            if (response.data.status == 200) {
                let invoiceListResponse = response.data.data;
                $scope.pageObj.totalRecordInv = invoiceListResponse.rows;                
                $scope.pageObj.totalPageInv = $scope.pageObj.totalRecordInv > 0 ? Math.ceil($scope.pageObj.totalRecordInv / $scope.pageObj.limitInv) : 0;
                
                
                $scope.invoiceList = invoiceListResponse.data;
                $scope.invoiceStatusData = invoiceListResponse.statusData;
                // counts func
                var _statusData = [
                    {
                        amount: 0,
                        count: 0,
                        status: "Open"
                    },
                    {
                        amount: 0,
                        count: 0,
                        status: "Approved"
                    },
                    {
                        amount: 0,
                        count: 0,
                        status: "Denied"
                    },
                    {
                        amount: 0,
                        count: 0,
                        status: "Closed"
                    },
                ];
                angular.forEach(invoiceListResponse.statusCount, function(item){
                    if(item.status==='Open') { 
                        _statusData[0].amount = item.amount
                        _statusData[0].count = item.count
                    }
                    if(item.status==='Approved') { 
                        _statusData[1].amount = item.amount
                        _statusData[1].count = item.count
                    }
                    if(item.status==='Denied') { 
                        _statusData[2].amount = item.amount
                        _statusData[2].count = item.count
                    }
                    if(item.status==='Closed') { 
                        _statusData[3].amount = item.amount
                        _statusData[3].count = item.count
                    }
                });             
                $scope.statusCount = _statusData;               
                // counts func
                $scope.totalPageAmount = 0;
                angular.forEach(invoiceListResponse.data, function(item){
                    $scope.totalPageAmount = $scope.totalPageAmount+item.totalAmount;
                });
                $scope.totalAmount = 0;
                angular.forEach(invoiceListResponse.statusData, function(item){
                    $scope.invoiceStatus[item.invoiceStatus.toLowerCase()] = false;
                    if($scope.selectedInvStatus.indexOf(item.invoiceStatus.toLowerCase()) > -1){
                        $scope.totalAmount = $scope.totalAmount+item.invoiceStatusAmount;
                    }
                }); 
                angular.forEach($scope.selectedInvStatus, function(item){                    
                    $scope.invoiceStatus[item] = true;                   
                }); 
                 $scope.companyTimeZone =invoiceListResponse.companyTimeZone;
                $scope.generatePagination();

              
            } else {
                $scope.invoiceList = [];
            }
            $scope.isProcessing = false;
        },function(error){
            $scope.isProcessing = false;
        });
    };
    $scope.goToCustomerInvoiceListPage = function(page) {
        $scope.pageObj.currentPageInv = page;
        $scope.getCustomerInvoiceList();
    };
    $scope.spliceName = function(fullName) {
        if (!fullName || fullName == '') {
            return 'Super Admin'
        }
        var _fullNameArr = fullName.trim().split(' ');
        var _firstName = _lastName = '';
        _firstName = fullName;
        if(_fullNameArr.length > 1) {
            _firstName = _fullNameArr.slice(0, -1).join(' ');
            _lastName = _fullNameArr[_fullNameArr.length - 1];
            _lastName = _lastName.charAt(0) + '.';
        }
        return _firstName + ' ' + _lastName
    }
    $scope.goToInvoiceDetail = function(obj) {        
        if (event.ctrlKey || event.metaKey){
            var url = "/app/customerquotesdetail/"+obj.id;
            window.open(url,'_blank');
        }else{
            $state.go("app.customerquotesdetail",{"quoteId":obj.id}, {reload: true});
        } 
    };

    $scope.orderByJobList = function(columnInv) {
        $scope.columnInv = columnInv;
        $scope.dirInv = ($scope.dirInv == 'desc') ? 'asc' : 'desc';
        $scope.getCustomerInvoiceList();
    };

    $scope.filterByStatus = function(node) {
        $scope.pageObj.currentPageInv = 1;
        $scope.isAllQuotesSelected = false;
        let type = node.toLowerCase();
        if ($scope.isSingleListingPage) {
            $scope.setSelectedStatusForSingleListPage(type);
            $scope.getCustomerInvoiceList();
            return
        }
        let allFilterRemoved = Object.entries($scope.invoiceStatus).filter(function(item){
             return item[1] == true})
             //let numberOfNullStatus = $scope.invoiceStatusData.filter(function(item){return item.invoiceStatusCount && $scope.selectedInvStatus.indexOf(item.invoiceStatus.toLowerCase()) > -1})  
        if(allFilterRemoved.length > 1 || !$scope.invoiceStatus[type]){
            $scope.invoiceStatus[type] = !$scope.invoiceStatus[type];        
            const index = $scope.selectedInvStatus.indexOf(type);
            if(index > -1) {
                $scope.selectedInvStatus.splice(index, 1)
            }else {
                $scope.selectedInvStatus.push(type);
            }                                                                         
            //$scope.selectedInvStatus = 'paid-past due-awaiting payment';
            $scope.pageObj.currentPageInv = 1;
            $scope.getCustomerInvoiceList();
        }
        
    };
    $scope.showListingTab = function(tab){        
            angular.forEach(Object.entries($scope.listingTab), function(item){
                $scope.listingTab[item[0]] = false;
            })
            $rootScope.listingTab[tab]=true; 
            
      }
      $scope.generatePagination = function(){         
          $scope.pageItem = []
          for(let i=1; i <= $scope.pageObj.totalPageInv; i++){
            $scope.pageItem.push(i);
          }
      }
      $scope.doSearchInvoiceList = function($event,searchInvoiceTextKey) {
        //if ($event.target.value || $scope.customerList.length ==0) {
            if(searchInvoiceTextKey || $scope.searchInvoiceText != searchInvoiceTextKey){
                $event.target.blur();
                $scope.currentPage = 1;
                $scope.pageObj.currentPageInv = 1;
                $scope.searchInvoiceText = searchInvoiceTextKey.trim().replace(/,/g, "");        
                $scope.getCustomerInvoiceList();
            }
           
        
        //}
    };
    $scope.setParamFilters = function() {
        $rootScope.param_quoteStatus = $scope.selectedInvStatus[0];
        $rootScope.param_filterDurationQuote = $scope.selectedFilterRange;
        $rootScope.param_fromDateQuote = $scope.invDate.fromDate;
        $rootScope.param_toDateQuote = $scope.invDate.toDate;
    }
    $scope.downloadQuotesReport = function() {
        $scope.showEmailQuotesOpenPopup();
    }
    $scope.exportQuotesReportEmailModel = {
        email: ''
    }
    $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail;
    $scope.exportQuotesReportParams = {};
    $scope.showEmailQuotesOpenPopup = function(){
        $scope.exportQuotesReportEmailModel.email = $scope.companyEmailforReports; 
        $scope.showEmailQuotesOpenPopupModal = ngDialog.open({
            template: 'sentReportEmailPopupReportPage.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.exportQuotesReportEmailModel.email = $scope.companyEmailforReports;                
            }
            });
    }
    $scope.reportPageErrorMsg = '';
    $scope.sendQuotesReport = function() {
        $scope.exportQuotesReportisSending = true;
        var sendReportParams = {
            email: $scope.exportQuotesReportEmailModel.email,
            reportType: 'QuoteReport'
        }
        apiGateWay.send('/send_email_reports', sendReportParams).then(function(response) {
            if (response.data.status == 200 && response.data.data.reportId) {
                $scope.exportQuotesReportGenerateProcessStart = true;
                var params = $scope.exportQuotesReportParams;
                params.reportId = response.data.data.reportId;
                $scope.generateReportByReportId(params);
                setTimeout(function(){
                    $scope.exportQuotesReportGenerateProcessStart = false;
                    $scope.exportQuotesReportisSending = false;                       
                    $scope.showEmailQuotesOpenPopupModal.close();
                }, 2000)
            } else {
                $scope.reportPageErrorMsg = 'Some error occured. Please try again.';
                setTimeout(function(){
                    $scope.reportPageErrorMsg = '';
                }, 2000)
            }                     
        }, function(error){
            $scope.reportPageErrorMsg = typeof error == 'string' ? error : 'Something went wrong.';
            setTimeout(function(){
                $scope.reportPageErrorMsg = '';
            }, 2000)
            $scope.exportQuotesReportisSending = false;
        });
    }
    $scope.generateReportByReportId = function(params) {       
        var apiURL = '/quotes_report_download';        
        delete params.length;
        delete params.page;
        apiGateWay.get(apiURL, params).then(function(response) {
            // Report sent
        }, function(error){
        });
    }
});