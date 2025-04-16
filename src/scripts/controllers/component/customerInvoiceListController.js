angular.module('POOLAGENCY')

.controller('customerInvoiceListController', function($rootScope, $scope, apiGateWay, $timeout, $filter, $stateParams, $state, ngDialog, auth, $window) { 
    $scope.$window = $window;
    $scope.addressId = $stateParams.addressId; 
    $scope.pageObj =  {
        currentPageInv: 1,
        pageInv: '',
        limitInv: 10,
        totalRecordInv: '',
        totalPageInv: ''        
    }
    $scope.dirInv = 'desc';
    $scope.columnInv = $scope.report_invoiceStatus == 'Upcoming' ? 'qboTxnDate' : 'createdOn';
    $scope.isProcessing = false;
    $scope.invDate = {
        fromDate:"",
        toDate:""
    }
    $scope.invoiceList = []; 
    $scope.showAllPropertiesInvoice = {value:0};
    $scope.selectedInvStatus = ['paid','past due','awaiting payment','partial'];
    $scope.invoiceStatus = {'paid':true, 'past due': true,'awaiting payment': true} 
    $scope.searchInvoiceTextKey = '';
    $scope.convertDateOffset = '';
    $scope.isReportListingPage = false;
    $scope.report_invoiceStatusArr = ['All','Paid','Awaiting Payment','Past Due','Unsent','Upcoming'];
    $scope.report_invoiceStatus = $scope.report_invoiceStatusArr[0];
    $scope.rangeFilterData = [
        { title: '1 WEEK', value: '1 week' },
        { title: '1 MONTH', value: '1 month' },
        { title: '90 DAYS', value: '90 days' },
        { title: '6 MONTHS', value: '6 months' },
        { title: '1 YEAR', value: '1 year' },
        { title: 'CUSTOM', value: 'custom' }
    ]
    $scope.bulkActionsData = [
        { title: 'SEND (EMAIL)', value: 'send' },
        { title: 'MARK AS SENT', value: 'mark as sent' },
        { title: 'MARK AS UNSENT', value: 'mark as unsent' },
        { title: 'DELETE', value: 'delete' },
        { title: 'ADD LINE ITEM', value: 'add line item' },
        { title: 'PRINT', value: 'printed' },
    ]
    $scope.selectedFilterRange = '1 month';
    $scope.selectedFilterRangeTitle = '1 MONTH';
    $scope.initSingleListingPage = function() {
        window.scrollTo(0, 0);
        $scope.isReportListingPage = true;
        if ($rootScope.param_invoiceStatus) {
            $scope.report_invoiceStatus = $rootScope.param_invoiceStatus;
        }
        if ($rootScope.param_filterDurationInvoice) {
            $scope.rangeFilterData.forEach(function(e, i){
                if (e.value === $rootScope.param_filterDurationInvoice) {
                    $scope.selectedFilterRange = e.value;
                    $scope.selectedFilterRangeTitle = e.title;
                }
            })
            if ($rootScope.param_filterDurationInvoice == 'custom') {
                        $scope.invDate.fromDate = $rootScope.param_fromDateInvoice;
                        $scope.invDate.toDate = $rootScope.param_toDateInvoice;
            }          
        }
        $scope.getCustomerInvoiceList(); 
    }
    $scope.$watch('custAddrDetailsData', function (newVal, oldVal) {     
        if(newVal && newVal != oldVal){ 
          $scope.customerData = angular.copy($rootScope.custAddrDetailsData);  
        }  
        
    }, true);
    $scope.$watch('listingTab.invoice', function (newVal, oldVal) { 
        if(newVal) {
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

    $scope.checkIncomingInvoiceDetails = function(){
        apiGateWay.get("/customer_invoice_creation_date", {addressId:$scope.addressId}).then(function(response) {
            if (response.data.status == 200) {
                $scope.incomingInvoiceDetails = response.data.data;
            }
        });
    }

    $scope.exportInvoiceReportParams = {};
    $scope.getCustomerInvoiceList = function() {
        if ($scope.isReportListingPage) {
            $scope.setParamFilters();
        }
        else {
            $scope.checkIncomingInvoiceDetails();
        }
        $scope.isProcessing = true;
        let jobParam = {
            offset: $scope.pageObj.currentPageInv - 1,
            limit: $scope.pageObj.limitInv,
            sortOrder: $scope.dirInv,
            sortColumn: $scope.columnInv,
            status: $scope.selectedInvStatus.join('-'),
            searchText: $scope.searchInvoiceText,
            addressId: $scope.addressId,
            showAllProperties: $scope.showAllPropertiesInvoice.value,
        };
        $scope.pageObj.pageInv = $scope.pageObj.currentPageInv;
        if ($scope.invDate.fromDate != '' && $scope.invDate.toDate != '') {
            jobParam.fromDate = $filter('date')(new Date($scope.invDate.fromDate), 'yyyy-MM-dd');
            jobParam.toDate = $filter('date')(new Date($scope.invDate.toDate), 'yyyy-MM-dd');
        }
        let apiUrl = '/invoices';
        if($scope.isReportListingPage) {
            apiUrl = '/invoice_report_list';
            $scope.jobArray = [];
            $scope.jobArrayGroup = [];
            $scope.invoices = [];
            $scope.jobArrayObj = {};
            $scope.bulkActionProcessing = false;
            let newjobParam = {
                column: jobParam.sortColumn,
                dir: jobParam.sortOrder,
                duration: $scope.selectedFilterRange,
                invoiceStatus: $scope.report_invoiceStatus,
                length: jobParam.limit,
                page: jobParam.offset,
                searchText: $scope.searchInvoiceText,
                showUpcomingInvoice: $scope.report_invoiceStatus=='Upcoming' ? true : $scope.showUpcomingInvoice
            }
            if (newjobParam.duration == 'custom') {
                newjobParam.startDate = jobParam.fromDate;
                newjobParam.endDate= jobParam.toDate;
            }
            jobParam = newjobParam;
            $scope.exportInvoiceReportParams = jobParam;
            // if (jobParam.page == 0) {
            //     $scope.totalAmount = 0;
            //     let jobParamForData = angular.copy(jobParam);
            //     delete jobParamForData.column;
            //     delete jobParamForData.dir;                
            //     delete jobParamForData.length;                
            //     delete jobParamForData.page;                
            //     apiGateWay.get('/invoice_report_data', jobParamForData).then(function(response) {
            //         if (response.data.status == 200) {
            //             $scope.totalAmount = response.data.data.grandTotal;
            //             $scope.pageObj.totalRecordInv = response.data.data.rows;
            //             $scope.pageObj.totalPageInv = $scope.pageObj.totalRecordInv > 0 ? Math.ceil($scope.pageObj.totalRecordInv / $scope.pageObj.limitInv) : 0;
            //         }
            //     })
            // }
        }
        apiGateWay.get(apiUrl, jobParam).then(function(response) {
            if (response.data.status == 200) {
                if ($state.current.name == 'app.invoicelistingSingle') {
                if($scope.report_invoiceStatus == 'Upcoming'){
                    $rootScope.subTitle = 'Upcoming Monthly Invoices';
                }
                else {
                    $rootScope.subTitle = 'Invoices'; 
                }
                }
                let invoiceListResponse = response.data.data;
                $scope.pageObj.totalRecordInv = invoiceListResponse.rows;                
                $scope.pageObj.totalPageInv = $scope.pageObj.totalRecordInv > 0 ? Math.ceil($scope.pageObj.totalRecordInv / $scope.pageObj.limitInv) : 0;                
                $scope.invoiceList = [];
                let invoiceDataFromResponse;
                if ($scope.isReportListingPage) {
                    invoiceDataFromResponse = invoiceListResponse.invoiceListData;
                    $scope.allInvoicesIds = invoiceListResponse.allInvoicesId;
                    $scope.allUpcomingInvoicesIds = invoiceListResponse.upcomingInvoicesId;
                    $scope.allpaidInvoicesIds = invoiceListResponse.paidInvoicesId;  
                } else {
                    invoiceDataFromResponse = invoiceListResponse.data;                    
                } 
                $scope.invoiceList = invoiceDataFromResponse;
                if($scope.invoiceList.length == 0) {
                    $scope.arrayOfIds = [];
                    $scope.selectAll = false;
                }  
                if ($scope.skippedIds) {
                    $scope.invoiceList.forEach(function(item) {
                        item.selected = true;
                    });
                    if ($scope.skippedIds.length > 0) {
                        $scope.invoiceList.forEach(item => {
                            item.selected = !$scope.skippedIds.includes(item.id);
                        });
                    }
                } else if ($scope.arrayOfIds && $scope.arrayOfIds.length > 0) {
                    $scope.invoiceList.forEach(item => {
                        item.selected = $scope.arrayOfIds.includes(item.id);
                    });
                }
                $scope.invoiceStatusData = invoiceListResponse.statusData;
                $scope.totalPageAmount = 0;
                angular.forEach(invoiceDataFromResponse, function(item){
                    $scope.totalPageAmount = $scope.totalPageAmount+item.totalAmount;
                });                 
                $scope.totalAmount = 0;
                if ($scope.isReportListingPage) {
                    $scope.totalAmount = invoiceListResponse.grandTotal
                } else {
                    angular.forEach(invoiceListResponse.statusData, function(item){
                        $scope.invoiceStatus[item.invoiceStatus.toLowerCase()] = false;
                        if($scope.selectedInvStatus.indexOf(item.invoiceStatus.toLowerCase()) > -1){
                            $scope.totalAmount = $scope.totalAmount+item.invoiceStatusAmount;
                        }
                    }); 
                }
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
  
    $scope.goToInvoiceDetail = function(obj) {        
        if (event.ctrlKey || event.metaKey){
            var url = "/app/customerinvoicedetail/"+(obj.id ? obj.id : obj.invoiceId);
            window.open(url,'_blank');
        }else{
            $state.go("app.customerinvoicedetail",{"invoiceId":obj.id ? obj.id : obj.invoiceId}, {reload: true});
        } 
    };

    $scope.orderByJobList = function(columnInv) {
        $scope.columnInv = columnInv;
        $scope.dirInv = ($scope.dirInv == 'desc') ? 'asc' : 'desc';
        $scope.getCustomerInvoiceList();
    };

    $scope.filterByStatus = function(node) {
        let type = node.toLowerCase()
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
                if ($scope.isReportListingPage) {
                    $scope.searchInvoiceText = searchInvoiceTextKey.trim();        
                } else {
                    $scope.searchInvoiceText = searchInvoiceTextKey.trim().replace(/,/g, "");        
                }
                $scope.getCustomerInvoiceList();
            }
           
        
        //}
    };  
    $scope.filterRange = function(p) {
        $scope.arrayOfIds = [];
        $scope.skippedIds = undefined;
        var checkbox = document.getElementById("selectAllCheckbox");
        if (checkbox) {
            checkbox.checked = false;
        }
        $scope.selectedFilterRange = p.value;
        $scope.selectedFilterRangeTitle = p.title;
        $scope.pageObj.currentPageInv = 1;
        if (p.value == 'custom') {
            if ($scope.invDate.fromDate && $scope.invDate.toDate) {
                $scope.getCustomerInvoiceList()
            } else {
                // $scope.invoiceList = []
            }
        } else {
            $scope.getCustomerInvoiceList();
        }
    }

    $scope.showUpcomingInvoice = false;
    $scope.filterByInvReportStatus = function(s, val) {
        $scope.arrayOfIds = [];
        $scope.skippedIds = undefined;
        var checkbox = document.getElementById("selectAllCheckbox");
        if (checkbox) {
            checkbox.checked = false;
        }
        if(val == 0){
            $scope.showUpcomingInvoice = false;
        }
        if(val == 1){
            $scope.showUpcomingInvoice = true;
        }
        if (s !== 'All') {
            $scope.showUpcomingInvoice = false;
            var checkbox = document.getElementById("myCheckbox");
            if (checkbox) {
                checkbox.checked = false;
            }
        }
        $scope.report_invoiceStatus = s;
        $scope.pageObj.currentPageInv = 1;
        $scope.getCustomerInvoiceList();  
    }
    $scope.exportInvoiceReportEmailModel = {
        email: ''
    }
    $scope.companyEmailforReports = auth.loggedInRole() != "administrator" ? auth.getSession().email : auth.getSession().companyEmail;    
    $scope.exportInvoiceReportStyle = '';
    $scope.viewInvoiceReportStyle = function() {                        
        $scope.exportInvoiceReportStyle = ngDialog.open({
            template: 'exportInvoiceReportStyle.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                
            }
            });    
    }
    $scope.downloadInvoiceReport = function() {
        $scope.viewInvoiceReportStyle();
    }
    $scope.selectInvoiceReportStyleType = function(type) {
        $scope.exportInvoiceReportStyle.close();
        $scope.exportInvoiceReportStyleType = type;
        $scope.showEmailInvoiceOpenPopup();
    }
    $scope.showEmailInvoiceOpenPopup = function(){
        $scope.exportInvoiceReportEmailModel.email = $scope.companyEmailforReports; 
        $scope.showEmailInvoiceOpenPopupModal = ngDialog.open({
            template: 'sentReportEmailPopupReportPage.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {
                $scope.exportInvoiceReportStyleType = '';
                $scope.exportInvoiceReportEmailModel.email = $scope.companyEmailforReports;                
            }
            });
    }
    $scope.reportPageErrorMsg = '';
    $scope.sendInvoiceReport = function() {
        $scope.exportInvoiceReportisSending = true;
        var sendReportParams = {
            email: $scope.exportInvoiceReportEmailModel.email,
            reportType: $scope.exportInvoiceReportStyleType,
            // style: null
        }
        apiGateWay.send('/send_email_reports', sendReportParams).then(function(response) {
            if (response.data.status == 200 && response.data.data.reportId) {
                $scope.exportInvoiceReportGenerateProcessStart = true;
                var params = $scope.exportInvoiceReportParams;
                params.reportId = response.data.data.reportId;
                $scope.generateReportByReportId(params);
                setTimeout(function(){
                    $scope.exportInvoiceReportGenerateProcessStart = false;
                    $scope.exportInvoiceReportisSending = false;                       
                    $scope.showEmailInvoiceOpenPopupModal.close();
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
            $scope.exportInvoiceReportisSending = false;
        });
    }
    $scope.generateReportByReportId = function(params) {       
        var apiURL = '/simple_invoice_report';
        if ($scope.exportInvoiceReportStyleType === 'InvoiceLineItemReport') {
            apiURL = '/invoice_line_item_report';
        }
        delete params.length;
        delete params.page;
        apiGateWay.get(apiURL, params).then(function(response) {
            // Report sent
        }, function(error){
        });
    }
    $scope.setParamFilters = function() {
        $rootScope.param_invoiceStatus = $scope.report_invoiceStatus;
        $rootScope.param_filterDurationInvoice = $scope.selectedFilterRange;
        $rootScope.param_fromDateInvoice = $scope.invDate.fromDate;
        $rootScope.param_toDateInvoice = $scope.invDate.toDate;
    }
    $rootScope.rootGetCustomerInvoiceList = () => {
        $scope.getCustomerInvoiceList(); 
    }

    $scope.bulkAction = function(action) {
        if(action.value == 'add line item'){
            $scope.addLineItemActionsPageModal = ngDialog.open({
                template: 'addLineItemActionsPage.html',
                className: 'ngdialog-theme-default v-center',
                overlay: true,
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function() {    
                    $scope.bundleSearchText = '';
                    $scope.productData = [];
                }
            });
        }
        else if (action.value == 'printed' && !$scope.upcomingSelected){
            $scope.bulkActionConfirmTitle = action.value;
            $scope.bulkActionInvoices();
        }
        else{
            $scope.bulkActionConfirmTitle = action.value;
            $scope.bulkActionsConfirmModal = ngDialog.open({
                template: 'bulkActionsConfirm.html',
                className: 'ngdialog-theme-default v-center',
                overlay: true,
                closeByNavigation: true,
                scope: $scope,
                preCloseCallback: function() {               
                }
            });
        }
    }

    $scope.showItemPrint = true;
    $scope.progressPercent = 0;
    $scope.bulkActionInvoices = function(){
        $scope.progressPercent = 0;
        // $scope.arrayOfIds = [];
        // $scope.arrayOfIds = $scope.invoiceList
        //     .filter(item => item.selected) // Filter selected items
        //     .map(item => item.id) // Extract IDs

        let params = {};
        if ($scope.invDate.fromDate != '' && $scope.invDate.toDate != '') {
            params.fromDate = $filter('date')(new Date($scope.invDate.fromDate), 'yyyy-MM-dd');
            params.toDate = $filter('date')(new Date($scope.invDate.toDate), 'yyyy-MM-dd');
        }
        params.duration = $scope.selectedFilterRange;
        params.invoiceStatus =  $scope.report_invoiceStatus;
        params.showUpcomingInvoice = $scope.showUpcomingInvoice;
        // params.invoice_ids = $scope.arrayOfIds;
        
        if ($scope.bulkActionConfirmTitle === 'send') {
            var endpoint = '/send_email_to_invoices';
        }
        else if ($scope.bulkActionConfirmTitle === 'mark as sent' || $scope.bulkActionConfirmTitle === 'mark as unsent') {
            var endpoint = '/mark_invoices';
            if ($scope.bulkActionConfirmTitle === 'mark as sent') {
                params.action = 'Sent';
            }
            else {
                params.action = 'Unsent';
            }
        }
        else if ($scope.bulkActionConfirmTitle === 'delete') {
            var endpoint = '/delete_invoices';
        }
        else if($scope.bulkActionConfirmTitle === 'printed'){
            var endpoint = '/print_invoices';
            $scope.bulkActionsConfirmModal = false;
        }
        $scope.invoiceMaxIds = 10;
        $scope.bulkActionProcessing = true;
        $scope.allInvoiceDetails = [];
        const chunkedIds = [];
        for (let i = 0; i < $scope.arrayOfIds.length; i += $scope.invoiceMaxIds) {
            const ids = $scope.arrayOfIds.slice(i, i + $scope.invoiceMaxIds);
            chunkedIds.push(ids);
        }  
        saveChunkedCustomers(0);
        function saveChunkedCustomers(index) { 
            var isFinalHit = index === chunkedIds.length - 1;
            if (index < chunkedIds.length) {
                params.invoice_ids = chunkedIds[index];
                params.isFinalHit = isFinalHit;
                apiGateWay.send(endpoint, params).then(function (response) {
                    if (response.data.status == 200) {
                        if (isFinalHit) {
                            $scope.arrayOfIds = []; 
                            $scope.progressPercent = 100; 
                            if($scope.bulkActionConfirmTitle === 'printed'){
                                $scope.bulkActionProcessing = false;
                                $scope.bulkActionSuccessType = typeof response.data.message;
                                response.data.data.forEach(function(item) {
                                    $scope.allInvoiceDetails.push(item);
                                });
                                $scope.bulkActionSuccess = false;
                                $scope.showItemPrint = false;
                                setTimeout(function(){
                                $scope.$window.print();
                                $scope.showItemPrint = true;
                                },500);
                            }
                            else{
                                $scope.getCustomerInvoiceList();
                                $scope.bulkActionSuccessType = typeof response.data.message;
                                $scope.bulkActionSuccess = response.data.message;
                                $scope.bulkActionProcessing = false;
                                setTimeout(function(){
                                    $scope.bulkActionSuccess = false;
                                }, 2000);
                            }
                        } else {
                            if($scope.bulkActionConfirmTitle === 'printed'){
                                response.data.data.forEach(function(item) {
                                    $scope.allInvoiceDetails.push(item);
                                });
                            }
                            $scope.progressPercent = Math.ceil(((index + 1) / chunkedIds.length) * 100);                                                  
                            saveChunkedCustomers(index + 1);
                        }
                    } else {
                        $scope.bulkActionError = response.data.error;
                        setTimeout(function(){
                            $scope.bulkActionError = false;
                        }, 2000);
                        $scope.bulkActionProcessing = false;
                    }
                }, function (error) {
                    $scope.bulkActionError = error;
                    setTimeout(function(){
                        $scope.bulkActionError = false;
                    }, 2000);
                    $scope.bulkActionProcessing = false;
                });
            }
        }
    }

    $scope.jobArray = [];
    $scope.jobArrayGroup = [];
    $scope.invoices = [];
    $scope.jobArrayObj = {};
    $scope.uniqueDatePrint = function(job,details){
        // if(job.groupId) {
        //     jobDate = $filter('mysqlTojsDate')(job.jobDate)
        //     jobDate = $filter('date')(jobDate, 'MM/dd/yyyy')
        //     $scope.jobArrayGroup.push({jobDate, groupId: job.groupId})
        //     //$scope.jobArrayGroup = _.uniqBy($scope.jobArrayGroup, 'jobDate');
        //     $scope.jobArrayGroup = _.uniqBy($scope.jobArrayGroup, 'groupId');
        //     $scope.jobArrayGroup = _.sortBy($scope.jobArrayGroup, 'jobDate');
        //     $scope.jobArray = $scope.jobArrayGroup.map(o => {return o.jobDate});
        // } else {
        //     jobDate = $filter('mysqlTojsDate')(job.jobDate)
        //     jobDate = $filter('date')(jobDate, 'MM/dd/yyyy')
        //     $scope.jobArray.push(jobDate);
        //     $scope.jobArray = _.uniqBy($scope.jobArray);
        //     $scope.jobArray = _.sortBy($scope.jobArray);
        // }
        jobDate = $filter('mysqlTojsDate')(job.jobDate)
        jobDate = $filter('date')(jobDate, 'MM/dd/yyyy')
        $scope.invoices.push({
            date: jobDate,
            invoiceNo: details.invoiceNumber,
        });
        $scope.jobArrayObj = $scope.getUniqueDates($scope.invoices);
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

    $scope.getLineItemTitleFormatted = (title) => {
        if (title.includes(':')) {
            var titleArr = title.split(':')
            return titleArr[titleArr.length - 1];
        }
        return title
    }

    $scope.qtyDecimalConverter = (qty) => {
        _val = Number(qty);
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

    $scope.selectAll = false;
    $scope.arrayOfIds = [];
    $scope.paidSelected = false;
    $scope.upcomingSelected = false;
    $scope.toggleSelectAll = function() {
        $scope.arrayOfIds = [];
        var checkbox = document.getElementById("selectAllCheckbox");
        if(checkbox.checked) {
            $scope.selectAll = true;
            $scope.arrayOfIds = $scope.allInvoicesIds;
            $scope.upcomingSelected = $scope.allUpcomingInvoicesIds.length > 0;
            $scope.paidSelected = $scope.allpaidInvoicesIds.length > 0;
        }
        else{
            $scope.selectAll = false;
        }
        $scope.invoiceList.forEach(item => (item.selected = $scope.selectAll));
    }

    $scope.toggleSelectOne = function () {
        let filtered = $scope.invoiceList.filter(item => item.selected);
        $scope.invoiceList.forEach(function(item) {
            if (item.selected) {
                $scope.arrayOfIds.push(item.id);  
                $scope.arrayOfIds = [...new Set($scope.arrayOfIds)];
            }
            else{
                let index = $scope.arrayOfIds.indexOf(item.id);
                if (index !== -1) {
                    $scope.arrayOfIds.splice(index, 1);
                }
            }
        });
        if($scope.selectAll){
            $scope.invoiceList.forEach(function(item) {
                if(item.invoiceStatus == 'Upcoming'){
                    if (item.selected) {
                        $scope.allUpcomingInvoicesIds.push(item.id);  
                        $scope.allUpcomingInvoicesIds = [...new Set($scope.allUpcomingInvoicesIds)];
                    }
                    else {
                        let index = $scope.allUpcomingInvoicesIds.indexOf(item.id);
                        if (index !== -1) {
                            $scope.allUpcomingInvoicesIds.splice(index, 1);
                        } 
                    }
                }
                if(item.invoiceStatus == 'Paid'){
                    if (item.selected) {
                        $scope.allpaidInvoicesIds.push(item.id);  
                        $scope.allpaidInvoicesIds = [...new Set($scope.allpaidInvoicesIds)];
                    }
                    else {
                        let index = $scope.allpaidInvoicesIds.indexOf(item.id);
                        if (index !== -1) {
                            $scope.allpaidInvoicesIds.splice(index, 1);
                        } 
                    }
                }
            });
            $scope.upcomingSelected = $scope.allUpcomingInvoicesIds.length > 0;
            $scope.paidSelected = $scope.allpaidInvoicesIds.length > 0;
        }
        else{
            $scope.paidSelected = filtered.some(item => item.invoiceStatus === 'Paid');
            $scope.upcomingSelected = filtered.some(item => item.invoiceStatus === 'Upcoming');
        }
        var checkbox = document.getElementById("selectAllCheckbox");
        if ($scope.arrayOfIds.length == 0) {
            checkbox.checked = false;
        }
    }

    // $scope.searchProductPayload = {
    //     offset: 0,
    //     limit: 5,
    //     sortOrder: 'asc',
    //     sortColumn: 'name',
    //     category: 'Product-Service-Bundle',
    //     status: 1,
    //     name: '',
    //     rows: 0,
    //     hasMoreData: false
    // }
    // $scope.requiredProductPayload = () => {
    //     let payload = angular.copy($scope.searchProductPayload)
    //     delete payload.rows
    //     delete payload.hasMoreData
    //     return payload;
    // }
    // $scope.productNoItem = false;
    //
    //  $scope.showListForBundle = (searchText, offsetModified=false) => {
    //     // multiple request
    //     // let endpoint = '/product_services';
    //     // var currEnvironment = configConstant.currEnvironment;
    //     // var apiUrl = configConstant[currEnvironment].server;        
    //     // var pr = pendingRequests.get();        
    //     // if (pr.length > 0) {
    //     //     pr.forEach(function(r){
    //     //         if (r.url === apiUrl + endpoint) {                    
    //     //             r.canceller.resolve()
    //     //             return
    //     //         }
    //     //     })
    //     // } 
    //     // multiple request
    //      if (!offsetModified) {
    //         $scope.searchProductIntervalGap = 500;
    //         $scope.searchProductPayload.offset = 0;
    //         $scope.searchProductPayload.rows = 0;
    //         $scope.searchProductPayload.hasMoreData = false;
    //         $scope.productData = [];
    //     }
    //     $scope.searchProductPayload.name = searchText;
    //     $scope.searchText = searchText;
    //     $scope.bundleSearchText = searchText;        
    //     clearInterval($scope.searchInterval);       
    //     $scope.searchInterval = setTimeout(function() {   
    //         if(searchText.length>0){
    //             $scope.isBundleSearch = true;
    //             $scope.isProductPopupSearching = true;
    //             apiGateWay.get("/product_services", $scope.requiredProductPayload()).then(function(response) {
    //                 if (response.data.status == 200) {
    //                     $scope.searchProductPayload.rows = response.data.data.rows;                        
    //                     $scope.searchProductPayload.hasMoreData = (($scope.searchProductPayload.offset + 1) * $scope.searchProductPayload.limit) < response.data.data.rows;                        
    //                     let bundleSearchList = response.data.data.data;
    //                     let newProducts = [];
    //                     // Remvoed the exists services from autosuggested dropdown
    //                     // angular.forEach(bundleSearchList, (elementProduct, indexofservice) => {
    //                     //         if($scope.productServices.indexOf(elementProduct.name) === -1) {
    //                     //             newProducts.push(elementProduct);
    //                     //         } 
    //                     // }); 
    //                 // End
    //                 // bundleSearchList = newProducts;
    //                     // if($scope.productNoItem == true){
    //                     //     $scope.productBundleList = bundleSearchList;                            
    //                     // } else {
    //                     //     $scope.productBundleList = bundleSearchList.filter(ar => !$scope.productBundleListNew.find(rm => (rm.id === ar.id && ar.name === rm.name) ));
    //                     // }
   //         
    //                     angular.forEach(bundleSearchList, (element, index) => {
    //                         $scope.productBundleListCategory = element.category;
    //                     });
    //                     angular.forEach(bundleSearchList, (elementProduct, indexofservice) => {
    //                         $scope.productData.push(elementProduct)                            
    //                     }); 
    //                 } else {
    //                     $scope.isBundleSearch = false;
    //                     $scope.productBundleList = [];
    //                 }
    //                 $scope.isProcessing = false;
    //                 $scope.isProductPopupSearching = false;
    //                 // setTimeout(() => {
    //                 //     var objDiv = document.getElementsByClassName("ps-picker")[0];
    //                 //         objDiv.scrollTop = objDiv.scrollHeight;
    //                 // }, 100)
    //             });
    //         }else{
    //             $scope.isBundleSearch = false;
    //         }
    //     }, $scope.searchProductIntervalGap);        
    // }
    //
    // $scope.loadMoreProductData = () => { 
    //     // $scope.isProductPopupSearching = true;
    //     $scope.searchProductIntervalGap = 0;       
    //     clearInterval($scope.searchInterval);
    //     $scope.searchProductPayload.offset = $scope.searchProductPayload.offset + 1;
    //     $scope.showListForBundle($scope.searchProductPayload.name ? $scope.searchProductPayload.name : '', true)
    // }
    $scope.$on('productAddEvent', function(event, data) {
        if (data && data.widgetArea == 'invoiceList') {
            $scope.addProductToBundle(data);
        }
        event.stopPropagation();
    });
    $scope.addProductToBundle = (productBundleListCategory) => {
        $scope.productBundleListCategory = productBundleListCategory;
        $scope.showEmailInvoiceOpenPopupModal = ngDialog.open({
            template: 'confirmLineItem.html',
            className: 'ngdialog-theme-default v-center',
            overlay: true,
            closeByNavigation: true,
            scope: $scope,
            preCloseCallback: function() {  
            }
        });
    }

    $scope.addLineItemInvoices = function() {
        $scope.progressPercent = 0;
        $scope.addLineItemActionsPageModal.close();
        let bundleObj = [{
            "category":$scope.productBundleListCategory.category, 
            "bundleItemReference":$scope.productBundleListCategory.bundleItemReference?$scope.productBundleListCategory.bundleItemReference:null,
            "cost": $scope.productBundleListCategory.cost, 
            "id": $scope.productBundleListCategory.id, 
            "name": $scope.productBundleListCategory.name, 
            "price": $scope.productBundleListCategory.price, 
            "sku": $scope.productBundleListCategory.sku,
            "showIndividualPrice": $scope.productBundleListCategory.showIndividualPrice?$scope.productBundleListCategory.showIndividualPrice:0  ,
            "isChargeTax": $scope.productBundleListCategory.isChargeTax?$scope.productBundleListCategory.isChargeTax:0,
            "duration": $scope.productBundleListCategory.duration?$scope.productBundleListCategory.duration:"00:00", 
            "qty": $scope.productBundleListCategory.qty ? $scope.productBundleListCategory.qty : 1,
            "description": $scope.productBundleListCategory.description ? $scope.productBundleListCategory.description : ''
        }];
        let params = {
            itemReference: bundleObj,
        }
        if ($scope.invDate.fromDate != '' && $scope.invDate.toDate != '') {
            params.fromDate = $filter('date')(new Date($scope.invDate.fromDate), 'yyyy-MM-dd');
            params.toDate = $filter('date')(new Date($scope.invDate.toDate), 'yyyy-MM-dd');
        }
        params.duration = $scope.selectedFilterRange;
        params.invoiceStatus =  $scope.report_invoiceStatus;
        params.showUpcomingInvoice = $scope.showUpcomingInvoice;
        $scope.bulkActionProcessing = true;
        $scope.invoiceMaxIds = 5;
        const chunkedIds = [];
        for (let i = 0; i < $scope.arrayOfIds.length; i += $scope.invoiceMaxIds) {
            const ids = $scope.arrayOfIds.slice(i, i + $scope.invoiceMaxIds);
            chunkedIds.push(ids);
        }  
        saveChunkedCustomers(0);
        function saveChunkedCustomers(index) { 
            var isFinalHit = index === chunkedIds.length - 1;
            if (index < chunkedIds.length) {
                params.invoice_ids = chunkedIds[index];
                params.isFinalHit = isFinalHit;
                apiGateWay.send('/add_lineitems_to_invoices', params).then(function (response) {
                    if (response.data.status == 200) {
                        if (isFinalHit) {
                            $scope.progressPercent = 100; 
                            $scope.getCustomerInvoiceList();
                            $scope.bulkActionProcessing = false;
                            $scope.bulkActionSuccessType = typeof response.data.message;
                            $scope.bulkActionSuccess = response.data.message;
                            setTimeout(function(){
                                $scope.bulkActionSuccess = false;
                            }, 2000);
                        }
                        else {
                            $scope.progressPercent = Math.ceil(((index + 1) / chunkedIds.length) * 100);                                                  
                            saveChunkedCustomers(index + 1);
                        }
                    } else {
                        $scope.bulkActionError = response.data.error;
                        setTimeout(function(){
                            $scope.bulkActionError = false;
                        }, 2000);
                        $scope.bulkActionProcessing = false;
                    }
                }, function (error) {
                    $scope.bulkActionError = response.data.error;
                    setTimeout(function(){
                        $scope.bulkActionError = false;
                    }, 2000);
                    $scope.bulkActionProcessing = false;
                });
            }
        }
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
});